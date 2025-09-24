import express from 'express';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';
import {
  getStaffDashboard,
  getMyBookings,
  getRoomStatus,
  getSupportRequests,
  getMyTasks
} from '../controllers/staff/staffController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateUser);

// Staff dashboard routes
router.get('/dashboard', authorizeRoles(['staff', 'manager', 'admin']), getStaffDashboard);
router.get('/bookings', authorizeRoles(['staff', 'manager', 'admin']), getMyBookings);
router.get('/rooms/status', authorizeRoles(['staff', 'manager', 'admin']), getRoomStatus);
router.get('/support-requests', authorizeRoles(['staff', 'manager', 'admin']), getSupportRequests);
router.get('/tasks', authorizeRoles(['staff', 'manager', 'admin']), getMyTasks);

export default router;