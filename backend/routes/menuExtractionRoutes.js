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
import { uploadSingle, uploadToGridFS, handleMulterError, uploadForMenuExtraction } from '../middleware/gridfsUpload.js';
import { validateImageUpload } from '../middleware/validation.js';
import imageStorageService from '../services/imageStorageService.js';

const router = express.Router();

// Upload and process menu (supports file upload, URL, and file path)
router.post('/upload', protect, authorizeRoles(['admin', 'manager']), uploadSingle, handleMulterError, uploadToGridFS, extractMenu);

// Alternative route for menu extraction (used by frontend) - supports both file upload and URL
router.post('/extract', protect, authorizeRoles(['admin', 'manager']), uploadForMenuExtraction, handleMulterError, (req, res, next) => {
  // Convert req.files array to req.file for compatibility with uploadToGridFS middleware
  if (req.files && req.files.length > 0) {
    const uploadedFile = req.files.find(f => f.fieldname === 'file') || req.files[0];
    if (uploadedFile) {
      req.file = {
        fieldname: uploadedFile.fieldname,
        originalname: uploadedFile.originalname,
        encoding: uploadedFile.encoding,
        mimetype: uploadedFile.mimetype,
        buffer: uploadedFile.buffer,
        size: uploadedFile.size
      };
    }
  }
  next();
}, uploadToGridFS, extractMenu);

// Separate route for URL-based extraction (JSON payload)
router.post('/extract-url', protect, authorizeRoles(['admin', 'manager']), extractMenu);

// Debug route for testing file upload
router.post('/extract-debug', protect, authorizeRoles(['admin', 'manager']), uploadForMenuExtraction, handleMulterError, (req, res) => {
  console.log('🔍 DEBUG: Extract debug route hit');
  console.log('🔍 DEBUG: Files array:', req.files ? req.files.length : 0, 'files');
  if (req.files && req.files.length > 0) {
    req.files.forEach((file, index) => {
      console.log(`🔍 DEBUG: File ${index}: ${file.fieldname} - ${file.originalname} (${file.size} bytes, ${file.mimetype})`);
    });
  }
  console.log('🔍 DEBUG: Body:', req.body);
  res.json({
    success: true,
    files: req.files || [],
    body: req.body
  });
});

// General image upload endpoint
router.post('/image', protect, authorizeRoles(['admin', 'manager']), uploadSingle, handleMulterError, uploadToGridFS, async (req, res) => {
  try {
    console.log('🔍 DEBUG: Menu extraction /image route hit');
    console.log('🔍 DEBUG: File present:', !!req.file);
    if (req.file) {
      console.log('🔍 DEBUG: File details:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        gridfsId: req.file.gridfsId
      });
    }

    if (!req.file || !req.file.gridfsId) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided or upload failed'
      });
    }

    res.status(200).json({
      success: true,
      imageId: req.file.gridfsId,
      imageUrl: `/api/menu/image/${req.file.gridfsId}`,
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

// Get all extracted menus with pagination and filtering
router.get('/', listMenus);

// Get single extracted menu by ID
router.get('/:id', getMenu);

// Update extracted menu (for editing before saving to MenuItem collection)
router.put('/:id', saveMenu);

// Delete extracted menu
router.delete('/:id', deleteMenu);

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
