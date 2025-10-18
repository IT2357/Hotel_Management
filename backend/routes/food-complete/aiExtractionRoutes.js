/**
 * 🛣️ AI Menu Extraction Routes
 * OCR-powered menu extraction from images
 * Endpoints: /api/food-complete/ai/*
 */

import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../../middleware/auth.js';
import { authorizeRoles } from '../../middleware/roleAuth.js';
import {
  extractMenuFromImage,
  getSupportedLanguages
} from '../../controllers/food-complete/aiExtractionController.js';

const router = express.Router();

// Multer config for AI extraction (10MB limit for high-res menus)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max for menu photos
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
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
        message: 'File size exceeds 10MB limit'
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
 * Routes
 */

// POST /api/food-complete/ai/extract - Extract menu from image
router.post(
  '/extract',
  authenticateToken,
  authorizeRoles('admin'),
  upload.single('image'),
  handleMulterError,
  extractMenuFromImage
);

// GET /api/food-complete/ai/supported-languages - Get supported OCR languages
router.get('/supported-languages', getSupportedLanguages);

export default router;
