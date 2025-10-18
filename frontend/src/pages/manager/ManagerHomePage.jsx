import { motion } from "framer-motion";
import { ManagerNavbar } from "@/components/manager/ManagerNavbar";
import { Sidebar } from "@/components/manager/Sidebar";
import { SummaryCards } from "@/components/manager/SummaryCards";
import { KanbanBoard } from "@/components/manager/KanbanBoard";
import { StaffPerformanceChart } from "@/components/manager/StaffPerformanceChart";
import { StaffList } from "@/components/manager/StaffList";
import { FeedbackSummary } from "@/components/manager/FeedbackSummary";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { taskAPI } from "@/services/taskManagementAPI";
import { Button } from "@/components/manager/ManagerButton";
import {
  ManagerSelect,
  ManagerSelectContent,
  ManagerSelectItem,
  ManagerSelectTrigger,
  ManagerSelectValue,
} from "@/components/manager/ManagerSelect";
import { ManagerInput } from "@/components/manager/ManagerInput";
import { ClipboardList, Clock, CheckCircle2, Star, Users, RotateCw, Filter } from "lucide-react";

const INITIAL_BOARD_STATE = Object.freeze({ pending: [], inProgress: [], completed: [] });

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "inProgress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const DEPARTMENT_OPTIONS = [
  { value: "all", label: "All Departments" },
  { value: "Housekeeping", label: "Housekeeping" },
  { value: "Front Desk", label: "Front Desk" },
  { value: "Kitchen", label: "Kitchen" },
  { value: "Maintenance", label: "Maintenance" },
  { value: "Service", label: "Guest Services" },
];

const PRIORITY_OPTIONS = [
  { value: "all", label: "All Priorities" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const FILTER_INITIAL_STATE = Object.freeze({
  status: "all",
  department: "all",
  priority: "all",
  search: "",
});

const normalizeStatusForColumn = (status) => {
  if (!status) return "pending";
  const key = String(status).toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
  if (key === "in_progress" || key === "inprogress") return "inProgress";
  if (key === "completed") return "completed";
  if (key === "cancelled") return "cancelled";
  return "pending";
};

const mapStatusToApiValue = (status) => {
  if (!status || status === "all") return undefined;
  const normalized = String(status).toLowerCase().replace(/[-_\s]+/g, "");
  const map = {
    pending: "Pending",
    assigned: "Assigned",
    inprogress: "In-Progress",
    completed: "Completed",
  };
  return map[normalized] || status;
};

const toTitleCase = (value, fallback = "") => {
  if (!value) return fallback;
  return String(value)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getPersonName = (person) => {
  if (!person) return "";
  if (typeof person === "string") {
    const value = person.trim();
    if (/^[a-f\d]{24}$/i.test(value)) {
      return "";
    }
    return value;
  }
  const parts = [person.firstName, person.lastName].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return person.name || person.fullName || person.email || "";
};

const formatDueDateLabel = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
};

const formatLocationLabel = (task) => {
  if (!task) return "";
  if (task.roomNumber) return `Room ${task.roomNumber}`;
  if (task.room) return `Room ${task.room}`;
  if (task.location) return toTitleCase(task.location, "General Area");
  if (task.category) return toTitleCase(task.category, "General Area");
  return "General Area";
};

const computeMatchScore = (task) => {
  const priority = String(task?.priority || "").toLowerCase();
  const base = {
    urgent: 96,
    high: 92,
    medium: 86,
    normal: 86,
    low: 82,
  }[priority] ?? 84;

  let score = base;
  if (task?.dueDate) {
    const due = new Date(task.dueDate);
    if (!Number.isNaN(due.getTime())) {
      const hoursUntilDue = (due.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilDue < 0) score += 3;
      else if (hoursUntilDue < 4) score += 2;
    }
  }

  return Math.max(55, Math.min(99, Math.round(score)));
};

const mapTaskTypeToDepartment = (type) => {
  if (!type) return "General";
  const normalized = String(type).toLowerCase();
  const mapping = {
    food: "Kitchen",
    cleaning: "Housekeeping",
    maintenance: "Maintenance",
    services: "Guest Services",
    service: "Guest Services",
  };
  return mapping[normalized] || toTitleCase(type, "General");
};

const buildRecommendedStaff = (task, assignedName) => {
  const rawSuggestions = Array.isArray(task?.recommendedStaff)
    ? task.recommendedStaff
    : Array.isArray(task?.suggestedStaff)
      ? task.suggestedStaff
      : [];

  const normalized = rawSuggestions
    .map((staff, index) => {
      const name = getPersonName(staff) || `Suggested Staff ${index + 1}`;
      return {
        name,
        role: staff?.role || staff?.position || task?.department || mapTaskTypeToDepartment(task?.type) || "Team Member",
        match: staff?.match || staff?.score || Math.max(60, computeMatchScore(task) - index * 3),
        avatar: name,
      };
    })
    .filter((staff) => staff.name);

  if (normalized.length > 0) {
    return normalized;
  }

  const fallbackName = assignedName || "Available Staff";
  return [
    {
      name: fallbackName,
      role: task?.department || mapTaskTypeToDepartment(task?.type) || "Staff Member",
      match: computeMatchScore(task),
      avatar: fallbackName,
    },
  ];
};

const transformTaskForBoard = (task) => {
  if (!task) return null;

  const statusKey = normalizeStatusForColumn(task.status);
  if (statusKey === "cancelled") {
    return null;
  }

  const assignedSource =
    task.assignedTo ||
    task.assignedStaff ||
    task.assigned_user ||
    task.assignedUser ||
    task.assigned;
  const assignedName = getPersonName(assignedSource);
  const locationLabel = formatLocationLabel(task);
  const priorityLabel = toTitleCase(task.priority, "Normal");
  const dueDate = task.dueDate || task.expectedCompletion || task.completionTime;
  const recommendedStaff = buildRecommendedStaff(task, assignedName);
  const aiMatch = task.aiMatch || task.matchScore || recommendedStaff[0]?.match || computeMatchScore(task);
  const departmentLabel = toTitleCase(task.department, mapTaskTypeToDepartment(task.type));
  const description =
    task.description ||
    task.details ||
    task.summary ||
    task.notes?.manager ||
    task.notes?.staff ||
    (typeof task.notes === "string" ? task.notes : undefined) ||
    "No additional notes provided for this task.";

  return {
    id: String(task._id || task.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    title: task.title || toTitleCase(task.type, "Task") || "Task",
    department: departmentLabel,
    priority: priorityLabel,
    priorityLabel,
    suggestedStaff: recommendedStaff[0]?.name || assignedName || "Awaiting assignment",
    assignedStaffName: assignedName,
    aiMatch,
    room: task.roomNumber || task.room || undefined,
    locationLabel,
    dueDate,
    dueDateLabel: formatDueDateLabel(dueDate),
    estimatedDuration: task.estimatedDuration || task.estimatedHours || task.duration || null,
    description,
    recommendedStaff,
    rawTask: task,
    statusKey,
  };
};

const ManagerHomePage = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("dashboard");
  const [filters, setFilters] = useState(FILTER_INITIAL_STATE);
  const [boardData, setBoardData] = useState(INITIAL_BOARD_STATE);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
    toast.info(!sidebarCollapsed ? "Sidebar collapsed" : "Sidebar expanded", {
      duration: 1500,
    });
  }, [sidebarCollapsed]);

  const handleMenuItemClick = useCallback((item) => {
    setActiveMenuItem(item.id);

    if (item.id === "profile") {
      navigate("/manager/profile");
      return;
    }

    toast.success(`Navigating to ${item.label}`, {
      description: "Feature coming soon!",
      duration: 2000,
    });
  }, [navigate]);

  const loadTaskStats = useCallback(async () => {
    try {
      const data = await taskAPI.getTaskStats();
      const payload = data?.data || data;
      if (!payload) return;

      const overview = payload.overview || payload;

      setStats({
        totalTasks: overview.totalTasks ?? overview.total ?? 0,
        inProgress: overview.inProgressTasks ?? overview.inProgress ?? overview.active ?? 0,
        completed: overview.completedTasks ?? overview.completed ?? overview.done ?? 0,
        avgRating: overview.averageRating ?? overview.feedbackScore ?? 4.6,
        staffOnline: payload.staffOnline ?? payload.activeStaff ?? 18,
      });
    } catch (error) {
      console.error("Failed to load task stats", error);
    }
  }, []);

  const loadTasks = useCallback(async (currentFilters, showToast = false) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const params = {
        status: mapStatusToApiValue(currentFilters.status),
        department: currentFilters.department === "all" ? undefined : currentFilters.department,
        priority: currentFilters.priority === "all" ? undefined : currentFilters.priority,
        search: currentFilters.search?.trim() || undefined,
      };

      const response = await taskAPI.getAllTasks(params);
      const payload = response?.data || response;
      const tasks = Array.isArray(payload)
        ? payload
        : payload?.tasks
          || payload?.data?.tasks
          || [];

      const nextBoard = { pending: [], inProgress: [], completed: [] };
      tasks.forEach((task) => {
        const normalized = transformTaskForBoard(task);
        if (normalized && nextBoard[normalized.statusKey]) {
          nextBoard[normalized.statusKey].push(normalized);
        }
      });

      setBoardData(nextBoard);
      if (showToast) {
        toast.success("Task board updated", { description: "Latest data synced from server." });
      }
    } catch (error) {
      console.error("Failed to load tasks", error);
      setErrorMessage(error?.response?.data?.message || error.message || "Failed to load tasks");
      toast.error("Unable to fetch tasks", {
        description: "Please check your connection or try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadTasks(filters, true), loadTaskStats()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [filters, loadTaskStats, loadTasks]);

  useEffect(() => {
    loadTasks(filters);
    loadTaskStats();
  }, [filters, loadTaskStats, loadTasks]);

  const summaryCards = useMemo(() => {
    if (!stats) {
      return [
        { icon: ClipboardList, label: "Total Tasks", value: boardData.pending.length + boardData.inProgress.length + boardData.completed.length, iconColor: "#38bdf8" },
        { icon: Clock, label: "In Progress", value: boardData.inProgress.length, iconColor: "#facc15" },
        { icon: CheckCircle2, label: "Completed", value: boardData.completed.length, iconColor: "#22c55e" },
        { icon: Star, label: "Avg Rating", value: 4.6, iconColor: "#facc15", suffix: "/5" },
        { icon: Users, label: "Staff Online", value: 18, iconColor: "#22c55e" },
      ];
    }

    return [
      { icon: ClipboardList, label: "Total Tasks", value: stats.totalTasks, iconColor: "#38bdf8" },
      { icon: Clock, label: "In Progress", value: stats.inProgress, iconColor: "#facc15" },
      { icon: CheckCircle2, label: "Completed", value: stats.completed, iconColor: "#22c55e" },
      { icon: Star, label: "Avg Rating", value: stats.avgRating, iconColor: "#facc15", suffix: "/5" },
      { icon: Users, label: "Staff Online", value: stats.staffOnline, iconColor: "#22c55e" },
    ];
  }, [boardData, stats]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSearchChange = useCallback((event) => {
    handleFilterChange("search", event.target.value);
  }, [handleFilterChange]);

  const handleTaskApprove = useCallback(async (task, staffName) => {
    if (!task?.rawTask?._id) return;

    try {
      await taskAPI.updateTaskStatus(task.rawTask._id, { status: "In-Progress" });
      toast.success("Task moved to In Progress", {
        description: `${task.title} is now being handled by ${staffName}`,
      });
      await Promise.all([loadTasks(filters), loadTaskStats()]);
    } catch (error) {
      console.error("Unable to approve task", error);
      toast.error("Failed to move task", {
        description: error?.response?.data?.message || error.message,
      });
    }
  }, [filters, loadTaskStats, loadTasks]);

  const filterBar = (
    <div className="rounded-3xl border border-[#162a52] bg-[#0e1f42]/80 p-6 shadow-[0_18px_40px_rgba(8,14,29,0.55)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-[#8ba3d0]">Status</p>
            <ManagerSelect value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
              <ManagerSelectTrigger className="border-[#1b335f] bg-[#10234f] text-[#d6e2ff]">
                <ManagerSelectValue placeholder="Select status" />
              </ManagerSelectTrigger>
              <ManagerSelectContent className="border-[#1b335f] bg-[#0f1f3d] text-[#d6e2ff]">
                {STATUS_OPTIONS.map((option) => (
                  <ManagerSelectItem key={option.value} value={option.value}>
                    {option.label}
                  </ManagerSelectItem>
                ))}
              </ManagerSelectContent>
            </ManagerSelect>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-[#8ba3d0]">Department</p>
            <ManagerSelect value={filters.department} onValueChange={(value) => handleFilterChange("department", value)}>
              <ManagerSelectTrigger className="border-[#1b335f] bg-[#10234f] text-[#d6e2ff]">
                <ManagerSelectValue placeholder="Select department" />
              </ManagerSelectTrigger>
              <ManagerSelectContent className="border-[#1b335f] bg-[#0f1f3d] text-[#d6e2ff]">
                {DEPARTMENT_OPTIONS.map((option) => (
                  <ManagerSelectItem key={option.value} value={option.value}>
                    {option.label}
                  </ManagerSelectItem>
                ))}
              </ManagerSelectContent>
            </ManagerSelect>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-[#8ba3d0]">Priority</p>
            <ManagerSelect value={filters.priority} onValueChange={(value) => handleFilterChange("priority", value)}>
              <ManagerSelectTrigger className="border-[#1b335f] bg-[#10234f] text-[#d6e2ff]">
                <ManagerSelectValue placeholder="Select priority" />
              </ManagerSelectTrigger>
              <ManagerSelectContent className="border-[#1b335f] bg-[#0f1f3d] text-[#d6e2ff]">
                {PRIORITY_OPTIONS.map((option) => (
                  <ManagerSelectItem key={option.value} value={option.value}>
                    {option.label}
                  </ManagerSelectItem>
                ))}
              </ManagerSelectContent>
            </ManagerSelect>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-[#8ba3d0]">Search</p>
            <ManagerInput
              value={filters.search}
              onChange={handleSearchChange}
              placeholder="Search tasks or staff"
              className="border-[#1b335f] bg-[#10234f] text-[#d6e2ff] placeholder:text-[#8ba3d0]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setFilters({ ...FILTER_INITIAL_STATE })}
            className="border-[#1b335f] bg-[#10234f] text-[#d6e2ff] hover:bg-[#132b5f]"
          >
            <Filter className="mr-2 h-4 w-4" />
            Reset filters
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-[#facc15] text-[#0b1b3c] hover:bg-[#f9c513]"
          >
            <RotateCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>
      {errorMessage && (
        <p className="mt-4 text-sm text-[#f87171]">{errorMessage}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#040b1e] via-[#081a3c] to-[#0b1f47]">
      <ManagerNavbar onToggleSidebar={handleToggleSidebar} />

      <div className="mt-[88px] flex w-full">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={handleToggleSidebar}
          activeItem={activeMenuItem}
          onItemClick={handleMenuItemClick}
        />

        <main className="flex-1 space-y-6 overflow-y-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
            <p className="text-muted-foreground">Welcome back, Sarah! Here's what's happening today.</p>
          </motion.div>

          <SummaryCards cards={summaryCards} />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Task Management</h2>
                <p className="text-sm text-muted-foreground">Smart kanban board with AI-powered staff suggestions</p>
              </div>
            </div>

            {filterBar}

            <KanbanBoard
              tasksByStatus={boardData}
              onTaskApprove={handleTaskApprove}
              isLoading={isLoading}
              emptyMessage="No tasks match your filters"
            />
          </motion.div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <StaffPerformanceChart />
            </div>
            <div>
              <StaffList />
            </div>
          </div>

          <FeedbackSummary />

          <footer className="mt-12 border-t border-border/50 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              © 2025 Royal Palm Hotel Task Management System — All Rights Reserved
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default ManagerHomePage;
