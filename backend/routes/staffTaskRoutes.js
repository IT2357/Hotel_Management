import express from "express";
import {
  getStaffTasks,
  getMyTasks,
  createStaffTask,
  updateStaffTaskStatus,
  deleteStaffTask,
  addTaskNote,
  getStaffTaskStats
} from "../controllers/staffTaskController.js";
import { authenticateToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/roleAuth.js";

const router = express.Router();

// Get all tasks with filtering (for staff)
router.get(
  "/tasks",
  authenticateToken,
  authorizeRoles(["staff", "manager", "admin"]),
  getStaffTasks
);

// Get tasks for current user
router.get(
  "/tasks/my",
  authenticateToken,
  getMyTasks
);

// Create new task
router.post(
  "/tasks",
  authenticateToken,
  authorizeRoles(["staff", "manager", "admin"]),
  createStaffTask
);

// Update task status
router.put(
  "/tasks/:taskId/status",
  authenticateToken,
  updateStaffTaskStatus
);

// Delete task
router.delete(
  "/tasks/:taskId",
  authenticateToken,
  authorizeRoles(["manager", "admin"]),
  deleteStaffTask
);

// Add note to task
router.post(
  "/tasks/:taskId/notes",
  authenticateToken,
  addTaskNote
);

// Get task statistics
router.get(
  "/tasks/stats",
  authenticateToken,
  getStaffTaskStats
);

export default router;
