import MenuItem from '../../models/MenuItem.js';
import Category from '../../models/Category.js';
import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/appError.js';
import mongoose from 'mongoose';

// Get all food items (Admin view)
export const getAllFoodItems = catchAsync(async (req, res) => {
  const { category, isAvailable, search } = req.query;

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
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const menuItems = await MenuItem.find(filter)
    .sort({ createdAt: -1 });

  // Add imageUrl to each menu item for frontend display
  const menuItemsWithImages = menuItems.map(item => {
    const itemObj = item.toObject();
    if (itemObj.imageId) {
      itemObj.imageUrl = `/api/menu/image/${itemObj.imageId}`;
    } else if (itemObj.image) {
      itemObj.imageUrl = itemObj.image;
    }
    return itemObj;
  });

  res.status(200).json({
    success: true,
    data: menuItemsWithImages,
    count: menuItems.length
  });
});

// Get single food item
export const getFoodItem = catchAsync(async (req, res) => {
  const menuItem = await MenuItem.findById(req.params.id);

  if (!menuItem) {
    throw new AppError('Menu item not found', 404);
  }

  // Add imageUrl for frontend display
  const responseItem = menuItem.toObject();
  if (responseItem.imageId) {
    responseItem.imageUrl = `/api/menu/image/${responseItem.imageId}`;
  } else if (responseItem.image) {
    responseItem.imageUrl = responseItem.image;
  }

  res.status(200).json({
    success: true,
    data: responseItem
  });
});

// Create new menu item (Admin/Manager only)
export const createFoodItem = catchAsync(async (req, res) => {
  const menuItem = await MenuItem.create(req.body);

  res.status(201).json({
    success: true,
    data: menuItem,
    message: 'Menu item created successfully'
  });
});

// Update menu item (Admin/Manager only)
export const updateFoodItem = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid menu item ID', 400);
  }

  const menuItem = await MenuItem.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true
  }).populate('category', 'name slug');

  if (!menuItem) {
    throw new AppError('Menu item not found', 404);
  }

  res.status(200).json({
    success: true,
    data: menuItem,
    message: 'Menu item updated successfully'
  });
});

// Delete menu item (Admin/Manager only)
export const deleteFoodItem = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid menu item ID', 400);
  }

  const menuItem = await MenuItem.findByIdAndDelete(id);

  if (!menuItem) {
    throw new AppError('Menu item not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Menu item deleted successfully'
  });
});

// Get all categories (public)
export const getAllCategories = catchAsync(async (req, res) => {
  const categories = await Category.find()
    .sort({ displayOrder: 1, name: 1 })
    .lean();

  res.status(200).json({
    success: true,
    data: categories
  });
});

// Get single category (public)
export const getCategory = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid category ID', 400);
  }

  const category = await Category.findById(id).lean();

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  // Get item count for this category
  const itemCount = await MenuItem.countDocuments({
    category: id,
    isAvailable: true
  });

  res.status(200).json({
    success: true,
    data: { ...category, itemCount }
  });
});

// Create category (Admin/Manager only)
export const createCategory = catchAsync(async (req, res) => {
  const category = await Category.create(req.body);

  res.status(201).json({
    success: true,
    data: category,
    message: 'Category created successfully'
  });
});

// Update category (Admin/Manager only)
export const updateCategory = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid category ID', 400);
  }

  const category = await Category.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true
  });

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  res.status(200).json({
    success: true,
    data: category,
    message: 'Category updated successfully'
  });
});

// Delete category (Admin/Manager only)
export const deleteCategory = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid category ID', 400);
  }

  // Check if there are menu items using this category
  const itemsWithCategory = await MenuItem.countDocuments({ category: id });
  if (itemsWithCategory > 0) {
    throw new AppError(`Cannot delete category. ${itemsWithCategory} menu items are using this category.`, 400);
  }

  const category = await Category.findByIdAndDelete(id);

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Category deleted successfully'
  });
});

// AI Menu Generator (Vision AI v2 powered)
import visionMenuServiceV2 from '../../services/ai/visionMenuService_v2.js';

export const generateAIMenu = catchAsync(async (req, res) => {
  // Accepts: imageBuffer (base64 or binary), imageUrl, or ocrText
  // Optionally: cuisine, dietaryRestrictions, mealType, budget
  let imageBuffer, mimeType, ocrText;
  if (req.body.imageBuffer) {
    // If sent as base64 string
    if (typeof req.body.imageBuffer === 'string') {
      imageBuffer = Buffer.from(req.body.imageBuffer, req.body.encoding || 'base64');
    } else {
      imageBuffer = req.body.imageBuffer;
    }
    mimeType = req.body.mimeType || 'image/jpeg';
  } else if (req.body.imageUrl) {
    // Download image from URL
    const axios = (await import('axios')).default;
    const response = await axios.get(req.body.imageUrl, { responseType: 'arraybuffer' });
    imageBuffer = Buffer.from(response.data);
    mimeType = response.headers['content-type'] || 'image/jpeg';
  }
  if (req.body.ocrText) {
    ocrText = req.body.ocrText;
  }

  // Call Vision AI v2 service
  let v2Items = [];
  try {
    v2Items = await visionMenuServiceV2.analyze({ imageBuffer, mimeType, ocrText });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: 'Vision AI v2 extraction failed',
      error: e.message || e
    });
  }

  // Map v2 output to MenuItem schema
  const menuItems = (v2Items || []).map((it, idx) => ({
    name: it.name_english || it.name || it.name_tamil || `Food Item ${idx+1}`,
    name_tamil: it.name_tamil || '',
    name_english: it.name_english || '',
    description: it.description_english || it.description || '',
    description_english: it.description_english || '',
    description_tamil: it.description_tamil || '',
    price: Number(it.price) || 0,
    currency: 'LKR',
    category: req.body.category || null, // Assign category if provided
    image: it.image || '',
    ingredients: it.ingredients || [],
    dietaryTags: it.dietaryTags || [],
    isVeg: it.isVeg || false,
    isSpicy: it.isSpicy || false,
    isAvailable: true
  }));

  res.status(200).json({
    success: true,
    data: menuItems,
    message: 'AI menu suggestions generated successfully'
  });
});