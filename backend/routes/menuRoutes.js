import express from 'express';
import { processMenuImage, createBatchMenuItems, generateMenuItems, generateMenuFromImage, createMenuItem, updateMenuItem, getMenuItemImage } from '../controllers/menuController.js';
import { extractMenu } from '../controllers/menuExtractionController.js';
import MenuItem from '../models/MenuItem.js';
import { authenticateToken as protect } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleAuth.js';
import { uploadSingle, handleMulterError } from '../middleware/upload.js';
import { uploadSingle as uploadSingleGridFS, uploadToGridFS, handleMulterError as handleGridFSMulterError } from '../middleware/gridfsUpload.js';

const router = express.Router();

// Public routes - no authentication required for viewing menu
// Get all menu items (for guests and staff)
router.get('/items', async (req, res) => {
  try {
    const { category, search, isAvailable, limit } = req.query;

    let filter = {};

    // Handle category filtering - category field is ObjectId reference
    if (category && category !== 'all') {
      // First try to find category by name
      const Category = (await import('../models/Category.js')).default;
      const categoryDoc = await Category.findOne({
        $or: [
          { name: { $regex: new RegExp(`^${category}$`, 'i') } },
          { slug: category.toLowerCase() }
        ]
      });

      if (categoryDoc) {
        filter.category = categoryDoc._id;
      } else {
        // If category not found, return empty result
        return res.status(200).json({
          success: true,
          data: [],
          count: 0
        });
      }
    }

    if (isAvailable !== undefined) {
      filter.isAvailable = isAvailable === 'true';
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    let query = MenuItem.find(filter)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 });

    // Apply limit if specified
    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum) && limitNum > 0) {
        query = query.limit(limitNum);
      }
    }

    const menuItems = await query;

    // Add imageUrl to each menu item for frontend display
    const menuItemsWithImages = menuItems.map(item => {
      const itemObj = item.toObject();
      if (itemObj.image && itemObj.image.data) {
        itemObj.imageUrl = `data:${itemObj.image.contentType};base64,${itemObj.image.data.toString('base64')}`;
      }
      return itemObj;
    });

    res.status(200).json({
      success: true,
      data: menuItemsWithImages
    });
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching menu items',
      error: error.message
    });
  }
});

// Get single menu item
router.get('/items/:id', async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Add imageUrl for frontend display
    const responseItem = menuItem.toObject();
    if (responseItem.image && responseItem.image.data) {
      responseItem.imageUrl = `data:${responseItem.image.contentType};base64,${responseItem.image.data.toString('base64')}`;
    }

    res.status(200).json({
      success: true,
      data: responseItem
    });
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching menu item',
      error: error.message
    });
  }
});

// Create single menu item
router.post('/items', protect, authorizeRoles(['admin', 'manager']), uploadSingle, handleMulterError, createMenuItem);

// Update menu item
router.put('/items/:id', protect, authorizeRoles(['admin', 'manager']), uploadSingle, handleMulterError, updateMenuItem);

// Get menu item image
router.get('/items/:id/image', getMenuItemImage);

// Delete menu item
router.delete('/items/:id', protect, authorizeRoles(['admin', 'manager']), async (req, res) => {
  try {
    const menuItem = await MenuItem.findByIdAndDelete(req.params.id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting menu item',
      error: error.message
    });
  }
});

// AI Menu Generation routes
router.post('/generate', protect, authorizeRoles(['admin', 'manager']), generateMenuItems);
router.post('/generate-from-image', protect, authorizeRoles(['admin', 'manager']), uploadSingle, handleMulterError, generateMenuFromImage);

// Process menu image (OCR)
router.post('/process-image', protect, authorizeRoles(['admin', 'manager']), uploadSingle, handleMulterError, processMenuImage);

// AI Menu Extraction (supports file upload, URL, and file path)
router.post('/extract', protect, authorizeRoles(['admin', 'manager']), uploadSingleGridFS, handleGridFSMulterError, uploadToGridFS, extractMenu);

export default router;
