/**
 * 🛣️ Enhanced Menu Routes (2025 Production)
 * Full CRUD with image upload, validation, pagination
 * Endpoints: /api/food-complete/menu/*
 */

import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../../middleware/auth.js';
import { authorizeRoles } from '../../middleware/roleAuth.js';
import {
  createMenuItem,
  getMenuItems,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
  getMenuStats
} from '../../controllers/food-complete/menuEnhancedController.js';

const router = express.Router();

// Multer config for memory storage (5MB limit, images only)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    // Accept common formats
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
    }
    cb(null, true);
  }
});

// Error handler for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 5MB limit'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

/**
 * Public Routes (Guest access)
 */

// GET /api/food-complete/menu - Get all menu items with filters/search/pagination
router.get('/', getMenuItems);

// GET /api/food-complete/menu/:id - Get single menu item
router.get('/:id', getMenuItemById);

/**
 * Protected Admin Routes
 */

// POST /api/food-complete/menu - Create new menu item
router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin'),
  upload.single('image'),
  handleMulterError,
  createMenuItem
);

// PUT /api/food-complete/menu/:id - Update menu item
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  upload.single('image'),
  handleMulterError,
  updateMenuItem
);

// DELETE /api/food-complete/menu/:id - Soft delete menu item
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  deleteMenuItem
);

// PATCH /api/food-complete/menu/:id/availability - Quick toggle availability
router.patch(
  '/:id/availability',
  authenticateToken,
  authorizeRoles('admin'),
  toggleAvailability
);

// GET /api/food-complete/menu/stats/summary - Get menu statistics
router.get(
  '/stats/summary',
  authenticateToken,
  authorizeRoles('admin'),
  getMenuStats
);

export default router;
