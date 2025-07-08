// 📁 utils/constants.js
const USER_ROLES = {
  GUEST: "guest",
  STAFF: "staff",
  MANAGER: "manager",
  ADMIN: "admin",
};

const ADMIN_PERMISSIONS = {
  CREATE_USER: "create-user",
  DELETE_ROOM: "delete-room",
  UPDATE_BOOKING: "update-booking",
  VIEW_REPORTS: "view-reports",
  MANAGE_SYSTEM: "manage-system",
  ISSUE_INVOICE: "issue-invoice",
  ASSIGN_TASKS: "assign-tasks",
};

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

module.exports = {
  USER_ROLES,
  ADMIN_PERMISSIONS,
  HTTP_STATUS,
};
