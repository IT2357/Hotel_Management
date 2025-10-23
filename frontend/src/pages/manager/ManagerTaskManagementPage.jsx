import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import useAuth from "@/hooks/useAuth";
import { taskAPI } from "@/services/taskManagementAPI";
import { ManagerLayout } from "@/components/manager";
import { TaskQueueBoard } from "@/components/manager/TaskQueueBoard";
import { Button } from "@/components/manager/ManagerButton";
import { RotateCw, Plus } from "lucide-react";
import ManagerPageHeader from "@/components/manager/ManagerPageHeader";
import { MANAGER_CONTENT_CLASS, MANAGER_PAGE_CONTAINER_CLASS } from "./managerStyles";
import { TaskCreateDialog } from "@/components/manager/TaskCreateDialog";

/**
 * Manager Task Management Page - Guest Request Workflow
 * 
 * WORKFLOW:
 * 1. Guest creates a service request (food order, room cleaning, maintenance, etc.)
 * 2. Request appears in "Awaiting Assignment" column (Pending status)
 * 3. Manager reviews request details and assigns to appropriate staff member
 * 4. Staff receives notification and accepts the task
 * 5. Task moves to "Staff Working" column (In Progress status) when staff starts
 * 6. Staff completes the task
 * 7. Task moves to "Completed" column
 * 
 * This page allows managers to:
 * - View all guest requests and tasks across departments
 * - Filter by status, department, and priority
 * - Assign tasks to available staff members
 * - Track task progress in real-time
 * - Create manual tasks for general maintenance or operations
 */

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
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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


  const loadTasks = useCallback(async (currentFilters, showToast = false) => {
    setIsLoading(true);

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
      await loadTasks(filters, true);
    } finally {
      setIsRefreshing(false);
    }
  }, [filters, loadTasks]);

  useEffect(() => {
    loadTasks(filters);
  }, [filters, loadTasks]);

  const displayName = useMemo(
    () =>
      user?.fullName ||
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      user?.name ||
      user?.email ||
      "Manager",
    [user]
  );


  const createDepartmentOptions = useMemo(
    () => DEPARTMENT_OPTIONS.filter((option) => option.value !== "all"),
    [],
  );

  const createPriorityOptions = useMemo(
    () => PRIORITY_OPTIONS.filter((option) => option.value !== "all"),
    [],
  );

  const handleTaskAssign = useCallback(async (task, staff) => {
    if (!task?.rawTask?._id) {
      throw new Error("Task identifier is missing.");
    }

    if (!staff?.staffId) {
      throw new Error("Please select a staff member to assign this task.");
    }

    try {
      // Assign the task to the staff member
      await taskAPI.assignTask(task.rawTask._id, { staffId: staff.staffId });
      
      // Task stays in "Pending" column until staff accepts it
      // When staff accepts and starts working, it will move to "In Progress" column
      // When staff completes it, it will move to "Completed" column
      
      // Reload the tasks to show the updated state
      await loadTasks(filters);
      
      toast.success("Task Assigned Successfully", {
        description: `${task.title} has been assigned to ${staff.name}. The task will move to "In Progress" when staff starts working on it.`,
        duration: 4000,
      });
    } catch (error) {
      console.error("Unable to assign task", error);
      const message = error?.response?.data?.message || error.message || "Failed to assign task";
      throw new Error(message);
    }
  }, [filters, loadTasks]);

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
        toast.success("Task Created", {
          description: `${payload.title} has been added to the pending queue. You can now assign it to a staff member.`,
          duration: 3500,
        });
        await loadTasks(filters);
      } catch (error) {
        console.error("Unable to create task", error);
        const message = error?.response?.data?.message || error.message || "Failed to create task";
        throw new Error(message);
      }
    },
    [filters, loadTasks],
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
          title="Smart Task Management"
          subtitle={`${displayName}, intelligently assign tasks with AI-powered staff matching and priority-driven workflow.`}
          accentChips={["AI-Powered", "Smart Assignment", "Real-Time Tracking"]}
          actions={(
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="bg-gradient-to-r from-cyan-400 to-blue-400 text-slate-900 shadow-xl transition-all duration-300 hover:from-cyan-300 hover:to-blue-300 hover:-translate-y-0.5 disabled:opacity-70"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Task
              </Button>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="border-slate-600/30 bg-slate-700/40 text-slate-100 shadow-lg transition-all duration-300 hover:border-slate-500/60 hover:bg-slate-600/50 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <RotateCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          )}
          footerChips={[
            <span key="pending">Awaiting Assignment: {boardData.pending.length}</span>,
            <span key="inprogress">Staff Working: {boardData.inProgress.length}</span>,
            <span key="completed">Completed: {boardData.completed.length}</span>,
          ]}
        />

        <TaskQueueBoard
          tasksByStatus={boardData}
          onTaskAssign={handleTaskAssign}
          isLoading={isLoading}
          emptyMessage="No guest requests or tasks available"
        />
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
