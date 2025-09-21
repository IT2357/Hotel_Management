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
import {
  getAllFoodOrders,
  getFoodOrder,
  updateOrderStatus,
  getOrderStats,
  createFoodOrder,
  getCustomerOrders
} from '../controllers/food/foodOrderController.js';

const router = express.Router();

// Public routes - no authentication required for viewing menu items
router.get('/menu/items', getAllFoodItems);
router.get('/menu/items/:id', getFoodItem);
router.get('/menu/categories', getAllCategories);
router.get('/menu/categories/:id', getCategory);
router.post('/menu/categories', authorizeRoles(['admin', 'manager']), createCategory);
router.put('/menu/categories/:id', authorizeRoles(['admin', 'manager']), updateCategory);
router.delete('/menu/categories/:id', authorizeRoles(['admin', 'manager']), deleteCategory);

// Protected routes for authenticated users
router.use(protect);

// Customer order routes
router.post('/orders/create', createFoodOrder);
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