import express from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  autoAssignTasks,
  updateTaskPriority,
  processTaskHandoff,
  trackPerformance
} from "../controllers/taskController.js";
import { authenticateToken as authenticate, requireRole as authorize } from "../middleware/auth.js";
import upload from '../middleware/fileUpload.js';

const router = express.Router();

// Task CRUD operations
router.post('/', authenticate, authorize(['staff', 'manager']), upload.array('attachments'), createTask);
router.get('/', authenticate, authorize(['staff', 'manager']), getTasks);
router.get('/:id', authenticate, authorize(['staff', 'manager']), getTaskById);
router.put('/:id', authenticate, authorize(['staff', 'manager']), upload.array('attachments'), updateTask);
router.patch('/:id/status', authenticate, authorize(['staff', 'manager']), updateTaskStatus);
router.delete('/:id', authenticate, authorize(['manager']), deleteTask);

// Task assignment and management
router.post('/auto-assign', authenticate, authorize(['manager']), autoAssignTasks);

// Task management
router.patch('/:id/priority', authenticate, authorize(['staff', 'manager']), updateTaskPriority);
router.patch('/:id/handoff', authenticate, authorize(['staff', 'manager']), processTaskHandoff);

// Performance tracking
router.get('/performance/:staffId', authenticate, authorize(['manager']), trackPerformance);

export default router;
