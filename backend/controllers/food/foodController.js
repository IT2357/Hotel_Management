import MenuItem from '../../models/MenuItem.js';
import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/appError.js';

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
});

// Get single food item
export const getFoodItem = catchAsync(async (req, res) => {
  const menuItem = await MenuItem.findById(req.params.id);

  if (!menuItem) {
    throw new AppError('Menu item not found', 404);
  }

  // Add imageUrl for frontend display
  const responseItem = item;
  if (responseItem.image && responseItem.image.data) {
    responseItem.imageUrl = `data:${responseItem.image.contentType};base64,${responseItem.image.data.toString('base64')}`;
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

// AI Menu Generator (Mock implementation)
export const generateAIMenu = catchAsync(async (req, res) => {
  const { cuisine, dietaryRestrictions, mealType, budget } = req.body;

  // Mock AI-generated menu items
  const aiGeneratedItems = [
    {
      name: `${cuisine} ${mealType} Special`,
      description: `AI-generated ${cuisine} dish perfect for ${mealType}`,
      category: mealType,
      price: budget ? Math.floor(budget * 0.8) : 25,
      ingredients: ['AI-generated ingredients'],
      allergens: [],
      dietaryTags: dietaryRestrictions || [],
      isAvailable: true
    },
    {
      name: `${cuisine} Signature Dish`,
      description: `Chef's special ${cuisine} creation`,
      category: mealType,
      price: budget ? Math.floor(budget * 1.2) : 35,
      ingredients: ['Premium ingredients'],
      allergens: [],
      dietaryTags: dietaryRestrictions || [],
      isAvailable: true
    }
  ];

  res.status(200).json({
    success: true,
    data: aiGeneratedItems,
    message: 'AI menu suggestions generated successfully'
  });
});