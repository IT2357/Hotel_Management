// 📁 backend/controllers/menu/foodController.js
import MenuItem from "../../models/MenuItem.js";
import Category from "../../models/Category.js";
import { validationResult } from "express-validator";

// @desc    Get all food items with advanced filtering
// @route   GET /api/menu/items
// @access  Public
export const getFoodItems = async (req, res) => {
  try {
    const { 
      category, 
      foodType, 
      cuisineType,
      spiceLevel,
      dietary,
      minPrice,
      maxPrice,
      search,
      sortBy = 'displayOrder',
      sortOrder = 'asc',
      page = 1,
      limit = 20
    } = req.query;

    // Build filter object
    const filter = { 
      isActive: true, 
      isAvailable: true 
    };
    
    if (category) filter.category = category;
    if (foodType) filter.foodType = foodType;
    if (cuisineType) filter.cuisineType = cuisineType;
    if (spiceLevel) filter.spiceLevel = spiceLevel;
    if (dietary) filter.dietaryTags = { $in: [dietary] };
    
    // Price range filter
    if (minPrice || maxPrice) {
      filter.$or = [];
      
      // Handle items with portions
      const portionFilter = {};
      if (minPrice) portionFilter['portions.price'] = { $gte: parseFloat(minPrice) };
      if (maxPrice) {
        if (portionFilter['portions.price']) {
          portionFilter['portions.price'].$lte = parseFloat(maxPrice);
        } else {
          portionFilter['portions.price'] = { $lte: parseFloat(maxPrice) };
        }
      }
      filter.$or.push({ portions: { $elemMatch: portionFilter } });
      
      // Handle items with base price
      const basePriceFilter = {};
      if (minPrice) basePriceFilter.basePrice = { $gte: parseFloat(minPrice) };
      if (maxPrice) {
        if (basePriceFilter.basePrice) {
          basePriceFilter.basePrice.$lte = parseFloat(maxPrice);
        } else {
          basePriceFilter.basePrice = { $lte: parseFloat(maxPrice) };
        }
      }
      filter.$or.push(basePriceFilter);
    }
    
    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const foodItems = await MenuItem.find(filter)
      .populate('category', 'name slug')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await MenuItem.countDocuments(filter);

    // Add computed fields
    const enhancedItems = foodItems.map(item => ({
      ...item,
      primaryImage: item.images.find(img => img.isPrimary) || item.images[0],
      displayPrice: item.portions?.length > 0 
        ? (item.portions.find(p => p.isDefault)?.price || item.portions[0].price)
        : item.basePrice
    }));

    res.status(200).json({
      success: true,
      count: enhancedItems.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: enhancedItems
    });

  } catch (error) {
    console.error('Error fetching food items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching food items',
      error: error.message
    });
  }
};

// @desc    Search food items with text search
// @route   GET /api/menu/items/search
// @access  Public
export const searchFoodItems = async (req, res) => {
  try {
    const { q, category, foodType, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const filter = {
      $text: { $search: q },
      isActive: true,
      isAvailable: true
    };

    if (category) filter.category = category;
    if (foodType) filter.foodType = foodType;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const items = await MenuItem.find(filter)
      .populate('category', 'name slug')
      .select('name description images basePrice portions foodType spiceLevel')
      .sort({ score: { $meta: "textScore" } })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await MenuItem.countDocuments(filter);

    const results = items.map(item => ({
      ...item,
      primaryImage: item.images.find(img => img.isPrimary) || item.images[0],
      displayPrice: item.portions?.length > 0 
        ? (item.portions.find(p => p.isDefault)?.price || item.portions[0].price)
        : item.basePrice
    }));

    res.status(200).json({
      success: true,
      count: results.length,
      total,
      data: results
    });

  } catch (error) {
    console.error('Error searching food items:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching food items',
      error: error.message
    });
  }
};

// @desc    Get featured food items
// @route   GET /api/menu/items/featured
// @access  Public
export const getFeaturedItems = async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const items = await MenuItem.find({
      isActive: true,
      isAvailable: true,
      $or: [
        { isSignatureDish: true },
        { isChefSpecial: true },
        { isPopular: true }
      ]
    })
    .populate('category', 'name slug')
    .sort({ displayOrder: 1, createdAt: -1 })
    .limit(parseInt(limit))
    .lean();

    const enhancedItems = items.map(item => ({
      ...item,
      primaryImage: item.images.find(img => img.isPrimary) || item.images[0],
      displayPrice: item.portions?.length > 0 
        ? (item.portions.find(p => p.isDefault)?.price || item.portions[0].price)
        : item.basePrice
    }));

    res.status(200).json({
      success: true,
      count: enhancedItems.length,
      data: enhancedItems
    });

  } catch (error) {
    console.error('Error fetching featured items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured items',
      error: error.message
    });
  }
};

// @desc    Get popular food items
// @route   GET /api/menu/items/popular
// @access  Public
export const getPopularItems = async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const items = await MenuItem.find({
      isActive: true,
      isAvailable: true,
      isPopular: true
    })
    .populate('category', 'name slug')
    .sort({ 'reviews.averageRating': -1, 'reviews.totalReviews': -1 })
    .limit(parseInt(limit))
    .lean();

    const enhancedItems = items.map(item => ({
      ...item,
      primaryImage: item.images.find(img => img.isPrimary) || item.images[0],
      displayPrice: item.portions?.length > 0 
        ? (item.portions.find(p => p.isDefault)?.price || item.portions[0].price)
        : item.basePrice
    }));

    res.status(200).json({
      success: true,
      count: enhancedItems.length,
      data: enhancedItems
    });

  } catch (error) {
    console.error('Error fetching popular items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching popular items',
      error: error.message
    });
  }
;

// @desc    Get food categories (legacy support)
// @route   GET /api/menu/categories
// @access  Public
export const getFoodCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    // Add item count for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const itemCount = await MenuItem.countDocuments({
          category: category._id,
          isActive: true,
          isAvailable: true
        });

        return {
          ...category,
          itemCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: categoriesWithCounts.length,
      data: categoriesWithCounts
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
    const foodItem = await MenuItem.findOne({
      _id: req.params.id,
      isActive: true
    })
    .populate('category', 'name slug description')
    .lean();
    
    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    // Add computed fields
    const enhancedItem = {
      ...foodItem,
      primaryImage: foodItem.images.find(img => img.isPrimary) || foodItem.images[0],
      displayPrice: foodItem.portions?.length > 0 
        ? (foodItem.portions.find(p => p.isDefault)?.price || foodItem.portions[0].price)
        : foodItem.basePrice
    };

    res.status(200).json({
      success: true,
      data: enhancedItem
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
// @route   GET /api/menu/categories/:categoryId/items
// @access  Public
export const getFoodItemsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { available = 'true', limit = 20, page = 1 } = req.query;

    const filter = { 
      category: categoryId,
      isActive: true,
      isAvailable: available === 'true'
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const foodItems = await MenuItem.find(filter)
      .populate('category', 'name slug')
      .sort({ displayOrder: 1, name: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await MenuItem.countDocuments(filter);

    const enhancedItems = foodItems.map(item => ({
      ...item,
      primaryImage: item.images.find(img => img.isPrimary) || item.images[0],
      displayPrice: item.portions?.length > 0 
        ? (item.portions.find(p => p.isDefault)?.price || item.portions[0].price)
        : item.basePrice
    }));

    res.status(200).json({
      success: true,
      count: enhancedItems.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: enhancedItems
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

// @desc    Create new food item
// @route   POST /api/menu/items
// @access  Private (Admin/Staff)
export const createFoodItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const foodItem = await MenuItem.create(req.body);
    
    await foodItem.populate('category', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Food item created successfully',
      data: foodItem
    });
  } catch (error) {
    console.error('Create food item error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Food item with this name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create food item',
      error: error.message
    });
  }
};

// @desc    Update food item
// @route   PUT /api/menu/items/:id
// @access  Private (Admin/Staff)
export const updateFoodItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const foodItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('category', 'name slug');

    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Food item updated successfully',
      data: foodItem
    });
  } catch (error) {
    console.error('Update food item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update food item',
      error: error.message
    });
  }
};

// @desc    Delete food item
// @route   DELETE /api/menu/items/:id
// @access  Private (Admin/Staff)
export const deleteFoodItem = async (req, res) => {
  try {
    const foodItem = await MenuItem.findById(req.params.id);

    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    await MenuItem.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Food item deleted successfully'
    });
  } catch (error) {
    console.error('Delete food item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete food item',
      error: error.message
    });
  }
};

// @desc    Update food item stock
// @route   PATCH /api/menu/items/:id/stock
// @access  Private (Admin/Staff)
export const updateItemStock = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { quantity, operation } = req.body;
    const foodItem = await MenuItem.findById(req.params.id);

    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    // Update stock based on operation
    switch (operation) {
      case 'add':
        foodItem.inventory.stockLevel += quantity;
        break;
      case 'subtract':
        foodItem.inventory.stockLevel = Math.max(0, foodItem.inventory.stockLevel - quantity);
        break;
      case 'set':
        foodItem.inventory.stockLevel = quantity;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid operation'
        });
    }

    // Update low stock status
    foodItem.inventory.isLowStock = foodItem.inventory.stockLevel <= foodItem.inventory.lowStockThreshold;

    // Update availability if out of stock
    if (foodItem.inventory.stockLevel === 0) {
      foodItem.isAvailable = false;
    }

    await foodItem.save();

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        stockLevel: foodItem.inventory.stockLevel,
        isLowStock: foodItem.inventory.isLowStock,
        isAvailable: foodItem.isAvailable
      }
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock',
      error: error.message
    });
  }
};
