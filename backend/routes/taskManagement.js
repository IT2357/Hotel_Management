import express from "express";
import {
  getAllTasks,
  getTaskById,
  createTask,
  assignTask,
  updateTaskStatus,
  getAvailableStaff,
  getAllStaff,
  getMyTasks,
  deleteTask,
  cancelTask,
  getTaskStats,
} from "../controllers/manager/taskManagementController.js";
import {
  createFeedback,
  getFeedbackForTask,
  getMyFeedback,
  markFeedbackAsRead,
  getUnreadCount,
  replyToFeedback,
  deleteFeedback,
  getFeedbackStats
} from "../controllers/manager/feedbackController.js";
import {
  getTaskReports,
  getWorkloadReport,
  getDelayedTasksReport,
  exportReport
} from "../controllers/manager/reportController.js";
import { authenticateToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/roleAuth.js";

const router = express.Router();

// ====================================
// TASK MANAGEMENT ROUTES
// ====================================

// @route   GET /api/task-management/tasks
// @desc    Get all tasks with filtering and pagination
// @access  Manager, Admin
router.get(
  "/tasks",
  authenticateToken,
  authorizeRoles(["manager"]),
  getAllTasks
);

// @route   GET /api/task-management/tasks/stats
// @desc    Get task statistics
// @access  Manager, Admin
router.get(
  "/tasks/stats",
  authenticateToken,
  authorizeRoles(["manager"]),
  getTaskStats
);

// @route   GET /api/task-management/tasks/my-tasks
// @desc    Get tasks assigned to current staff member
// @access  Staff
router.get(
  "/tasks/my-tasks",
  authenticateToken,
  authorizeRoles(["staff"]),
  getMyTasks
);

// @route   GET /api/task-management/staff
// @desc    Get all staff members
// @access  Manager, Admin
router.get(
  "/staff",
  authenticateToken,
  authorizeRoles(["manager"]),
  getAllStaff
);



// @route   GET /api/task-management/tasks/staff/:department
// @desc    Get available staff for department
// @access  Manager, Admin
router.get(
  "/tasks/staff/:department",
  authenticateToken,
  authorizeRoles(["manager"]),
  getAvailableStaff
);

// @route   GET /api/task-management/tasks/:id
// @desc    Get single task by ID
// @access  Manager, Staff, Admin
router.get(
  "/tasks/:id",
  authenticateToken,
  authorizeRoles(["manager", "staff"]),
  getTaskById
);

// @route   POST /api/task-management/tasks
// @desc    Create new task
// @access  Manager, Admin
router.post(
  "/tasks",
  authenticateToken,
  authorizeRoles(["manager"]),
  createTask
);

// @route   PUT /api/task-management/tasks/:id/assign
// @desc    Assign task to staff member
// @access  Manager, Admin
router.put(
  "/tasks/:id/assign",
  authenticateToken,
  authorizeRoles(["manager"]),
  assignTask
);

// @route   PUT /api/task-management/tasks/:id/status
// @desc    Update task status
// @access  Staff, Manager, Admin
router.put(
  "/tasks/:id/status",
  authenticateToken,
  authorizeRoles(["staff", "manager"]),
  updateTaskStatus
);

// @route   PUT /api/task-management/tasks/:id/cancel
// @desc    Cancel or unassign task (returns to pending if assigned)
// @access  Manager, Admin
router.put(
  "/tasks/:id/cancel",
  authenticateToken,
  authorizeRoles(["manager"]),
  cancelTask
);

// @route   DELETE /api/task-management/tasks/:id
// @desc    Delete task (soft delete)
// @access  Manager, Admin
router.delete(
  "/tasks/:id",
  authenticateToken,
  authorizeRoles(["manager"]),
  deleteTask
);

// ====================================
// FEEDBACK MANAGEMENT ROUTES
// ====================================

// @route   GET /api/task-management/feedback/my-feedback
// @desc    Get feedback for current user
// @access  All authenticated users
router.get(
  "/feedback/my-feedback",
  authenticateToken,
  getMyFeedback
);

// @route   GET /api/task-management/feedback/unread-count
// @desc    Get unread feedback count
// @access  All authenticated users
router.get(
  "/feedback/unread-count",
  authenticateToken,
  getUnreadCount
);

// @route   GET /api/task-management/feedback/stats
// @desc    Get feedback statistics
// @access  Manager, Admin
router.get(
  "/feedback/stats",
  authenticateToken,
  authorizeRoles(["manager"]),
  getFeedbackStats
);

// @route   GET /api/task-management/feedback/task/:taskId
// @desc    Get all feedback for a task
// @access  Manager, Admin, or users involved in the task
router.get(
  "/feedback/task/:taskId",
  authenticateToken,
  getFeedbackForTask
);

// @route   POST /api/task-management/feedback
// @desc    Create new feedback
// @access  All authenticated users
router.post(
  "/feedback",
  authenticateToken,
  createFeedback
);

// @route   POST /api/task-management/feedback/:id/reply
// @desc    Reply to feedback
// @access  All authenticated users
router.post(
  "/feedback/:id/reply",
  authenticateToken,
  replyToFeedback
);

// @route   PUT /api/task-management/feedback/:id/read
// @desc    Mark feedback as read
// @access  Recipient of the feedback
router.put(
  "/feedback/:id/read",
  authenticateToken,
  markFeedbackAsRead
);

// @route   DELETE /api/task-management/feedback/:id
// @desc    Delete feedback
// @access  Author of feedback or Manager/Admin
router.delete(
  "/feedback/:id",
  authenticateToken,
  deleteFeedback
);

// ====================================
// REPORTING ROUTES
// ====================================

// @route   GET /api/task-management/reports/tasks
// @desc    Get comprehensive task reports
// @access  Manager, Admin
router.get(
  "/reports/tasks",
  authenticateToken,
  authorizeRoles(["manager"]),
  getTaskReports
);

// @route   GET /api/task-management/reports/workload
// @desc    Get staff workload report
// @access  Manager, Admin
router.get(
  "/reports/workload",
  authenticateToken,
  authorizeRoles(["manager"]),
  getWorkloadReport
);

// @route   GET /api/task-management/reports/delayed
// @desc    Get delayed tasks report
// @access  Manager, Admin
router.get(
  "/reports/delayed",
  authenticateToken,
  authorizeRoles(["manager"]),
  getDelayedTasksReport
);

// @route   GET /api/task-management/reports/export
// @desc    Export report data
// @access  Manager, Admin
router.get(
  "/reports/export",
  authenticateToken,
  authorizeRoles(["manager"]),
  exportReport
);

export default router;
