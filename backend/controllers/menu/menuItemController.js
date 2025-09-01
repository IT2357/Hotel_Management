// 📁 backend/controllers/menu/menuItemController.js
import MenuItem from "../../models/MenuItem.js";
import Category from "../../models/Category.js";
import { validationResult } from "express-validator";

// @desc    Get all menu items
// @route   GET /api/menu/items
// @access  Public
export const getMenuItems = async (req, res) => {
  try {
    const { 
      category, 
      type, 
      spiceLevel, 
      dietaryTags, 
      active, 
      available,
      search,
      page = 1,
      limit = 50
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (spiceLevel) filter.spiceLevel = spiceLevel;
    if (dietaryTags) filter.dietaryTags = { $in: dietaryTags.split(',') };
    if (active !== undefined) filter.isActive = active === 'true';
    if (available !== undefined) filter.isAvailable = available === 'true';
    
    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const menuItems = await MenuItem.find(filter)
      .populate('category', 'name slug')
      .sort({ displayOrder: 1, name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MenuItem.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: menuItems.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: menuItems
    });
  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu items',
      error: error.message
    });
  }
};

// @desc    Get single menu item
// @route   GET /api/menu/items/:id
// @access  Public
export const getMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id)
      .populate('category', 'name slug');
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    console.error('Get menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu item',
      error: error.message
    });
  }
};

// @desc    Create new menu item
// @route   POST /api/menu/items
// @access  Private (Admin)
export const createMenuItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Verify category exists
    const category = await Category.findById(req.body.category);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category not found'
      });
    }

    const menuItem = await MenuItem.create(req.body);
    await menuItem.populate('category', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: menuItem
    });
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create menu item',
      error: error.message
    });
  }
};

// @desc    Update menu item
// @route   PUT /api/menu/items/:id
// @access  Private (Admin)
export const updateMenuItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Verify category exists if being updated
    if (req.body.category) {
      const category = await Category.findById(req.body.category);
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Category not found'
        });
      }
    }

    const menuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('category', 'name slug');

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      data: menuItem
    });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update menu item',
      error: error.message
    });
  }
};

// @desc    Delete menu item
// @route   DELETE /api/menu/items/:id
// @access  Private (Admin)
export const deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    await MenuItem.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete menu item',
      error: error.message
    });
  }
};

// @desc    Toggle menu item availability
// @route   PATCH /api/menu/items/:id/availability
// @access  Private (Admin)
export const toggleItemAvailability = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    menuItem.isAvailable = !menuItem.isAvailable;
    await menuItem.save();

    res.status(200).json({
      success: true,
      message: `Menu item ${menuItem.isAvailable ? 'made available' : 'marked unavailable'}`,
      data: menuItem
    });
  } catch (error) {
    console.error('Toggle item availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle item availability',
      error: error.message
    });
  }
};

// @desc    Get menu items by category
// @route   GET /api/menu/categories/:categoryId/items
// @access  Public
export const getItemsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { active = 'true', available = 'true' } = req.query;

    const filter = { 
      category: categoryId,
      isActive: active === 'true',
      isAvailable: available === 'true'
    };

    const menuItems = await MenuItem.find(filter)
      .populate('category', 'name slug')
      .sort({ displayOrder: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: menuItems.length,
      data: menuItems
    });
  } catch (error) {
    console.error('Get items by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu items by category',
      error: error.message
    });
  }
};
