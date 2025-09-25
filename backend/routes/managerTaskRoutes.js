import express from "express";
import ManagerTaskController from "../controllers/manager/managerTaskController.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Apply manager authorization to all routes
router.use(requireRole(["manager"]));

// GET /api/manager/tasks/pending - Get all pending guest requests
router.get("/pending", ManagerTaskController.getPendingRequests);

// GET /api/manager/tasks/overview - Get task status overview for dashboard
router.get("/overview", ManagerTaskController.getTaskStatusOverview);

// GET /api/manager/tasks - Get all tasks with filtering and pagination
router.get("/", ManagerTaskController.getAllTasks);

// GET /api/manager/tasks/departments - Get list of departments
router.get("/departments", ManagerTaskController.getDepartments);

// GET /api/manager/tasks/staff/:department - Get available staff by department
router.get("/staff/:department", ManagerTaskController.getAvailableStaff);

// PUT /api/manager/tasks/:taskId/assign - Assign task to staff member
router.put("/:taskId/assign", ManagerTaskController.assignTask);

// PUT /api/manager/tasks/:taskId/status - Update task status
router.put("/:taskId/status", ManagerTaskController.updateTaskStatus);

export default router;