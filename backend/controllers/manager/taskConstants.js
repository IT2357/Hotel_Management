/**
 * Task Management Constants
 * Contains all constant mappings and configurations for task management
 */

// Normalize incoming status values to StaffTask schema
// Note: "pending" returns as "Pending" (capital P) for frontend compatibility
export const STATUS_MAP = {
  pending: "Pending", // ✅ Capital P for frontend
  queued: "Pending",  // ✅ Capital P for frontend
  assigned: "assigned",
  inprogress: "in_progress",
  "in-progress": "in_progress",
  "in_progress": "in_progress",
  active: "in_progress",
  completed: "completed",
  done: "completed",
  finished: "completed",
  cancelled: "cancelled",
  canceled: "cancelled",
};

// Normalize incoming priority values to StaffTask (lowercase)
export const PRIORITY_MAP = {
  low: "low",
  normal: "medium",
  medium: "medium",
  moderate: "medium",
  high: "high",
  urgent: "urgent",
  critical: "urgent",
};

// Map various inputs to StaffTask department enum
// StaffTask departments: ["Housekeeping", "Kitchen", "Maintenance", "Service"]
export const DEPARTMENT_MAP = {
  housekeeping: "Housekeeping",
  cleaning: "Housekeeping",
  "cleaning staff": "Housekeeping",
  kitchen: "Kitchen",
  food: "Kitchen",
  "kitchen staff": "Kitchen",
  maintenance: "Maintenance",
  engineering: "Maintenance",
  service: "Service",
  services: "Service",
  "guest services": "Service",
  concierge: "Service",
  "room service": "Service",
  "front desk": "Service",
  reception: "Service",
};

// Map to StaffTask category enum
export const CATEGORY_ALLOWED = new Set([
  "electrical",
  "plumbing",
  "hvac",
  "appliance",
  "structural",
  "general",
  "food_preparation",
  "cooking",
  "cleaning",
  "inventory",
  "equipment",
  "guest_request",
  "room_service",
  "concierge",
  "transportation",
  "event",
  "laundry",
  "restocking",
  "inspection",
  "deep_cleaning",
]);

// Staff profile department mapping for queries
export const STAFF_PROFILE_DEPARTMENT_MAP = {
  cleaning: ["Housekeeping", "Cleaning"],
  maintenance: ["Maintenance"],
  service: ["Service", "Guest Services", "Concierge"],
  kitchen: ["Kitchen", "Food"],
};

// Allowed sort fields for task queries
export const ALLOWED_SORT_FIELDS = new Set(["createdAt", "dueDate", "priority", "status"]);

// Default values
export const DEFAULTS = {
  status: "Pending",
  priority: "medium",
  department: "Service",
  limit: 20,
  page: 1,
  sortBy: "createdAt",
  sortOrder: "desc",
};
