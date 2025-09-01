// 📁 backend/controllers/menu/foodController.js
import Food from "../../models/Food.js";
import { validationResult } from "express-validator";

// @desc    Get all food items
// @route   GET /api/menu/items
// @access  Public
export const getFoodItems = async (req, res) => {
  try {
    const { 
      category, 
      dietType, 
      isSpicy, 
      isHalal,
      available, 
      search,
      page = 1,
      limit = 50
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (category) filter.category = category;
    if (dietType) filter.dietType = dietType;
    if (isSpicy !== undefined) filter.isSpicy = isSpicy === 'true';
    if (isHalal !== undefined) filter.isHalal = isHalal === 'true';
    if (available !== undefined) filter.isAvailable = available === 'true';
    
    // Text search
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const foodItems = await Food.find(filter)
      .sort({ category: 1, name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Food.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: foodItems.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: foodItems
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
    const categories = await Food.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          items: { $push: "$$ROOT" }
        }
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          count: 1,
          items: { $slice: ["$items", 3] } // Show first 3 items as preview
        }
      },
      {
        $sort: { name: 1 }
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
    const foodItem = await Food.findById(req.params.id);
    
    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: foodItem
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

    const foodItems = await Food.find(filter)
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: foodItems.length,
      data: foodItems
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
