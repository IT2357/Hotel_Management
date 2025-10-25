/**
 * Task Management Utility Functions
 * Contains validation, normalization, and formatting helpers
 */

import mongoose from "mongoose";
import {
  STATUS_MAP,
  PRIORITY_MAP,
  DEPARTMENT_MAP,
  CATEGORY_ALLOWED,
  DEFAULTS,
  ALLOWED_SORT_FIELDS,
} from "./taskConstants.js";

/**
 * Check if a value is a valid MongoDB ObjectId
 * @param {*} value - Value to check
 * @returns {boolean} True if valid ObjectId
 */
export const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value));

/**
 * Convert string to title case
 * @param {string} value - String to convert
 * @returns {string} Title cased string
 */
export const toTitleCase = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

/**
 * Normalize department name to match StaffTask enum
 * @param {string} value - Department name
 * @returns {string} Normalized department name
 */
export const normalizeDepartment = (value) => {
  if (!value) return DEFAULTS.department;
  const normalized = String(value).trim().toLowerCase();
  if (DEPARTMENT_MAP[normalized]) return DEPARTMENT_MAP[normalized];
  // If already one of StaffTask enums, keep
  const maybe = toTitleCase(value);
  return ["Housekeeping", "Kitchen", "Maintenance", "Service"].includes(maybe)
    ? maybe
    : DEFAULTS.department;
};

/**
 * Infer task category from department
 * @param {string} department - Department name
 * @returns {string} Inferred category
 */
export const inferCategoryFromDepartment = (department) => {
  const normalized = String(department).trim().toLowerCase();
  if (normalized === "kitchen") return "food_preparation";
  if (normalized === "housekeeping" || normalized === "cleaning") return "cleaning";
  if (normalized === "maintenance") return "general";
  return "guest_request";
};

/**
 * Normalize task category
 * @param {string} value - Category value
 * @param {string} department - Department for inference
 * @returns {string} Normalized category
 */
export const normalizeCategory = (value, department) => {
  if (!value) return inferCategoryFromDepartment(department || "");
  const normalized = String(value).trim().toLowerCase().replace(/[-\s]+/g, "_");
  return CATEGORY_ALLOWED.has(normalized) ? normalized : inferCategoryFromDepartment(department || "");
};

/**
 * Normalize priority value
 * @param {string} value - Priority value
 * @returns {string} Normalized priority
 */
export const normalizePriority = (value) => {
  if (!value) return DEFAULTS.priority;
  const normalized = String(value).trim().toLowerCase();
  return PRIORITY_MAP[normalized] || DEFAULTS.priority;
};

/**
 * Normalize status value
 * @param {string} value - Status value
 * @returns {string} Normalized status
 */
export const normalizeStatus = (value) => {
  if (!value) return DEFAULTS.status;
  const normalized = String(value).trim().toLowerCase();
  return STATUS_MAP[normalized] || DEFAULTS.status;
};

/**
 * Parse date string to Date object
 * @param {string|Date} value - Date value
 * @returns {Date|undefined} Parsed date or undefined
 */
export const parseDate = (value) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

/**
 * Extract user ID from user object
 * @param {Object} user - User object
 * @returns {string} User ID
 */
export const extractUserId = (user) => user?._id || user?.id || user?.userId;

/**
 * Format assignment history for response
 * @param {Array} history - Assignment history array
 * @returns {Array} Formatted assignment history
 */
export const formatAssignmentHistory = (history) =>
  (history || []).map((entry) => ({
    assignedTo: entry.assignedTo ? String(entry.assignedTo) : undefined,
    assignedName: entry.assignedName || "",
    assignedAt: entry.assignedAt,
    assignedBy: entry.assignedBy ? String(entry.assignedBy) : undefined,
    notes: entry.notes,
  }));

/**
 * Validate and sanitize pagination parameters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} Safe pagination parameters
 */
export const sanitizePagination = (page, limit) => {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || DEFAULTS.limit, 1), 100);
  const safePage = Math.max(parseInt(page, 10) || DEFAULTS.page, 1);
  return { safeLimit, safePage };
};

/**
 * Validate and sanitize sort parameters
 * @param {string} sortBy - Sort field
 * @param {string} sortOrder - Sort order (asc/desc)
 * @returns {Object} Safe sort parameters
 */
export const sanitizeSort = (sortBy, sortOrder) => {
  const sortField = ALLOWED_SORT_FIELDS.has(sortBy) ? sortBy : DEFAULTS.sortBy;
  const sortDirection = String(sortOrder).toLowerCase() === "asc" ? 1 : -1;
  return { sortField, sortDirection };
};

/**
 * Build query filters from request parameters
 * @param {Object} params - Query parameters
 * @returns {Object} MongoDB query filters
 */
export const buildTaskFilters = (params) => {
  const { status, department, priority, search } = params;
  const filters = {};

  if (status) {
    filters.status = normalizeStatus(status);
  }

  if (department) {
    filters.department = normalizeDepartment(department);
  }

  if (priority) {
    filters.priority = normalizePriority(priority);
  }

  if (search) {
    const regex = new RegExp(String(search).trim(), "i");
    filters.$or = [
      { title: regex },
      { description: regex },
      { location: regex },
      { roomNumber: regex },
    ];
  }

  return filters;
};
