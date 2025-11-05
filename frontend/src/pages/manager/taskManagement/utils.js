/**
 * Task Management Utility Functions
 * Helper functions for task transformations, formatting, and data processing
 */

/**
 * Normalize task status for board columns
 */
export const normalizeStatusForColumn = (status, task) => {
  if (!status) return "pending";
  const key = String(status).toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
  
  // Auto-created workflow tasks (e.g., Service tasks) go to "Awaiting Assignment"
  if (key === "pending" && task?.isWorkflowTask === true) {
    return "awaitingAssignment";
  }
  
  if (key === "assigned") return "inProgress";
  if (key === "in_progress" || key === "inprogress") return "inProgress";
  if (key === "completed") return "completed";
  if (key === "cancelled") return "cancelled";
  return "pending";
};

/**
 * Map status to API value format
 */
export const mapStatusToApiValue = (status) => {
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

/**
 * Convert string to title case
 */
export const toTitleCase = (value, fallback = "") => {
  if (!value) return fallback;
  return String(value)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Extract person name from various object formats
 */
export const getPersonName = (person) => {
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

/**
 * Format due date to readable string
 */
export const formatDueDateLabel = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
};

/**
 * Format location label from task data
 */
export const formatLocationLabel = (task) => {
  if (!task) return "";
  if (task.roomNumber) return `Room ${task.roomNumber}`;
  if (task.room) return `Room ${task.room}`;
  if (task.location) return toTitleCase(task.location, "General Area");
  if (task.category) return toTitleCase(task.category, "General Area");
  return "General Area";
};

/**
 * Compute AI match score for task-staff pairing
 */
export const computeMatchScore = (task) => {
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

/**
 * Map task type to department
 */
export const mapTaskTypeToDepartment = (type) => {
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

/**
 * Build recommended staff list from task data
 */
export const buildRecommendedStaff = (task, assignedName) => {
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

/**
 * Transform raw task data to board format
 */
export const transformTaskForBoard = (task) => {
  if (!task) return null;

  const statusKey = normalizeStatusForColumn(task.status, task);
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
