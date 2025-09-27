// 📁 backend/routes/food/menuRoutes.js
import express from 'express';
import MenuItem from '../../models/MenuItem.js';
import Category from '../../models/Category.js';

const router = express.Router();

// Get all menu items
router.get('/items', async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ isAvailable: true }).populate('category');
    res.json({
      success: true,
      data: menuItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching menu items',
      error: error.message
    });
  }
});

// Get menu item by ID
router.get('/items/:id', async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate('category');
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }
    res.json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching menu item',
      error: error.message
    });
  }
});

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true });
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

// Get menu items by category
router.get('/categories/:category/items', async (req, res) => {
  try {
    const category = await Category.findOne({ name: req.params.category });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    const menuItems = await MenuItem.find({
      category: category._id,
      isAvailable: true
    });
    res.json({
      success: true,
      data: menuItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching menu items by category',
      error: error.message
    });
  }
});

// Get featured items
router.get('/featured', async (req, res) => {
  try {
    const featuredItems = await MenuItem.find({
      isAvailable: true,
      isFeatured: true
    }).populate('category').limit(10);
    res.json({
      success: true,
      data: featuredItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching featured items',
      error: error.message
    });
  }
});

// Get popular items
router.get('/popular', async (req, res) => {
  try {
    const popularItems = await MenuItem.find({ isAvailable: true })
      .populate('category')
      .sort({ orderCount: -1 })
      .limit(10);
    res.json({
      success: true,
      data: popularItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching popular items',
      error: error.message
    });
  }
});

export default router;
