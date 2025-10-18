import express from 'express';
// Fix the import paths to point to the correct backend middleware
import { authenticateToken } from '../../../../backend/middleware/auth.js';
import { authorizeRoles } from '../../../../backend/middleware/roleAuth.js';
import { body, validationResult } from 'express-validator';
// Fix the import path for MenuItem model
import MenuItem from '../../../../backend/models/MenuItem.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Configure __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', '..', '..', 'uploads', 'menu-items'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Images only! (jpeg, jpg, png, gif)'));
    }
  }
});

// @route   POST /food-fixes/admin/menu
// @desc    Create a new menu item
// @access  Private/Admin
router.post('/menu', 
  [authenticateToken, authorizeRoles({ roles: ['admin', 'manager'] }), upload.single('image')],
  [
    body('name.en', 'English name is required').notEmpty(),
    body('name.ta', 'Tamil name is required').notEmpty(),
    body('price', 'Price is required and must be a number').isFloat({ min: 0 }),
    body('description.en', 'English description is required').notEmpty(),
    body('description.ta', 'Tamil description is required').notEmpty(),
    body('category', 'Category is required').notEmpty(),
    body('ingredients', 'Ingredients are required').isArray({ min: 1 }),
    body('tags', 'Tags must be an array').optional().isArray(),
    body('availability', 'Availability is required').isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { name, price, description, category, ingredients, tags, availability } = req.body;
      
      // Adjust price by -5% as per requirements
      const adjustedPrice = price * 0.95;

      const menuItem = new MenuItem({
        name: {
          en: name.en,
          ta: name.ta
        },
        price: adjustedPrice,
        originalPrice: price,
        description: {
          en: description.en,
          ta: description.ta
        },
        category,
        ingredients: JSON.parse(ingredients),
        tags: tags ? JSON.parse(tags) : [],
        availability: availability === 'true' || availability === true,
        imageUrl: req.file ? `/uploads/menu-items/${req.file.filename}` : null
      });

      const savedItem = await menuItem.save();
      res.json({ success: true, data: savedItem });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ success: false, msg: 'Server Error' });
    }
  }
);

// @route   GET /food-fixes/admin/menu
// @desc    Get all menu items with pagination
// @access  Private/Admin
router.get('/menu', [authenticateToken, authorizeRoles({ roles: ['admin', 'manager'] })], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const searchQuery = req.query.search ? {
      $or: [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ]
    } : {};
    
    const totalCount = await MenuItem.countDocuments(searchQuery);
    
    const menuItems = await MenuItem.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: menuItems,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
});

// @route   GET /food-fixes/admin/menu/:id
// @desc    Get a specific menu item by ID
// @access  Private/Admin
router.get('/menu/:id', [authenticateToken, authorizeRoles({ roles: ['admin', 'manager'] })], async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({ success: false, msg: 'Menu item not found' });
    }

    res.json({ success: true, data: menuItem });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ success: false, msg: 'Menu item not found' });
    }
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
});

// @route   PUT /food-fixes/admin/menu/:id
// @desc    Update a menu item
// @access  Private/Admin
router.put('/menu/:id', 
  [authenticateToken, authorizeRoles({ roles: ['admin', 'manager'] }), upload.single('image')],
  [
    body('name.en', 'English name is required').optional().notEmpty(),
    body('name.ta', 'Tamil name is required').optional().notEmpty(),
    body('price', 'Price must be a number').optional().isFloat({ min: 0 }),
    body('description.en', 'English description is required').optional().notEmpty(),
    body('description.ta', 'Tamil description is required').optional().notEmpty(),
    body('category', 'Category is required').optional().notEmpty(),
    body('ingredients', 'Ingredients must be an array').optional().isArray(),
    body('tags', 'Tags must be an array').optional().isArray(),
    body('availability', 'Availability must be a boolean').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { name, price, description, category, ingredients, tags, availability } = req.body;
      
      const updateFields = {};
      
      if (name) {
        updateFields.name = {
          en: name.en || undefined,
          ta: name.ta || undefined
        };
      }
      
      if (price) {
        const numericPrice = parseFloat(price);
        updateFields.price = numericPrice * 0.95;
        updateFields.originalPrice = numericPrice;
      }
      
      if (description) {
        updateFields.description = {
          en: description.en || undefined,
          ta: description.ta || undefined
        };
      }
      
      if (category) updateFields.category = category;
      if (ingredients) updateFields.ingredients = JSON.parse(ingredients);
      if (tags) updateFields.tags = JSON.parse(tags);
      if (availability !== undefined) updateFields.availability = availability === 'true' || availability === true;
      if (req.file) updateFields.imageUrl = `/uploads/menu-items/${req.file.filename}`;

      const menuItem = await MenuItem.findByIdAndUpdate(
        req.params.id,
        { $set: updateFields },
        { new: true, runValidators: true }
      );

      if (!menuItem) {
        return res.status(404).json({ success: false, msg: 'Menu item not found' });
      }

      res.json({ success: true, data: menuItem });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ success: false, msg: 'Menu item not found' });
      }
      res.status(500).json({ success: false, msg: 'Server Error' });
    }
  }
);

// @route   DELETE /food-fixes/admin/menu/:id
// @desc    Delete a menu item
// @access  Private/Admin
router.delete('/menu/:id', [authenticateToken, authorizeRoles({ roles: ['admin', 'manager'] })], async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({ success: false, msg: 'Menu item not found' });
    }

    // In a real implementation, you might want to handle cascade deletion
    // or mark as deleted rather than actually deleting
    await menuItem.remove();
    
    res.json({ success: true, msg: 'Menu item removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ success: false, msg: 'Menu item not found' });
    }
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
});

export default router;