import FoodOrder from '../../models/FoodOrder.js';
import { getAllFoodReviews as getAllFoodReviewsService, getFoodReviewStats as getStatsService } from '../../services/manager/foodReviewService.js';
import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/appError.js';

// Get all food reviews with filters
export const getAllFoodReviews = catchAsync(async (req, res) => {
  const { status, rating, search, sortBy } = req.query;
  
  const reviews = await getAllFoodReviewsService({ 
    status, 
    rating, 
    search, 
    sortBy 
  });
  
  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// Get food review statistics
export const getFoodReviewStats = catchAsync(async (req, res) => {
  const stats = await getStatsService();
  
  res.status(200).json({
    success: true,
    data: stats
  });
});

// Respond to food review
export const respondToFoodReview = catchAsync(async (req, res) => {
  const { reviewId } = req.params;
  const { message } = req.body;
  
  if (!message || !message.trim()) {
    throw new AppError('Response message is required', 400);
  }
  
  const order = await FoodOrder.findById(reviewId);
  
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  
  if (!order.review || !order.review.rating) {
    throw new AppError('No review found for this order', 404);
  }
  
  order.review.response = true;
  order.review.responseMessage = message.trim();
  order.review.respondedBy = req.user.fullName || req.user.name || 'Manager';
  order.review.respondedAt = new Date();
  
  await order.save();
  
  // Return formatted response
  const formattedReview = {
    _id: order._id,
    rating: order.review.rating,
    comment: order.review.comment,
    status: order.review.isVisible ? 'published' : 'pending',
    response: {
      hasResponse: true,
      message: order.review.responseMessage,
      respondedBy: order.review.respondedBy,
      respondedAt: order.review.respondedAt
    }
  };
  
  res.status(200).json({ 
    success: true, 
    data: formattedReview,
    message: 'Response added successfully'
  });
});

// Publish food review
export const publishFoodReview = catchAsync(async (req, res) => {
  const { reviewId } = req.params;
  
  const order = await FoodOrder.findById(reviewId);
  
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  
  if (!order.review || !order.review.rating) {
    throw new AppError('No review found for this order', 404);
  }
  
  order.review.isVisible = true;
  await order.save();
  
  res.status(200).json({ 
    success: true, 
    data: order,
    message: 'Review published successfully'
  });
});

// Archive food review
export const archiveFoodReview = catchAsync(async (req, res) => {
  const { reviewId } = req.params;
  
  const order = await FoodOrder.findById(reviewId);
  
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  
  if (!order.review || !order.review.rating) {
    throw new AppError('No review found for this order', 404);
  }
  
  order.review.isVisible = false;
  await order.save();
  
  res.status(200).json({ 
    success: true, 
    data: order,
    message: 'Review archived successfully'
  });
});

// Mark food review as helpful
export const markFoodReviewHelpful = catchAsync(async (req, res) => {
  const { reviewId } = req.params;
  
  const order = await FoodOrder.findById(reviewId);
  
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  
  if (!order.review || !order.review.rating) {
    throw new AppError('No review found for this order', 404);
  }
  
  order.review.helpful = (order.review.helpful || 0) + 1;
  await order.save();
  
  res.status(200).json({ 
    success: true, 
    data: order,
    message: 'Marked as helpful'
  });
});

