import express from 'express';
import {
  getKitchenStats,
  getKitchenOrders,
  updateOrderStatus,
  assignOrderToStaff,
  getOrderDetails,
  getStaffOrders
} from '../controllers/food/kitchenController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { 
  updateOrderStatusValidation, 
  assignOrderValidation,
  getKitchenOrdersValidation 
} from '../validations/foodValidation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Kitchen statistics
router.get('/stats', getKitchenStats);

// Get orders for kitchen
router.get('/orders', getKitchenOrdersValidation, getKitchenOrders);

// Get specific order details
router.get('/orders/:orderId', getOrderDetails);

// Update order status
router.patch('/orders/:orderId/status', updateOrderStatusValidation, updateOrderStatus);

// Assign order to staff
router.patch('/orders/:orderId/assign', requireRole(['manager', 'admin']), assignOrderValidation, assignOrderToStaff);

// Get orders assigned to specific staff
router.get('/staff/:staffId/orders', getStaffOrders);

export default router;
