// 📁 backend/controllers/menu/foodController.js
import MenuItem from "../../models/MenuItem.js";
import Category from "../../models/Category.js";
import { validationResult } from "express-validator";

// @desc    Get all food items
// @route   GET /api/menu/items
// @access  Public
export const getFoodItems = async (req, res) => {
  try {
    const { 
      category, 
      isSpicy, 
      isVeg,
      available, 
      search,
      page = 1,
      limit = 50
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (isSpicy !== undefined) filter.isSpicy = isSpicy === 'true';
    if (isVeg !== undefined) filter.isVeg = isVeg === 'true';
    if (available !== undefined) filter.isAvailable = available === 'true';
    
    // Text search
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const menuItems = await MenuItem.find(filter)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Add proper image URLs to each menu item
    const menuItemsWithImages = menuItems.map(item => {
      const itemObj = item.toObject();
      
      // Handle image URL generation
      if (itemObj.imageId) {
        itemObj.imageUrl = `/api/menu/image/${itemObj.imageId}`;
      } else if (itemObj.image && itemObj.image.startsWith('http')) {
        itemObj.imageUrl = itemObj.image;
      } else if (itemObj.image && itemObj.image.startsWith('/api/')) {
        itemObj.imageUrl = itemObj.image;
      } else {
        itemObj.imageUrl = itemObj.image || "https://dummyimage.com/400x300/cccccc/000000&text=Menu+Item";
      }
      
      return itemObj;
    });

    const total = await MenuItem.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: menuItemsWithImages.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: menuItemsWithImages
    });
  } catch (error) {
    console.error('Get food items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch food items',
      error: error.message
    });
  }
};

// @desc    Get food categories
// @route   GET /api/menu/categories
// @access  Public
export const getFoodCategories = async (req, res) => {
  try {
    // Get all categories with item counts
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: 'menuitems',
          localField: '_id',
          foreignField: 'category',
          as: 'items'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          description: 1,
          displayOrder: 1,
          count: { $size: '$items' },
          items: { $slice: ['$items', 3] } // Show first 3 items as preview
        }
      },
      {
        $sort: { displayOrder: 1, name: 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Get food categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch food categories',
      error: error.message
    });
  }
};

// @desc    Get single food item
// @route   GET /api/menu/items/:id
// @access  Public
export const getFoodItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id)
      .populate('category', 'name slug');
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Add proper image URL
    const itemObj = menuItem.toObject();
    if (itemObj.imageId) {
      itemObj.imageUrl = `/api/menu/image/${itemObj.imageId}`;
    } else if (itemObj.image && itemObj.image.startsWith('http')) {
      itemObj.imageUrl = itemObj.image;
    } else if (itemObj.image && itemObj.image.startsWith('/api/')) {
      itemObj.imageUrl = itemObj.image;
    } else {
      itemObj.imageUrl = itemObj.image || "https://dummyimage.com/400x300/cccccc/000000&text=Menu+Item";
    }

    res.status(200).json({
      success: true,
      data: itemObj
    });
  } catch (error) {
    console.error('Get food item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch food item',
      error: error.message
    });
  }
};

// @desc    Get food items by category
// @route   GET /api/menu/categories/:category/items
// @access  Public
export const getFoodItemsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { available = 'true' } = req.query;

    const filter = { 
      category: category,
      isAvailable: available === 'true'
    };

    const menuItems = await MenuItem.find(filter)
      .populate('category', 'name slug')
      .sort({ name: 1 });

    // Add proper image URLs to each menu item
    const menuItemsWithImages = menuItems.map(item => {
      const itemObj = item.toObject();
      
      // Handle image URL generation
      if (itemObj.imageId) {
        itemObj.imageUrl = `/api/menu/image/${itemObj.imageId}`;
      } else if (itemObj.image && itemObj.image.startsWith('http')) {
        itemObj.imageUrl = itemObj.image;
      } else if (itemObj.image && itemObj.image.startsWith('/api/')) {
        itemObj.imageUrl = itemObj.image;
      } else {
        itemObj.imageUrl = itemObj.image || "https://dummyimage.com/400x300/cccccc/000000&text=Menu+Item";
      }
      
      return itemObj;
    });

    res.status(200).json({
      success: true,
      count: menuItemsWithImages.length,
      data: menuItemsWithImages
    });
  } catch (error) {
    console.error('Get food items by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch food items by category',
      error: error.message
    });
  }
};
