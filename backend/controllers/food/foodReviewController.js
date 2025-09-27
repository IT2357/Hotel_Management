import FoodOrder from '../../models/FoodOrder.js';
import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/appError.js';

// Submit or update a review for a food order
export const submitOrderReview = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.id;

  // Validate input
  if (!rating || rating < 1 || rating > 5) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }

  // Find the order
  const order = await FoodOrder.findById(orderId);
  if (!order) {
    throw new AppError('Food order not found', 404);
  }

  // Check if user owns this order
  if (order.userId?.toString() !== userId) {
    throw new AppError('You can only review your own orders', 403);
  }

  // Check if order is delivered
  if (order.status !== 'Delivered') {
    throw new AppError('You can only review delivered orders', 400);
  }

  // Update or create review
  order.review = {
    rating,
    comment: comment || '',
    submittedAt: new Date(),
    isVisible: true,
    flagged: false,
  };

  await order.save();

  res.status(200).json({
    success: true,
    data: order.review,
    message: 'Review submitted successfully'
  });
});

// Get review for a specific order
export const getOrderReview = catchAsync(async (req, res) => {
  const { orderId } = req.params;

  const order = await FoodOrder.findById(orderId)
    .select('review status userId')
    .populate('userId', 'name email');

  if (!order) {
    throw new AppError('Food order not found', 404);
  }

  // Check if user can view this review
  if (req.user.role !== 'admin' && req.user.role !== 'manager' &&
      order.userId?.toString() !== req.user.id) {
    throw new AppError('You can only view your own order reviews', 403);
  }

  res.status(200).json({
    success: true,
    data: order.review || null
  });
});

// Get all reviews (Admin/Manager only)
export const getAllReviews = catchAsync(async (req, res) => {
  const { status, flagged, page = 1, limit = 10 } = req.query;

  let filter = { 'review.rating': { $exists: true } };

  if (status === 'visible') {
    filter['review.isVisible'] = true;
  } else if (status === 'hidden') {
    filter['review.isVisible'] = false;
  }

  if (flagged === 'true') {
    filter['review.flagged'] = true;
  } else if (flagged === 'false') {
    filter['review.flagged'] = false;
  }

  const skip = (page - 1) * limit;

  const orders = await FoodOrder.find(filter)
    .select('review status customerDetails items totalPrice createdAt')
    .populate('userId', 'name email')
    .sort({ 'review.submittedAt': -1 })
    .skip(skip)
    .limit(limit);

  const total = await FoodOrder.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: orders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Update review moderation status (Admin/Manager only)
export const moderateReview = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const { isVisible, flagged } = req.body;

  const order = await FoodOrder.findById(orderId);
  if (!order || !order.review) {
    throw new AppError('Review not found', 404);
  }

  if (isVisible !== undefined) {
    order.review.isVisible = isVisible;
  }

  if (flagged !== undefined) {
    order.review.flagged = flagged;
  }

  await order.save();

  res.status(200).json({
    success: true,
    data: order.review,
    message: 'Review moderation updated successfully'
  });
});

// Delete a review
export const deleteReview = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;

  const order = await FoodOrder.findById(orderId);
  if (!order || !order.review) {
    throw new AppError('Review not found', 404);
  }

  // Check permissions
  const isOwner = order.userId?.toString() === userId;
  const isAdmin = ['admin', 'manager'].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    throw new AppError('You can only delete your own reviews', 403);
  }

  // Remove review
  order.review = undefined;
  await order.save();

  res.status(200).json({
    success: true,
    message: 'Review deleted successfully'
  });
});

// Get review statistics (Admin/Manager only)
export const getReviewStats = catchAsync(async (req, res) => {
  const stats = await FoodOrder.aggregate([
    {
      $match: {
        'review.rating': { $exists: true }
      }
    },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$review.rating' },
        ratingDistribution: {
          $push: '$review.rating'
        },
        visibleReviews: {
          $sum: { $cond: ['$review.isVisible', 1, 0] }
        },
        flaggedReviews: {
          $sum: { $cond: ['$review.flagged', 1, 0] }
        }
      }
    }
  ]);

  // Calculate rating distribution
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (stats.length > 0) {
    stats[0].ratingDistribution.forEach(rating => {
      ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
    });
  }

  const result = stats.length > 0 ? {
    totalReviews: stats[0].totalReviews,
    averageRating: Math.round(stats[0].averageRating * 10) / 10,
    visibleReviews: stats[0].visibleReviews,
    flaggedReviews: stats[0].flaggedReviews,
    ratingDistribution: ratingCounts
  } : {
    totalReviews: 0,
    averageRating: 0,
    visibleReviews: 0,
    flaggedReviews: 0,
    ratingDistribution: ratingCounts
  };

  res.status(200).json({
    success: true,
    data: result
  });
});