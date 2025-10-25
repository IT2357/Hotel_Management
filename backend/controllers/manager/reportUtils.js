/**
 * Utility functions for report generation
 * Contains date parsing, calculations, formatting, and validation helpers
 */

export const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const PERIOD_UNIT_MAP = {
  daily: "day",
  weekly: "week",
  monthly: "month",
  quarterly: "quarter",
  yearly: "year",
};

/**
 * Parse a date value into a Date object
 * @param {string|Date} value - Date value to parse
 * @returns {Date|null} Parsed date or null if invalid
 */
export const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Parse array parameter from query string or array
 * @param {string|Array} value - Value to parse
 * @returns {Array} Parsed array
 */
export const parseArrayParam = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
};

/**
 * Resolve date range with defaults (last 30 days if not provided)
 * @param {string|Date} startValue - Start date value
 * @param {string|Date} endValue - End date value
 * @returns {{start: Date, end: Date}} Resolved date range
 */
export const resolveDateRange = (startValue, endValue) => {
  let end = parseDate(endValue) || new Date();
  let start = parseDate(startValue);

  if (!start) {
    start = new Date(end);
    start.setDate(start.getDate() - 29);
  }

  if (start > end) {
    const temp = start;
    start = end;
    end = temp;
  }

  if (start.getTime() === end.getTime()) {
    const adjusted = new Date(start);
    adjusted.setDate(adjusted.getDate() - 1);
    start = adjusted;
  }

  return { start, end };
};

/**
 * Calculate percentage change between two values
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {number|null} Percentage change or null if invalid
 */
export const calculatePercentageChange = (current, previous) => {
  if (!Number.isFinite(previous) || previous === 0) {
    return null;
  }
  if (!Number.isFinite(current)) {
    return null;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
};

/**
 * Ensure a value is a safe number
 * @param {*} value - Value to check
 * @returns {number} Safe number (0 if invalid)
 */
export const safeNumber = (value) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return value;
};

/**
 * Round a number to specified decimal places
 * @param {number} value - Value to round
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {number} Rounded number
 */
export const round = (value, decimals = 2) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

/**
 * Format a label by converting underscores/dashes to spaces and capitalizing words
 * @param {string} label - Label to format
 * @returns {string} Formatted label
 */
export const formatLabel = (label) => {
  if (!label) return "Unknown";
  return String(label)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Generate risk alerts based on operational metrics
 * @param {Object} metrics - Operational metrics
 * @returns {Array} Array of risk alerts
 */
export const generateRiskAlerts = (metrics) => {
  const {
    overdueTasks = 0,
    completionRate = 0,
    totalStaffTasks = 0,
    totalStaffCount = 0,
    onDutyCount = 0,
    departmentPerformance = [],
    inProgressTasks = 0,
    completedStaffTasks = 0,
  } = metrics;

  const riskAlerts = [];

  // Alert for overdue tasks
  if (overdueTasks > 0) {
    riskAlerts.push({
      id: `alert-overdue-${Date.now()}`,
      title: overdueTasks > 5 ? "Critical task backlog" : "Tasks overdue",
      detail: `${overdueTasks} task${overdueTasks > 1 ? 's' : ''} past due date requiring immediate attention`,
      severity: overdueTasks > 5 ? "high" : "medium",
    });
  }

  // Alert for low completion rate
  if (completionRate < 75 && totalStaffTasks > 10) {
    riskAlerts.push({
      id: `alert-completion-${Date.now()}`,
      title: "Low task completion rate",
      detail: `Overall completion rate at ${Math.round(completionRate)}%, below 75% threshold`,
      severity: completionRate < 60 ? "high" : "medium",
    });
  }

  // Alert for staff availability
  if (totalStaffCount > 0 && (onDutyCount / totalStaffCount) < 0.4) {
    riskAlerts.push({
      id: `alert-staffing-${Date.now()}`,
      title: "Low staff availability",
      detail: `Only ${onDutyCount} out of ${totalStaffCount} staff members currently on duty`,
      severity: "medium",
    });
  }

  // Alert for department performance issues
  const underperformingDepts = departmentPerformance.filter(dept =>
    dept.completionRate < 70 && dept.totalTasks > 5
  );
  if (underperformingDepts.length > 0) {
    const deptNames = underperformingDepts.map(d => d.department).join(", ");
    riskAlerts.push({
      id: `alert-dept-${Date.now()}`,
      title: "Department performance concern",
      detail: `${deptNames} showing completion rates below 70%`,
      severity: "medium",
    });
  }

  // Alert for high in-progress tasks
  if (inProgressTasks > completedStaffTasks && totalStaffTasks > 20) {
    riskAlerts.push({
      id: `alert-progress-${Date.now()}`,
      title: "High work-in-progress",
      detail: `${inProgressTasks} tasks in progress, may indicate resource bottleneck`,
      severity: "low",
    });
  }

  return riskAlerts;
};
