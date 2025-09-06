// 📁 backend/routes/menuRoutes.js
import express from "express";
import { body, query } from "express-validator";
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
  getFoodItemsByCategory,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
  searchFoodItems,
  getFeaturedItems,
  getPopularItems,
  updateItemStock
} from "../controllers/menu/foodController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validation.js";

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
  body('foodType')
    .isIn(['veg', 'non-veg', 'seafood', 'vegan'])
    .withMessage('Food type must be veg, non-veg, seafood, or vegan'),
  body('spiceLevel')
    .isIn(['None', 'Mild', 'Medium', 'Hot', 'Extra Hot'])
    .withMessage('Spice level must be None, Mild, Medium, Hot, or Extra Hot'),
  body('basePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base price must be a non-negative number'),
  body('preparationTime')
    .optional()
    .isInt({ min: 1, max: 120 })
    .withMessage('Preparation time must be between 1 and 120 minutes'),
  body('cuisineType')
    .optional()
    .isIn(['Sri Lankan', 'Indian', 'Chinese', 'Italian', 'Continental', 'Thai', 'Japanese', 'Mexican', 'Mediterranean', 'Fusion'])
    .withMessage('Invalid cuisine type'),
  body('servingSize')
    .optional()
    .isIn(['Individual', 'Sharing (2-3)', 'Family (4-6)', 'Large (6+)'])
    .withMessage('Invalid serving size')
];

// Search validation
const searchValidation = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters'),
  query('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID'),
  query('foodType')
    .optional()
    .isIn(['veg', 'non-veg', 'seafood', 'vegan']),
  query('cuisineType')
    .optional()
    .isIn(['Sri Lankan', 'Indian', 'Chinese', 'Italian', 'Continental', 'Thai', 'Japanese', 'Mexican', 'Mediterranean', 'Fusion']),
  query('spiceLevel')
    .optional()
    .isIn(['None', 'Mild', 'Medium', 'Hot', 'Extra Hot']),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be non-negative'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be non-negative'),
  query('dietary')
    .optional()
    .isIn(['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher', 'keto', 'paleo', 'low-carb', 'sugar-free']),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

// Public Routes (no authentication required)

// Categories
router.get('/categories', getCategories);
router.get('/categories/:id', getCategory);

// Menu Items - Public browsing
router.get('/items', searchValidation, validateRequest, getFoodItems);
router.get('/items/search', searchValidation, validateRequest, searchFoodItems);
router.get('/items/featured', getFeaturedItems);
router.get('/items/popular', getPopularItems);
router.get('/items/:id', getFoodItem);

// Category-specific items
router.get('/categories/:categoryId/items', getFoodItemsByCategory);

// Legacy route for backward compatibility
router.get('/food-categories', getFoodCategories);

// Protected Routes (authentication required)

// Admin-only routes for managing categories
router.post('/categories', 
  authenticate, 
  authorize(['admin']), 
  categoryValidation, 
  validateRequest, 
  createCategory
);

router.put('/categories/:id', 
  authenticate, 
  authorize(['admin']), 
  categoryValidation, 
  validateRequest, 
  updateCategory
);

router.delete('/categories/:id', 
  authenticate, 
  authorize(['admin']), 
  deleteCategory
);

router.patch('/categories/:id/toggle-status', 
  authenticate, 
  authorize(['admin']), 
  toggleCategoryStatus
);

// Admin/Staff routes for managing menu items
router.post('/items', 
  authenticate, 
  authorize(['admin', 'staff']), 
  menuItemValidation, 
  validateRequest, 
  createFoodItem
);

router.put('/items/:id', 
  authenticate, 
  authorize(['admin', 'staff']), 
  menuItemValidation, 
  validateRequest, 
  updateFoodItem
);

router.delete('/items/:id', 
  authenticate, 
  authorize(['admin', 'staff']), 
  deleteFoodItem
);

router.patch('/items/:id/stock', 
  authenticate, 
  authorize(['admin', 'staff']), 
  [
    body('quantity')
      .isInt({ min: 0 })
      .withMessage('Quantity must be a non-negative integer'),
    body('operation')
      .isIn(['add', 'subtract', 'set'])
      .withMessage('Operation must be add, subtract, or set')
  ],
  validateRequest,
  updateItemStock
);

export default router;
