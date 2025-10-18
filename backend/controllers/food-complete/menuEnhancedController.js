/**
 * 🍽️ Enhanced Menu Controller (2025 Production-Ready)
 * Full CRUD with pagination, search, soft delete, image upload
 * Supports bilingual Tamil/English Jaffna cuisine
 */

import MenuItem from '../../models/MenuItem.js';
import Category from '../../models/Category.js';
import { 
  createMenuItemSchema, 
  updateMenuItemSchema, 
  menuQuerySchema 
} from '../../validations/food-complete/menuValidation.js';
import { imageStorageService } from '../../services/imageStorageService.js';

/**
 * @route   POST /api/food-complete/menu
 * @desc    Create new menu item (Admin only)
 * @access  Private/Admin
 */
export const createMenuItem = async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = createMenuItemSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }))
      });
    }

    // Verify category exists
    const categoryExists = await Category.findById(value.category);
    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Handle image upload if file provided
    let imageData = {};
    if (req.file) {
      try {
        const uploadResult = await imageStorageService.uploadImage(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        imageData = {
          image: uploadResult.url,
          imageId: uploadResult.fileId
        };
      } catch (uploadError) {
        console.error('❌ Image upload failed:', uploadError);
        // Continue without image (non-blocking)
      }
    }

    // Create menu item
    const menuItem = await MenuItem.create({
      ...value,
      ...imageData,
      createdBy: req.user?.userId
    });

    // Populate category
    await menuItem.populate('category', 'name description color icon');

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: menuItem
    });

  } catch (error) {
    console.error('❌ Create menu item error:', error);
    next(error);
  }
};

/**
 * @route   GET /api/food-complete/menu
 * @desc    Get all menu items with filters, search, pagination
 * @access  Public
 */
export const getMenuItems = async (req, res, next) => {
  try {
    // Validate query params
    const { error, value } = menuQuerySchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: error.details.map(d => d.message)
      });
    }

    const {
      search,
      category,
      dietaryTags,
      isVeg,
      isSpicy,
      isPopular,
      isAvailable,
      mealTime,
      page,
      limit,
      sortBy,
      sortOrder
    } = value;

    // Build query
    const query = { isDeleted: { $ne: true } };

    // Search (fuzzy match on names and ingredients)
    if (search) {
      query.$or = [
        { name_english: { $regex: search, $options: 'i' } },
        { name_tamil: { $regex: search, $options: 'i' } },
        { description_english: { $regex: search, $options: 'i' } },
        { ingredients: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Dietary tags filter
    if (dietaryTags) {
      const tags = Array.isArray(dietaryTags) ? dietaryTags : [dietaryTags];
      query.dietaryTags = { $in: tags };
    }

    // Boolean filters
    if (isVeg !== undefined) query.isVeg = isVeg;
    if (isSpicy !== undefined) query.isSpicy = isSpicy;
    if (isPopular !== undefined) query.isPopular = isPopular;
    if (isAvailable !== undefined) query.isAvailable = isAvailable;

    // Meal time filter
    if (mealTime) {
      const mealTimeMap = {
        breakfast: 'isBreakfast',
        lunch: 'isLunch',
        dinner: 'isDinner',
        snacks: 'isSnacks'
      };
      query[mealTimeMap[mealTime]] = true;
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    // Add secondary sort by name for consistency
    if (sortBy !== 'name_english') {
      sortOptions.name_english = 1;
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Execute query with population
    const [items, total] = await Promise.all([
      MenuItem.find(query)
        .populate('category', 'name description color icon')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      MenuItem.countDocuments(query)
    ]);

    // Add image URLs for GridFS images
    const itemsWithImageUrls = items.map(item => ({
      ...item,
      imageUrl: item.imageId 
        ? `${req.protocol}://${req.get('host')}/api/menu/image/${item.imageId}`
        : item.image || null
    }));

    res.status(200).json({
      success: true,
      data: {
        items: itemsWithImageUrls,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
          hasMore: page < Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Get menu items error:', error);
    next(error);
  }
};

/**
 * @route   GET /api/food-complete/menu/:id
 * @desc    Get single menu item by ID
 * @access  Public
 */
export const getMenuItemById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findOne({
      _id: id,
      isDeleted: { $ne: true }
    }).populate('category', 'name description color icon');

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Add image URL
    const itemWithImageUrl = {
      ...menuItem.toObject(),
      imageUrl: menuItem.imageId
        ? `${req.protocol}://${req.get('host')}/api/menu/image/${menuItem.imageId}`
        : menuItem.image || null
    };

    res.status(200).json({
      success: true,
      data: itemWithImageUrl
    });

  } catch (error) {
    console.error('❌ Get menu item by ID error:', error);
    next(error);
  }
};

/**
 * @route   PUT /api/food-complete/menu/:id
 * @desc    Update menu item (Admin only)
 * @access  Private/Admin
 */
export const updateMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate request body
    const { error, value } = updateMenuItemSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }))
      });
    }

    // Check if menu item exists
    const existingItem = await MenuItem.findOne({
      _id: id,
      isDeleted: { $ne: true }
    });

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Verify category if being updated
    if (value.category) {
      const categoryExists = await Category.findById(value.category);
      if (!categoryExists) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
    }

    // Handle new image upload
    if (req.file) {
      try {
        // Delete old image if exists
        if (existingItem.imageId) {
          await imageStorageService.deleteImage(existingItem.imageId);
        }

        // Upload new image
        const uploadResult = await imageStorageService.uploadImage(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        value.image = uploadResult.url;
        value.imageId = uploadResult.fileId;
      } catch (uploadError) {
        console.error('❌ Image upload failed:', uploadError);
      }
    }

    // Update menu item
    const updatedItem = await MenuItem.findByIdAndUpdate(
      id,
      { 
        ...value, 
        updatedBy: req.user?.userId 
      },
      { new: true, runValidators: true }
    ).populate('category', 'name description color icon');

    res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      data: updatedItem
    });

  } catch (error) {
    console.error('❌ Update menu item error:', error);
    next(error);
  }
};

/**
 * @route   DELETE /api/food-complete/menu/:id
 * @desc    Soft delete menu item (Admin only)
 * @access  Private/Admin
 */
export const deleteMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findOne({
      _id: id,
      isDeleted: { $ne: true }
    });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Soft delete (preserve data for analytics)
    menuItem.isDeleted = true;
    menuItem.deletedAt = new Date();
    menuItem.deletedBy = req.user?.userId;
    await menuItem.save();

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete menu item error:', error);
    next(error);
  }
};

/**
 * @route   PATCH /api/food-complete/menu/:id/availability
 * @desc    Toggle menu item availability (quick action)
 * @access  Private/Admin
 */
export const toggleAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;

    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isAvailable must be a boolean'
      });
    }

    const menuItem = await MenuItem.findByIdAndUpdate(
      id,
      { isAvailable },
      { new: true }
    );

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Menu item ${isAvailable ? 'enabled' : 'disabled'} successfully`,
      data: { id: menuItem._id, isAvailable: menuItem.isAvailable }
    });

  } catch (error) {
    console.error('❌ Toggle availability error:', error);
    next(error);
  }
};

/**
 * @route   GET /api/food-complete/menu/stats/summary
 * @desc    Get menu statistics (Admin dashboard)
 * @access  Private/Admin
 */
export const getMenuStats = async (req, res, next) => {
  try {
    const [
      totalItems,
      availableItems,
      categories,
      popularItems,
      vegItems,
      spicyItems
    ] = await Promise.all([
      MenuItem.countDocuments({ isDeleted: { $ne: true } }),
      MenuItem.countDocuments({ isDeleted: { $ne: true }, isAvailable: true }),
      Category.countDocuments({ isActive: true }),
      MenuItem.countDocuments({ isDeleted: { $ne: true }, isPopular: true }),
      MenuItem.countDocuments({ isDeleted: { $ne: true }, isVeg: true }),
      MenuItem.countDocuments({ isDeleted: { $ne: true }, isSpicy: true })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalItems,
        availableItems,
        unavailableItems: totalItems - availableItems,
        categories,
        popularItems,
        vegItems,
        spicyItems,
        percentageAvailable: totalItems > 0 
          ? Math.round((availableItems / totalItems) * 100) 
          : 0
      }
    });

  } catch (error) {
    console.error('❌ Get menu stats error:', error);
    next(error);
  }
};

export default {
  createMenuItem,
  getMenuItems,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
  getMenuStats
};
