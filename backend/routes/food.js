import express from 'express';
import { authenticateToken as protect } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleAuth.js';
import {
  getAllFoodItems,
  getFoodItem,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
  generateAIMenu,
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/food/foodController.js';
import { getCurrentMeal } from '../utils/timeUtils.js';
import {
  getAllFoodOrders,
  getFoodOrder,
  updateOrderStatus,
  getOrderStats,
  createFoodOrder,
  getCustomerOrders
} from '../controllers/food/foodOrderController.js';
import menuRoutes from './food/menuRoutes.js';

const router = express.Router();

// Mount food menu routes (includes all menu CRUD operations)
router.use('/menu', menuRoutes);

// Public routes (no authentication required)
router.get('/current-meal', async (req, res) => {
  try {
    const currentMeal = await getCurrentMeal();
    res.json({
      success: true,
      currentMeal,
      message: `Current meal type: ${currentMeal}`
    });
  } catch (error) {
    console.error('Error getting current meal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get current meal type',
      error: error.message
    });
  }
});

router.get('/time-slots', async (req, res) => {
  try {
    const TimeSlots = (await import('../models/TimeSlots.js')).default;
    const timeSlots = await TimeSlots.find();
    res.json({
      success: true,
      timeSlots: timeSlots.map(slot => ({
        meal: slot.meal,
        start: slot.start,
        end: slot.end
      }))
    });
  } catch (error) {
    console.error('Error getting time slots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get time slots',
      error: error.message
    });
  }
});

// Public route for creating orders (supports both authenticated and guest users)
router.post('/orders/create', createFoodOrder);

// Protected routes for authenticated users
router.use(protect);
router.get('/orders/my-orders', getCustomerOrders);

// Admin only routes for food management
router
  .route('/items')
  .get(authorizeRoles(['admin', 'manager']), getAllFoodItems)
  .post(authorizeRoles(['admin', 'manager']), createFoodItem);

router
  .route('/items/:id')
  .get(authorizeRoles(['admin', 'manager']), getFoodItem)
  .put(authorizeRoles(['admin', 'manager']), updateFoodItem)
  .delete(authorizeRoles(['admin', 'manager']), deleteFoodItem);

// AI Menu Generator
router.post('/generate-menu', authorizeRoles(['admin', 'manager']), generateAIMenu);

// Order statistics - must come before parameterized routes
router.get('/orders/stats', authorizeRoles(['admin', 'manager']), getOrderStats);

// Admin routes for order management
router
  .route('/orders')
  .get(authorizeRoles(['admin', 'manager', 'staff']), getAllFoodOrders);

router
  .route('/orders/:id')
  .get(authorizeRoles(['admin', 'manager', 'staff']), getFoodOrder);

router
  .route('/orders/:id/status')
  .put(authorizeRoles(['admin', 'manager', 'staff']), updateOrderStatus);

export default router;