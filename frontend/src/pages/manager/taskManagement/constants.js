/**
 * Task Management Constants
 * Centralized constants for task status, departments, priorities, and filters
 */

export const INITIAL_BOARD_STATE = Object.freeze({ 
  pending: [], 
  awaitingAssignment: [], // For auto-created Service tasks
  inProgress: [], 
  completed: [] 
});

export const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "awaitingAssignment", label: "Awaiting Assignment" },
  { value: "inProgress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export const DEPARTMENT_OPTIONS = [
  { value: "all", label: "All Departments" },
  { value: "cleaning", label: "Cleaning" },
  { value: "Maintenance", label: "Maintenance" },
  { value: "service", label: "Service" },
  { value: "Kitchen", label: "Kitchen" },
];

export const PRIORITY_OPTIONS = [
  { value: "all", label: "All Priorities" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export const FILTER_INITIAL_STATE = Object.freeze({
  status: "all",
  department: "all",
  priority: "all",
  search: "",
});
