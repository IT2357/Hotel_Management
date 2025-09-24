import imageStorageService from "../../services/imageStorageService.js";
// 📁 backend/controllers/food/menuController.js
import MenuItem from "../../models/MenuItem.js";
import Category from "../../models/Category.js";
import mongoose from "mongoose";

// Get all menu items with advanced filtering
export const getMenuItems = async (req, res) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      dietary,
      spiceLevel,
      isAvailable,
      sortBy = "name",
      sortOrder = "asc",
      page = 1,
      limit = 20,
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (category && category !== "all") {
      filter.category = category;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { ingredients: { $regex: search, $options: "i" } },
      ];
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    
    if (dietary) {
      const dietaryArray = dietary.split(",");
      filter.dietaryTags = { $in: dietaryArray };
    }
    
    if (spiceLevel) {
      filter.spiceLevel = spiceLevel;
    }
    
    if (isAvailable !== undefined) {
      filter.isAvailable = isAvailable === "true";
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with population
    const menuItems = await MenuItem.find(filter)
      .populate("category", "name slug displayOrder")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalItems = await MenuItem.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / parseInt(limit));

    res.json({
      success: true,
      data: {
        items: menuItems,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching menu items:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch menu items",
      error: error.message,
    });
  }
};

// Get single menu item by ID or slug
export const getMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if it's a valid ObjectId or treat as slug
    const query = mongoose.Types.ObjectId.isValid(id) 
      ? { _id: id } 
      : { slug: id };

    const menuItem = await MenuItem.findOne(query)
      .populate("category", "name slug displayOrder")
      .lean();

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    res.json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    console.error("Error fetching menu item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch menu item",
      error: error.message,
    });
  }
};

// Create new menu item (Admin only)
export const createMenuItem = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      image,
      ingredients,
      allergens,
      nutritionalInfo,
      dietaryTags,
      spiceLevel,
      cookingTime,
      portions,
      isAvailable,
      isPopular,
      isFeatured,
    } = req.body;

    // Validate required fields
    if (!name || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        message: "Name, description, price, and category are required",
      });
    }

    // Check if category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    // Handle image upload
    let imageUrl = image || "https://dummyimage.com/400x300/cccccc/000000&text=Menu+Item";
    let imageId = null;

    if (req.file) {
      try {
        // Upload image using imageStorageService
        const uploadedImageId = await imageStorageService.uploadImage(
          req.file.buffer,
          req.file.originalname,
          { folder: 'menu-items' }
        );
        imageUrl = uploadedImageId; // Store the prefixed identifier
        imageId = uploadedImageId; // Also store for GridFS reference if needed
      } catch (uploadError) {
        console.error("Image upload failed:", uploadError);
        // Continue with default image if upload fails
      }
    }

    // Create menu item
    const menuItem = new MenuItem({
      name,
      description,
      price: parseFloat(price),
      category,
      image: imageUrl,
      imageId: imageId,
      ingredients: ingredients || [],
      allergens: allergens || [],
      nutritionalInfo: nutritionalInfo || {},
      dietaryTags: dietaryTags || [],
      spiceLevel: spiceLevel || "mild",
      cookingTime: parseInt(cookingTime) || 15,
      portions: portions || [{ name: "Regular", price: parseFloat(price) }],
      isAvailable: isAvailable !== false,
      isPopular: isPopular === true,
      isFeatured: isFeatured === true,
    });

    await menuItem.save();

    // Populate category before sending response
    await menuItem.populate("category", "name slug displayOrder");

    res.status(201).json({
      success: true,
      message: "Menu item created successfully",
      data: menuItem,
    });
  } catch (error) {
    console.error("Error creating menu item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create menu item",
      error: error.message,
    });
  }
};

// Update menu item (Admin only)
export const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.slug;

    // Validate category if provided
    if (updateData.category) {
      const categoryExists = await Category.findById(updateData.category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID",
        });
      }
    }

    // Handle image upload if new file is provided
    if (req.file) {
      try {
        // Upload new image using imageStorageService
        const uploadedImageId = await imageStorageService.uploadImage(
          req.file.buffer,
          req.file.originalname,
          { folder: 'menu-items' }
        );
        updateData.image = uploadedImageId; // Store the prefixed identifier
        updateData.imageId = uploadedImageId; // Also store for GridFS reference if needed

        // TODO: Delete old image if it exists
      } catch (uploadError) {
        console.error("Image upload failed:", uploadError);
        // Continue without updating image if upload fails
      }
    }

    // Update price in portions if price is updated
    if (updateData.price && updateData.portions) {
      updateData.portions = updateData.portions.map(portion => ({
        ...portion,
        price: portion.name === "Regular" ? parseFloat(updateData.price) : portion.price
      }));
    }

    const menuItem = await MenuItem.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate("category", "name slug displayOrder");

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    res.json({
      success: true,
      message: "Menu item updated successfully",
      data: menuItem,
    });
  } catch (error) {
    console.error("Error updating menu item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update menu item",
      error: error.message,
    });
  }
};

// Delete menu item (Admin only)
export const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findByIdAndDelete(id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    res.json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete menu item",
      error: error.message,
    });
  }
};

// Create new category
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    // Create category
    const category = new Category({
      name,
      description,
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create category",
      error: error.message,
    });
  }
};

// Get menu categories with item counts
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: "menuitems",
          localField: "_id",
          foreignField: "category",
          as: "items",
        },
      },
      {
        $addFields: {
          itemCount: { $size: "$items" },
        },
      },
      {
        $project: {
          items: 0,
        },
      },
      {
        $sort: { displayOrder: 1, name: 1 },
      },
    ]);

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
};

// Get featured menu items
export const getFeaturedItems = async (req, res) => {
  try {
    const featuredItems = await MenuItem.find({ 
      isFeatured: true, 
      isAvailable: true 
    })
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    res.json({
      success: true,
      data: featuredItems,
    });
  } catch (error) {
    console.error("Error fetching featured items:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch featured items",
      error: error.message,
    });
  }
};

// Get popular menu items
export const getPopularItems = async (req, res) => {
  try {
    const popularItems = await MenuItem.find({ 
      isPopular: true, 
      isAvailable: true 
    })
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    res.json({
      success: true,
      data: popularItems,
    });
  } catch (error) {
    console.error("Error fetching popular items:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch popular items",
      error: error.message,
    });
  }
};

// Batch create menu items (for AI extraction)
export const batchCreateMenuItems = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: "Items array is required",
      });
    }

    const createdItems = [];
    const errors = [];

    for (const itemData of items) {
      try {
        // Find or create category
        let category = await Category.findOne({ name: itemData.category });
        if (!category) {
          category = new Category({ name: itemData.category });
          await category.save();
        }

        // Create menu item
        const menuItem = new MenuItem({
          name: itemData.name,
          description: itemData.description || '',
          price: parseFloat(itemData.price) || 0,
          category: category._id,
          image: itemData.image || "https://dummyimage.com/400x300/cccccc/000000&text=Menu+Item",
          ingredients: itemData.ingredients || [],
          allergens: itemData.allergens || [],
          nutritionalInfo: itemData.nutritionalInfo || {},
          dietaryTags: itemData.dietaryTags || [],
          spiceLevel: itemData.spiceLevel || "mild",
          cookingTime: parseInt(itemData.cookingTime) || 15,
          portions: itemData.portions || [{ name: "Regular", price: parseFloat(itemData.price) || 0 }],
          isAvailable: itemData.isAvailable !== false,
          isPopular: itemData.isPopular === true,
          isFeatured: itemData.isFeatured === true,
        });

        await menuItem.save();
        await menuItem.populate("category", "name slug displayOrder");
        createdItems.push(menuItem);
      } catch (error) {
        errors.push({
          item: itemData.name,
          error: error.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully created ${createdItems.length} menu items`,
      data: createdItems,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error batch creating menu items:", error);
    res.status(500).json({
      success: false,
      message: "Failed to batch create menu items",
      error: error.message,
    });
  }
};
