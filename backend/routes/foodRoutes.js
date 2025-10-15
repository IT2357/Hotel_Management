import express from "express";
import {
  getAllFoodItems,
  getFoodItem,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
  getFoodCategories,
  generateAIMenu,
  getFoodItemsByCategory,
  toggleFoodAvailability
} from "../controllers/food/foodController.js";
import { authenticateToken as protect, requireRole as authorize } from "../middleware/auth.js";
import { validateFoodItem } from "../middleware/validation.js";

const router = express.Router();

// Public routes (for guests and customers)
router.get('/', getAllFoodItems);
router.get('/categories', getFoodCategories);
router.get('/categories/:category', getFoodItemsByCategory);
router.get('/:id', getFoodItem);

// Admin/Manager routes (protected)
router.post('/', protect, authorize('admin', 'manager'), validateFoodItem, createFoodItem);
router.put('/:id', protect, authorize('admin', 'manager'), validateFoodItem, updateFoodItem);
router.delete('/:id', protect, authorize('admin', 'manager'), deleteFoodItem);
router.patch('/:id/availability', protect, authorize('admin', 'manager'), toggleFoodAvailability);

// AI Menu Generator (Admin/Manager only)
router.post('/ai/generate', protect, authorize('admin', 'manager'), generateAIMenu);

export default router;