import Category from '../../models/Category.js';
import catchAsync from '../../utils/catchAsync.js';

// Re-export menu functions for compatibility
export {
  getMenuItems as getAllFoodItems,
  getMenuItem as getFoodItem,
  createMenuItem as createFoodItem,
  updateMenuItem as updateFoodItem,
  deleteMenuItem as deleteFoodItem,
  getCategories
} from './menuController.js';

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

// AI Menu Generator - placeholder for now
export const generateAIMenu = catchAsync(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI menu generation is not implemented yet',
    data: []
  });
});