import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import useAuth from "@/hooks/useAuth";
import { taskAPI } from "@/services/taskManagementAPI";
import { ManagerLayout } from "@/components/manager";
import { SummaryCards } from "@/components/manager/SummaryCards";
import { KanbanBoard } from "@/components/manager/KanbanBoard";
import { Button } from "@/components/manager/ManagerButton";
import {
  ManagerSelect,
  ManagerSelectContent,
  ManagerSelectItem,
  ManagerSelectTrigger,
  ManagerSelectValue,
} from "@/components/manager/ManagerSelect";
import { ManagerInput } from "@/components/manager/ManagerInput";
import { ClipboardList, Clock, CheckCircle2, Star, Users, RotateCw, Filter, Plus } from "lucide-react";
import ManagerPageHeader from "@/components/manager/ManagerPageHeader";
import { MANAGER_CONTENT_CLASS, MANAGER_PAGE_CONTAINER_CLASS, MANAGER_SECTION_CLASS } from "./managerStyles";
import { TaskCreateDialog } from "@/components/manager/TaskCreateDialog";

const INITIAL_BOARD_STATE = Object.freeze({ pending: [], inProgress: [], completed: [] });

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "inProgress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const DEPARTMENT_OPTIONS = [
  { value: "all", label: "All Departments" },
  { value: "cleaning", label: "Cleaning" },
  { value: "Maintenance", label: "Maintenance" },
  { value: "service", label: "Service" },
  { value: "Kitchen", label: "Kitchen" },
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
  if (key === "assigned") return "inProgress";
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
    kitchen: "Kitchen",
    cleaning: "cleaning",
    housekeeping: "cleaning",
    maintenance: "Maintenance",
    services: "service",
    service: "service",
    concierge: "service",
    "room service": "service",
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
        staffId: staff?.staffId || staff?._id || staff?.id || staff?.userId || null,
        email: staff?.email || null,
      };
    })
    .filter((staff) => staff.name && staff.staffId);

  if (normalized.length > 0) {
    return normalized;
  }

  return [];
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

const ManagerTaskManagementPage = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState(FILTER_INITIAL_STATE);
  const [boardData, setBoardData] = useState(INITIAL_BOARD_STATE);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSidebarToggle = useCallback((isCollapsed) => {
    toast.info(isCollapsed ? "Sidebar collapsed" : "Sidebar expanded", {
      duration: 1500,
    });
  }, []);

  const handleMenuItemSelect = useCallback((item) => {
    if (item.id === "tasks") {
      toast.success("You're already in Task Management", {
        duration: 1500,
      });
      return false;
    }

    if (item.id === "dashboard" || item.id === "staff" || item.id === "feedback" || item.id === "profile" || item.id === "reports") {
      return undefined;
    }

    toast.info(`${item.label} is coming soon`, {
      description: "We're polishing the manager experience.",
      duration: 1800,
    });

    return false;
  }, []);

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
        avgRating: Number(overview.averageRating ?? overview.feedbackScore ?? 0) || 0,
        staffOnline: Number(payload.staffOnline ?? payload.activeStaff ?? 0) || 0,
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

  const displayName = useMemo(
    () =>
      user?.fullName ||
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      user?.name ||
      user?.email ||
      "Manager",
    [user]
  );

  const summaryCards = useMemo(() => {
    if (!stats) {
      return [
        { icon: ClipboardList, label: "Total Tasks", value: boardData.pending.length + boardData.inProgress.length + boardData.completed.length, iconColor: "#38bdf8" },
        { icon: Clock, label: "In Progress", value: boardData.inProgress.length, iconColor: "#facc15" },
        { icon: CheckCircle2, label: "Completed", value: boardData.completed.length, iconColor: "#22c55e" },
        { icon: Star, label: "Avg Rating", value: 0, iconColor: "#facc15", suffix: "/5" },
        { icon: Users, label: "Staff Online", value: 0, iconColor: "#22c55e" },
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

  const createDepartmentOptions = useMemo(
    () => DEPARTMENT_OPTIONS.filter((option) => option.value !== "all"),
    [],
  );

  const createPriorityOptions = useMemo(
    () => PRIORITY_OPTIONS.filter((option) => option.value !== "all"),
    [],
  );

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSearchChange = useCallback((event) => {
    handleFilterChange("search", event.target.value);
  }, [handleFilterChange]);

  const handleTaskAssign = useCallback(async (task, staff) => {
    if (!task?.rawTask?._id) {
      throw new Error("Task identifier is missing.");
    }

    if (!staff?.staffId) {
      throw new Error("Select a staff member with an active account.");
    }

    try {
      await taskAPI.assignTask(task.rawTask._id, { staffId: staff.staffId });
      await taskAPI.updateTaskStatus(task.rawTask._id, { status: "In-Progress" });
      await Promise.all([loadTasks(filters), loadTaskStats()]);
    } catch (error) {
      console.error("Unable to assign task", error);
      const message = error?.response?.data?.message || error.message || "Failed to assign task";
      throw new Error(message);
    }
  }, [filters, loadTaskStats, loadTasks]);

  const handleTaskCreate = useCallback(
    async (values) => {
      const payload = {
        title: values.title.trim(),
        department: values.department,
        priority: values.priority,
        status: "Pending",
      };

      if (values.dueDate) {
        const parsedDueDate = new Date(values.dueDate);
        if (!Number.isNaN(parsedDueDate.getTime())) {
          payload.dueDate = parsedDueDate.toISOString();
        }
      }

      const estimatedDuration = Number(values.estimatedDuration);
      if (Number.isFinite(estimatedDuration) && estimatedDuration > 0) {
        payload.estimatedDuration = Math.round(estimatedDuration);
      }

      if (values.location?.trim()) {
        payload.location = values.location.trim();
      }

      if (values.roomNumber?.trim()) {
        payload.roomNumber = values.roomNumber.trim();
      }

      if (values.description?.trim()) {
        payload.description = values.description.trim();
      }

      if (values.managerNote?.trim()) {
        payload.notes = { manager: values.managerNote.trim() };
      }

      try {
        await taskAPI.createTask(payload);
        toast.success("Task created", {
          description: `${payload.title} is now queued for assignment.`,
        });
        await Promise.all([loadTasks(filters), loadTaskStats()]);
      } catch (error) {
        console.error("Unable to create task", error);
        const message = error?.response?.data?.message || error.message || "Failed to create task";
        throw new Error(message);
      }
    },
    [filters, loadTaskStats, loadTasks],
  );

  const filterBar = (
    <div className={MANAGER_SECTION_CLASS}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Status</p>
            <ManagerSelect value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
              <ManagerSelectTrigger className="border-white/15 bg-white/[0.08] text-white placeholder:text-white/60">
                <ManagerSelectValue placeholder="Select status" />
              </ManagerSelectTrigger>
              <ManagerSelectContent className="border-white/10 bg-[#0f1f3d]/95 text-white">
                {STATUS_OPTIONS.map((option) => (
                  <ManagerSelectItem key={option.value} value={option.value}>
                    {option.label}
                  </ManagerSelectItem>
                ))}
              </ManagerSelectContent>
            </ManagerSelect>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Department</p>
            <ManagerSelect value={filters.department} onValueChange={(value) => handleFilterChange("department", value)}>
              <ManagerSelectTrigger className="border-white/15 bg-white/[0.08] text-white">
                <ManagerSelectValue placeholder="Select department" />
              </ManagerSelectTrigger>
              <ManagerSelectContent className="border-white/10 bg-[#0f1f3d]/95 text-white">
                {DEPARTMENT_OPTIONS.map((option) => (
                  <ManagerSelectItem key={option.value} value={option.value}>
                    {option.label}
                  </ManagerSelectItem>
                ))}
              </ManagerSelectContent>
            </ManagerSelect>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Priority</p>
            <ManagerSelect value={filters.priority} onValueChange={(value) => handleFilterChange("priority", value)}>
              <ManagerSelectTrigger className="border-white/15 bg-white/[0.08] text-white">
                <ManagerSelectValue placeholder="Select priority" />
              </ManagerSelectTrigger>
              <ManagerSelectContent className="border-white/10 bg-[#0f1f3d]/95 text-white">
                {PRIORITY_OPTIONS.map((option) => (
                  <ManagerSelectItem key={option.value} value={option.value}>
                    {option.label}
                  </ManagerSelectItem>
                ))}
              </ManagerSelectContent>
            </ManagerSelect>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Search</p>
            <ManagerInput
              value={filters.search}
              onChange={handleSearchChange}
              placeholder="Search tasks or staff"
              className="border-white/15 bg-white/[0.08] text-white placeholder:text-white/50"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setFilters({ ...FILTER_INITIAL_STATE })}
            className="border-white/15 bg-white/[0.08] text-white shadow-[0_18px_40px_rgba(8,14,29,0.35)] backdrop-blur-lg transition-transform duration-300 hover:border-white/25 hover:bg-white/[0.12] hover:-translate-y-0.5"
          >
            <Filter className="mr-2 h-4 w-4" />
            Reset filters
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 text-slate-900 shadow-[0_24px_50px_rgba(251,191,36,0.32)] transition-transform duration-300 hover:from-amber-200 hover:via-amber-300 hover:to-amber-200 hover:shadow-[0_28px_60px_rgba(251,191,36,0.4)] hover:-translate-y-0.5"
          >
            <RotateCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh board
          </Button>
        </div>
      </div>
      {errorMessage && (
        <p className="mt-4 text-sm text-rose-300">{errorMessage}</p>
      )}
    </div>
  );

  return (
    <ManagerLayout
      activeItem="tasks"
      onSidebarToggle={handleSidebarToggle}
      onMenuItemSelect={handleMenuItemSelect}
      contentClassName={MANAGER_CONTENT_CLASS}
    >
      <div className={`${MANAGER_PAGE_CONTAINER_CLASS} space-y-6`}>
        <ManagerPageHeader
          title="Task Management"
          subtitle={`${displayName}, orchestrate assignments and track real-time execution.`}
          accentChips={["Operations Workspace", "Manager orchestrated"]}
          actions={(
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="bg-[#facc15] text-[#0b1b3c] shadow-[0_18px_40px_rgba(18,14,5,0.45)] transition-transform duration-300 hover:bg-[#f9c513] hover:-translate-y-0.5 disabled:opacity-70"
              >
                <Plus className="mr-2 h-4 w-4" />
                New task
              </Button>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="border-white/15 bg-white/[0.08] text-white shadow-[0_18px_40px_rgba(8,14,29,0.35)] backdrop-blur-lg transition-transform duration-300 hover:border-white/25 hover:bg-white/[0.12] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <RotateCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh board
              </Button>
            </div>
          )}
          footerChips={[
            <span key="pending">Pending {boardData.pending.length}</span>,
            <span key="inprogress">In progress {boardData.inProgress.length}</span>,
            <span key="completed">Completed {boardData.completed.length}</span>,
          ]}
        />

        <SummaryCards cards={summaryCards} />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Live Kanban</h2>
              <p className="text-sm text-white/70">Drag, assign, and prioritize tasks across every department.</p>
            </div>
          </div>

          {filterBar}

          <KanbanBoard
            tasksByStatus={boardData}
            onTaskAssign={handleTaskAssign}
            isLoading={isLoading}
            emptyMessage="No tasks match your filters"
          />
        </motion.div>
      </div>
      <TaskCreateDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreate={handleTaskCreate}
        departmentOptions={createDepartmentOptions}
        priorityOptions={createPriorityOptions}
      />
    </ManagerLayout>
  );
};

export default ManagerTaskManagementPage;
