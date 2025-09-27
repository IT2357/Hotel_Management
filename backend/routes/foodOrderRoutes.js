import express from "express";
import {
  getAllFoodOrders,
  getFoodOrder,
  updateOrderStatus,
  getOrderStats,
  getCustomerOrders,
  createFoodOrder
} from "../controllers/food/foodOrderController.js";
import { authenticateToken as protect, requireRole as authorize } from "../middleware/auth.js";

const router = express.Router();

// Admin/Staff routes (must come before parameterized routes)
router.get('/stats', protect, authorize('admin', 'staff'), getOrderStats);
router.get('/', protect, authorize('admin', 'staff'), getAllFoodOrders);
router.patch('/:id/status', protect, authorize('admin', 'staff'), updateOrderStatus);

// Customer routes (authenticated users)
router.post('/create', protect, createFoodOrder);
router.get('/my-orders', protect, getCustomerOrders);
router.get('/:id', protect, getFoodOrder);

export default router;