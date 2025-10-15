import Food from '../../models/Food.js';
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

  const foodItems = await Food.find(filter)
    .sort({ createdAt: -1 });

  // Convert to plain objects for response
  const foodItemsWithImages = foodItems.map(item => item.toObject());

  res.status(200).json({
    success: true,
    data: foodItemsWithImages,
    count: foodItems.length
  });
});

// Get single food item
export const getFoodItem = catchAsync(async (req, res) => {
  const foodItem = await Food.findById(req.params.id);

  if (!foodItem) {
    throw new AppError('Food item not found', 404);
  }

  // Convert to plain object for response
  const responseItem = foodItem.toObject();

  res.status(200).json({
    success: true,
    data: responseItem
  });
});

// Create new food item (Admin/Manager only)
export const createFoodItem = catchAsync(async (req, res) => {
  const foodItem = await Food.create(req.body);

  res.status(201).json({
    success: true,
    data: foodItem,
    message: 'Food item created successfully'
  });
});

// Update food item (Admin/Manager only)
export const updateFoodItem = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid food item ID', 400);
  }

  const foodItem = await Food.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true
  });

  if (!foodItem) {
    throw new AppError('Food item not found', 404);
  }

  res.status(200).json({
    success: true,
    data: foodItem,
    message: 'Food item updated successfully'
  });
});

// Delete food item (Admin/Manager only)
export const deleteFoodItem = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid food item ID', 400);
  }

  const foodItem = await Food.findByIdAndDelete(id);

  if (!foodItem) {
    throw new AppError('Food item not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Food item deleted successfully'
  });
});

// Get food categories
export const getFoodCategories = catchAsync(async (req, res) => {
  const categories = await Food.distinct('category');

  res.status(200).json({
    success: true,
    data: categories
  });
});

// AI Menu Generator using AI service
export const generateAIMenu = catchAsync(async (req, res) => {
  const { cuisine, dietaryRestrictions, mealType, budget, count } = req.body;

  // Import AI service dynamically
  const { default: AIMenuExtractor } = await import('../../services/aiMenuExtractor.js');
  const aiService = new AIMenuExtractor();

  const suggestions = await aiService.generateMenuSuggestions({
    cuisine,
    dietaryRestrictions,
    mealType,
    budget,
    count
  });

  res.status(200).json({
    success: true,
    data: suggestions.items,
    metadata: suggestions.metadata,
    message: 'AI menu suggestions generated successfully'
  });
});

// Get food items by category (Guest view)
export const getFoodItemsByCategory = catchAsync(async (req, res) => {
  const { category } = req.params;
  
  const filter = {
    isAvailable: true
  };

  if (category && category !== 'all') {
    filter.category = category;
  }

  const foodItems = await Food.find(filter)
    .sort({ name: 1 });

  res.status(200).json({
    success: true,
    data: foodItems,
    count: foodItems.length
  });
});

// Toggle food item availability
export const toggleFoodAvailability = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid food item ID', 400);
  }

  const foodItem = await Food.findById(id);

  if (!foodItem) {
    throw new AppError('Food item not found', 404);
  }

  foodItem.isAvailable = !foodItem.isAvailable;
  await foodItem.save();

  res.status(200).json({
    success: true,
    data: foodItem,
    message: `Food item ${foodItem.isAvailable ? 'enabled' : 'disabled'} successfully`
  });
});