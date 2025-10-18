import express from 'express';
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus
} from '../controllers/food/foodCategoryController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { 
  createCategoryValidation, 
  updateCategoryValidation 
} from '../validations/foodValidation.js';

const router = express.Router();

// Public routes
router.get('/', getCategories);

// Protected routes (admin only)
router.post('/', authenticateToken, requireRole(['admin', 'manager']), createCategoryValidation, createCategory);
router.get('/:id', getCategoryById);
router.put('/:id', authenticateToken, requireRole(['admin', 'manager']), updateCategoryValidation, updateCategory);
router.delete('/:id', authenticateToken, requireRole(['admin', 'manager']), deleteCategory);
router.patch('/:id/toggle-status', authenticateToken, requireRole(['admin', 'manager']), toggleCategoryStatus);

export default router;
