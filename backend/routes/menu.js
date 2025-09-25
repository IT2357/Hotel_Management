import express from 'express';
import multer from 'multer';
import {
  extractMenu,
  getMenuPreview,
  saveMenu,
  getMenu,
  getMenuImage,
  listMenus,
  deleteMenu,
  getExtractionStats
} from '../controllers/menuExtractionController.js';
import MenuItem from '../models/MenuItem.js';
import Category from '../models/Category.js';
import { authenticateToken as protect } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleAuth.js';
import { uploadSingle, handleMulterError } from '../middleware/upload.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and GIF images are allowed.'), false);
    }
  }
});


// Routes

/**
 * @route   POST /api/menu/extract
 * @desc    Extract menu from image upload, local path, or URL
 * @access  Protected (Admin/Manager)
 * @body    FormData with file OR JSON with { path: "..." } OR { url: "..." }
 */
router.post('/extract', 
  protect, 
  authorizeRoles(['admin', 'manager']), 
  upload.single('file'), 
  handleMulterError, 
  extractMenu
);

/**
 * @route   GET /api/menu/preview/:id
 * @desc    Get menu preview for admin review
 * @access  Protected (Admin/Manager)
 */
router.get('/preview/:id', 
  protect, 
  authorizeRoles(['admin', 'manager']), 
  getMenuPreview
);

/**
 * @route   POST /api/menu/save
 * @desc    Save edited menu to database
 * @access  Protected (Admin/Manager)
 * @body    { source: {...}, categories: [...], rawText: "..." }
 */
router.post('/save', 
  protect, 
  authorizeRoles(['admin', 'manager']), 
  saveMenu
);

/**
 * @route   GET /api/menu/image/:imageId
 * @desc    Get image from storage (GridFS or Cloudinary)
 * @access  Public (for displaying images)
 */
router.get('/image/:imageId', getMenuImage);

/**
 * @route   GET /api/menu
 * @desc    List all menus with pagination and filters
 * @access  Protected (Admin/Manager)
 * @query   page, limit, source, status, sortBy, sortOrder
 */
router.get('/',
  protect,
  authorizeRoles(['admin', 'manager']),
  listMenus
);

/**
 * @route   GET /api/menu/stats
 * @desc    Get extraction statistics
 * @access  Protected (Admin/Manager)
 */
router.get('/stats',
  protect,
  authorizeRoles(['admin', 'manager']),
  getExtractionStats
);

// Menu Items Management Routes (for existing menu system)

/**
 * @route   GET /api/menu/items
 * @desc    Get all menu items with filters
 * @access  Public for viewing, Protected for admin actions
 */
router.get('/items', protect, authorizeRoles(['admin', 'manager']), async (req, res) => {
  try {
    const { category, search, isAvailable } = req.query;

    let filter = {};

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (isAvailable !== undefined) {
      filter.isAvailable = isAvailable === 'true';
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const menuItems = await MenuItem.find(filter)
      .populate('category', 'name')
      .sort({ createdAt: -1 });

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
      data: menuItemsWithImages,
      count: menuItems.length
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

/**
 * @route   GET /api/menu/:id
 * @desc    Get saved menu by ID
 * @access  Protected (Admin/Manager)
 */
router.get('/:id',
  protect,
  authorizeRoles(['admin', 'manager']),
  getMenu
);

/**
 * @route   DELETE /api/menu/:id
 * @desc    Delete menu by ID
 * @access  Protected (Admin/Manager)
 */
router.delete('/:id',
  protect,
  authorizeRoles(['admin', 'manager']),
  deleteMenu
);

/**
 * @route   GET /api/menu/categories/:category/items
 * @desc    Get menu items by category name
 * @access  Public
 */
router.get('/categories/:category/items', async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 50, page = 1 } = req.query;

    // Find category by name
    const categoryDoc = await Category.findOne({
      name: { $regex: new RegExp(`^${category}$`, 'i') }
    });

    if (!categoryDoc) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get menu items for this category
    const filter = { category: categoryDoc._id, isAvailable: true };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const menuItems = await MenuItem.find(filter)
      .populate('category', 'name')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

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
      data: menuItemsWithImages,
      count: menuItemsWithImages.length
    });
  } catch (error) {
    console.error('Error fetching menu items by category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching menu items by category',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/menu/items/:id
 * @desc    Get single menu item
 * @access  Public
 */
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

/**
 * @route   POST /api/menu/items
 * @desc    Create new menu item
 * @access  Protected (Admin/Manager)
 */
router.post('/items', protect, authorizeRoles(['admin', 'manager']), uploadSingle, handleMulterError, async (req, res) => {
  try {
    const menuItemData = { ...req.body };

    // Handle category: convert string to ObjectId
    if (menuItemData.category && typeof menuItemData.category === 'string') {
      let category = await Category.findOne({ name: menuItemData.category });
      if (!category) {
        // Create new category if it doesn't exist
        category = await Category.create({
          name: menuItemData.category,
          description: `Menu category: ${menuItemData.category}`,
          isActive: true
        });
        console.log(`✅ Created new category: ${menuItemData.category}`);
      }
      menuItemData.category = category._id;
    }

    // Handle image upload
    if (req.file) {
      // Store image in GridFS and set imageId
      try {
        const imageStorageService = (await import('../services/imageStorageService.js')).default;
        const imageId = await imageStorageService.uploadImage(req.file.buffer, req.file.originalname, {
          contentType: req.file.mimetype,
          menuItem: true
        });
        menuItemData.imageId = imageId;
        menuItemData.image = `/api/menu/image/${imageId}`; // Set image URL
      } catch (imageError) {
        console.warn('⚠️ Failed to store image:', imageError.message);
        // Continue without image if storage fails
      }
    } else if (menuItemData.imageUrl) {
      // Handle image URL
      menuItemData.image = menuItemData.imageUrl;
    }

    // Parse JSON fields
    ['ingredients', 'dietaryTags', 'allergens', 'nutritionalInfo', 'customizations'].forEach(field => {
      if (menuItemData[field] && typeof menuItemData[field] === 'string') {
        try {
          menuItemData[field] = JSON.parse(menuItemData[field]);
        } catch (e) {
          console.warn(`⚠️ Failed to parse ${field} JSON:`, e.message);
          // Keep as string if parsing fails
        }
      }
    });

    // Ensure arrays are arrays
    ['ingredients', 'dietaryTags', 'allergens', 'customizations'].forEach(field => {
      if (!Array.isArray(menuItemData[field])) {
        menuItemData[field] = menuItemData[field] ? [menuItemData[field]] : [];
      }
    });

    // Convert boolean strings to actual booleans
    ['isAvailable', 'isVeg', 'isSpicy', 'isPopular'].forEach(field => {
      if (typeof menuItemData[field] === 'string') {
        menuItemData[field] = menuItemData[field] === 'true';
      }
    });

    // Convert numeric strings to numbers
    if (typeof menuItemData.price === 'string') {
      menuItemData.price = parseFloat(menuItemData.price) || 0;
    }
    if (typeof menuItemData.cookingTime === 'string') {
      menuItemData.cookingTime = parseInt(menuItemData.cookingTime) || 15;
    }

    const menuItem = new MenuItem(menuItemData);
    const savedItem = await menuItem.save();

    res.status(201).json({
      success: true,
      data: savedItem,
      message: 'Menu item created successfully'
    });
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating menu item',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/menu/items/:id
 * @desc    Update menu item
 * @access  Protected (Admin/Manager)
 */
router.put('/items/:id', protect, authorizeRoles(['admin', 'manager']), uploadSingle, handleMulterError, async (req, res) => {
  try {
    const menuItemData = { ...req.body };

    // Handle category: convert string to ObjectId
    if (menuItemData.category && typeof menuItemData.category === 'string') {
      let category = await Category.findOne({ name: menuItemData.category });
      if (!category) {
        // Create new category if it doesn't exist
        category = await Category.create({
          name: menuItemData.category,
          description: `Menu category: ${menuItemData.category}`,
          isActive: true
        });
        console.log(`✅ Created new category: ${menuItemData.category}`);
      }
      menuItemData.category = category._id;
    }

    // Handle image upload
    if (req.file) {
      // Store image in GridFS and set imageId
      try {
        const imageStorageService = (await import('../services/imageStorageService.js')).default;
        const imageId = await imageStorageService.uploadImage(req.file.buffer, req.file.originalname, {
          contentType: req.file.mimetype,
          menuItem: true
        });
        menuItemData.imageId = imageId;
        menuItemData.image = `/api/menu/image/${imageId}`; // Set image URL
      } catch (imageError) {
        console.warn('⚠️ Failed to store image:', imageError.message);
        // Continue without image if storage fails
      }
    } else if (menuItemData.imageUrl) {
      // Handle image URL
      menuItemData.image = menuItemData.imageUrl;
    }

    // Parse JSON fields
    ['ingredients', 'dietaryTags', 'allergens', 'nutritionalInfo', 'customizations'].forEach(field => {
      if (menuItemData[field] && typeof menuItemData[field] === 'string') {
        try {
          menuItemData[field] = JSON.parse(menuItemData[field]);
        } catch (e) {
          console.warn(`⚠️ Failed to parse ${field} JSON:`, e.message);
          // Keep as string if parsing fails
        }
      }
    });

    // Ensure arrays are arrays
    ['ingredients', 'dietaryTags', 'allergens', 'customizations'].forEach(field => {
      if (!Array.isArray(menuItemData[field])) {
        menuItemData[field] = menuItemData[field] ? [menuItemData[field]] : [];
      }
    });

    // Convert boolean strings to actual booleans
    ['isAvailable', 'isVeg', 'isSpicy', 'isPopular'].forEach(field => {
      if (typeof menuItemData[field] === 'string') {
        menuItemData[field] = menuItemData[field] === 'true';
      }
    });

    // Convert numeric strings to numbers
    if (typeof menuItemData.price === 'string') {
      menuItemData.price = parseFloat(menuItemData.price) || 0;
    }
    if (typeof menuItemData.cookingTime === 'string') {
      menuItemData.cookingTime = parseInt(menuItemData.cookingTime) || 15;
    }

    const updatedItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      menuItemData,
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: updatedItem,
      message: 'Menu item updated successfully'
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating menu item',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/menu/items/:id
 * @desc    Delete menu item
 * @access  Protected (Admin/Manager)
 */
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

/**
 * @route   POST /api/menu/save-to-menu-items
 * @desc    Save extracted menu items to MenuItem collection
 * @access  Protected (Admin/Manager)
 * @body    { menuId: string } or { items: array }
 */
router.post('/save-to-menu-items', protect, authorizeRoles(['admin', 'manager']), async (req, res) => {
  try {
    const { menuId, items } = req.body;

    let menuItems = [];
    const categoriesToCreate = new Map(); // categoryName -> categoryData

    if (menuId) {
      // Get items from extracted Menu document
      const Menu = (await import('../models/Menu.js')).default;
      const menu = await Menu.findById(menuId);

      if (!menu) {
        return res.status(404).json({
          success: false,
          message: 'Menu not found'
        });
      }

      // Convert menu categories/items to MenuItem format
      for (const category of menu.categories) {
        // Prepare category data
        if (!categoriesToCreate.has(category.name)) {
          categoriesToCreate.set(category.name, {
            name: category.name,
            description: category.description || `Menu category: ${category.name}`,
            isActive: true,
            sortOrder: categoriesToCreate.size
          });
        }

        for (const item of category.items) {
          menuItems.push({
            name: item.name,
            price: item.price || 0,
            description: item.description || '',
            category: category.name, // Will be replaced with ObjectId after category creation
            image: item.image || "https://dummyimage.com/400x300/cccccc/000000&text=Menu+Item",
            isAvailable: true,
            isVeg: item.isVeg || false,
            isSpicy: item.isSpicy || false,
            preparationTime: item.preparationTime || 15,
            allergens: item.allergens || [],
            customizationOptions: item.customizationOptions || [],
            nutritionalInfo: item.nutritionalInfo || {},
            culturalContext: 'jaffna', // Since user mentioned Jaffna
            aiConfidence: item.confidence || 50
          });
        }
      }
    } else if (items && Array.isArray(items)) {
      // Use provided items array
      menuItems = items;
      // Extract unique categories
      const uniqueCategories = [...new Set(items.map(item => item.category))];
      uniqueCategories.forEach((catName, index) => {
        if (!categoriesToCreate.has(catName)) {
          categoriesToCreate.set(catName, {
            name: catName,
            description: `Menu category: ${catName}`,
            isActive: true,
            sortOrder: categoriesToCreate.size
          });
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either menuId or items array is required'
      });
    }

    // Create categories if they don't exist
    const categoryMap = new Map(); // categoryName -> categoryId
    for (const [catName, catData] of categoriesToCreate) {
      let category = await Category.findOne({ name: catName });
      if (!category) {
        category = await Category.create(catData);
        console.log(`✅ Created category: ${catName}`);
      }
      categoryMap.set(catName, category._id);
    }

    // Update menu items with category ObjectIds
    menuItems = menuItems.map(item => ({
      ...item,
      category: categoryMap.get(item.category) || categoryMap.get('General')
    }));

    // Save all items to MenuItem collection (one by one to handle duplicates)
    const savedItems = [];
    const errors = [];

    for (const itemData of menuItems) {
      try {
        // Ensure unique name by adding timestamp if needed
        let uniqueName = itemData.name;
        let counter = 1;
        while (await MenuItem.findOne({ name: uniqueName })) {
          uniqueName = `${itemData.name} (${counter})`;
          counter++;
        }
        itemData.name = uniqueName;

        const savedItem = await MenuItem.create(itemData);
        savedItems.push(savedItem);
      } catch (itemError) {
        console.warn(`Failed to save item "${itemData.name}":`, itemError.message);
        errors.push({
          name: itemData.name,
          error: itemError.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully saved ${savedItems.length} menu items across ${categoriesToCreate.size} categories${errors.length > 0 ? ` (${errors.length} failed)` : ''}`,
      savedCount: savedItems.length,
      categoriesCreated: categoriesToCreate.size,
      errors: errors.length > 0 ? errors : undefined,
      items: savedItems
    });

  } catch (error) {
    console.error('Error saving menu items:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving menu items',
      error: error.message
    });
  }
});

export default router;
