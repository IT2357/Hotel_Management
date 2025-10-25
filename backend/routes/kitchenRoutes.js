import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleAuth.js';
import * as controller from '../controllers/kitchen/kitchenOrderController.js';

const router = express.Router();

// Protect all routes - require authentication
router.use(authenticateToken);

// Only staff, manager, and admin roles can access these routes
router.use(authorizeRoles(['staff', 'manager', 'admin']));

// Kitchen order routes
router.get('/orders', controller.getKitchenOrders);
router.get('/orders/by-timeslot', controller.getOrdersByTimeSlot); // Must come before :orderId routes
router.get('/orders/meal-plan/upcoming', controller.getUpcomingMealPlanOrders);
router.put('/orders/:orderId/status', controller.updateOrderStatus);
router.post('/orders/:orderId/deliver', controller.confirmDelivery);
router.get('/stats', controller.getKitchenStats);

export default router;

