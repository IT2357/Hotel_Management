// 📁 backend/routes/menuRoutes.js
import express from "express";
import { body } from "express-validator";
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus
} from "../controllers/menu/categoryController.js";
import {
  getFoodItems,
  getFoodItem,
  getFoodCategories,
  getFoodItemsByCategory
} from "../controllers/menu/foodController.js";

const router = express.Router();

// Category validation rules
const categoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ max: 100 })
    .withMessage('Category name cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('displayOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer')
];

// Menu item validation rules
const menuItemValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Menu item name is required')
    .isLength({ max: 150 })
    .withMessage('Item name cannot exceed 150 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isMongoId()
    .withMessage('Invalid category ID'),
  body('type')
    .isIn(['Veg', 'Non-Veg', 'Seafood'])
    .withMessage('Type must be Veg, Non-Veg, or Seafood'),
  body('spiceLevel')
    .isIn(['Mild', 'Medium', 'Hot'])
    .withMessage('Spice level must be Mild, Medium, or Hot'),
  body('basePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base price must be a non-negative number'),
  body('preparationTime')
    .optional()
    .isInt({ min: 1, max: 120 })
    .withMessage('Preparation time must be between 1 and 120 minutes')
];

// Food category routes
router.get('/categories', getFoodCategories);

// Food item routes
router.get('/items', getFoodItems);
router.get('/items/:id', getFoodItem);

// Category-specific food item routes
router.get('/categories/:category/items', getFoodItemsByCategory);

export default router;
