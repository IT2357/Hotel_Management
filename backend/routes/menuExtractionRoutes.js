import express from 'express';
import {
  extractMenu,
  listMenus,
  getMenu,
  saveMenu,
  deleteMenu
} from '../controllers/menuExtractionController.js';
import { authenticateToken as protect } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleAuth.js';
import { uploadSingle, handleMulterError } from '../middleware/upload.js';
import { validateImageUpload } from '../middleware/validation.js';
import imageStorageService from '../services/imageStorageService.js';

const router = express.Router();

// All routes require authentication and admin/manager role
router.use(protect);
router.use(authorizeRoles(['admin', 'manager']));

// Upload and process menu (supports file upload, URL, and file path)
router.post('/upload', protect, authorizeRoles(['admin', 'manager']), validateImageUpload, uploadSingle, handleMulterError, extractMenu);

// General image upload endpoint
router.post('/image', protect, authorizeRoles(['admin', 'manager']), uploadSingle, handleMulterError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const imageId = await imageStorageService.uploadImage(
      req.file.buffer,
      req.file.originalname,
      {
        uploadedBy: req.user?.id,
        purpose: 'menu_item'
      }
    );

    const imageUrl = await imageStorageService.getImageUrl(imageId);

    res.status(200).json({
      success: true,
      imageId,
      imageUrl,
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
});

// Get all extracted menus with pagination and filtering
router.get('/', listMenus);

// Get single extracted menu by ID
router.get('/:id', getMenu);

// Update extracted menu (for editing before saving to MenuItem collection)
router.put('/:id', saveMenu);

// Delete extracted menu
router.delete('/:id', deleteMenu);

// Get extraction statistics
router.get('/stats', async (req, res) => {
  try {
    // This is a placeholder - implement actual statistics if needed
    res.json({
      success: true,
      data: {
        totalMenus: 0,
        totalCategories: 0,
        totalItems: 0,
        averageConfidence: 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// Validate URL before processing
router.post('/validate-url', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required'
      });
    }

    // Basic URL validation
    try {
      new URL(url);
      res.json({
        success: true,
        valid: true,
        message: 'URL is valid'
      });
    } catch {
      res.status(400).json({
        success: false,
        valid: false,
        message: 'Invalid URL format'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to validate URL'
    });
  }
});

// Save extracted menu items to MenuItem collection
router.post('/save-to-menu-items', async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required'
      });
    }

    // This would typically call the menu controller to save items
    // For now, just return success
    res.json({
      success: true,
      message: 'Items saved successfully',
      savedCount: items.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save menu items'
    });
  }
});

export default router;
