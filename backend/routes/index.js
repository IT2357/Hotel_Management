import express from 'express';
import path from 'path';
import authRoutes from './auth.js';
import bookingRoutes from './bookings.js';
import roomRoutes from './rooms.js';
import foodRoutes from './food.js';
import dashboardRoutes from './dashboard.js';
import adminRoutes from './adminRoutes.js';
import managerRoutes from './managerRoutes.js';
import staffRoutes from './staff.js';
import taskManagementRoutes from './taskManagement.js';
import notificationRoutes from './notificationRoutes.js';
import financialRoutes from './financial.js';
import messagesRoutes from './messages.js';
import webhooksRoutes from './webhooks.js';
import reportsRoutes from './reports.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleAuth.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Hotel Management API is running' });
});

// Route configurations
router.use('/auth', authRoutes);
router.use('/bookings', bookingRoutes);
router.use('/rooms', roomRoutes);
router.use('/food', foodRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/admin', adminRoutes);
router.use('/manager', managerRoutes);
router.use('/staff', staffRoutes);
router.use('/tasks', taskManagementRoutes);
router.use('/notifications', notificationRoutes);
router.use('/financial', financialRoutes);
router.use('/messages', messagesRoutes);
router.use('/webhooks', webhooksRoutes);
router.use('/reports', reportsRoutes);

export default router;