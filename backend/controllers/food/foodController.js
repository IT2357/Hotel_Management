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
  const responseItem = menuItem.toObject();
  if (responseItem.image && responseItem.image.data) {
    responseItem.imageUrl = `data:${responseItem.image.contentType};base64,${responseItem.image.data.toString('base64')}`;
  }

  res.status(200).json({
    success: true,
    data: responseItem
  });
});

// Create new food item
export const createFoodItem = catchAsync(async (req, res) => {
  const menuItem = await MenuItem.create(req.body);

  res.status(201).json({
    success: true,
    data: menuItem,
    message: 'Menu item created successfully'
  });
});

// Update food item
export const updateFoodItem = catchAsync(async (req, res) => {
  // Validate required fields
  const { name, category, price } = req.body;
  
  if (!name || !category || price === undefined) {
    throw new AppError('Name, category, and price are required fields', 400);
  }

  // Validate price
  if (isNaN(price) || price < 0) {
    throw new AppError('Price must be a positive number', 400);
  }

  const updateData = {
    ...req.body,
    price: Number(price),
    cookingTime: req.body.cookingTime ? Number(req.body.cookingTime) : 15,
    isAvailable: Boolean(req.body.isAvailable)
  };

  const menuItem = await MenuItem.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!menuItem) {
    throw new AppError('Menu item not found', 404);
  }

  res.status(200).json({
    success: true,
    data: menuItem,
    message: 'Menu item updated successfully'
  });
});

// Delete food item
export const deleteFoodItem = catchAsync(async (req, res) => {
  const menuItem = await MenuItem.findByIdAndDelete(req.params.id);

  if (!menuItem) {
    throw new AppError('Menu item not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Menu item deleted successfully'
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