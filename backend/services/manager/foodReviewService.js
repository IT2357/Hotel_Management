import FoodOrder from '../../models/FoodOrder.js';

/**
 * Get all food reviews with filters
 * Aggregates reviews from FoodOrder.review field
 */
export const getAllFoodReviews = async (filters = {}) => {
  const { status, rating, search, sortBy = 'recent' } = filters;
  
  // Build query
  const query = { "review.rating": { $exists: true } };
  
  if (rating) {
    query["review.rating"] = parseInt(rating);
  }
  
  if (status === 'pending') {
    query["review.isVisible"] = false;
  } else if (status === 'published') {
    query["review.isVisible"] = true;
  }
  
  // Aggregate reviews from FoodOrder collection
  const reviews = await FoodOrder.aggregate([
    { $match: query },
    { 
      $lookup: { 
        from: 'users', 
        localField: 'userId', 
        foreignField: '_id', 
        as: 'user' 
      } 
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    { 
      $project: {
        _id: 1,
        customerName: {
          $ifNull: [
            '$customerDetails.name',
            { 
              $concat: [
                { $ifNull: ['$user.firstName', 'Guest'] },
                ' ',
                { $ifNull: ['$user.lastName', ''] }
              ]
            }
          ]
        },
        orderDetails: {
          $reduce: {
            input: '$items',
            initialValue: '',
            in: {
              $concat: [
                '$$value',
                { $cond: [{ $eq: ['$$value', ''] }, '', ', '] },
                '$$this.name'
              ]
            }
          }
        },
        orderType: 1,
        tableNumber: { $ifNull: ['$tableNumber', '-'] },
        orderDate: '$createdAt',
        rating: '$review.rating',
        title: { $literal: 'Food Order Review' },
        comment: '$review.comment',
        status: {
          $cond: [{ $eq: ['$review.isVisible', true] }, 'published', 'pending']
        },
        sentiment: {
          $switch: {
            branches: [
              { case: { $gte: ['$review.rating', 4] }, then: 'positive' },
              { case: { $lte: ['$review.rating', 2] }, then: 'negative' }
            ],
            default: 'neutral'
          }
        },
        helpful: { $ifNull: ['$review.helpful', 0] },
        response: {
          hasResponse: { $toBool: '$review.response' },
          message: { $ifNull: ['$review.responseMessage', ''] },
          respondedBy: { $ifNull: ['$review.respondedBy', ''] },
          respondedAt: { $ifNull: ['$review.respondedAt', null] }
        }
      }
    },
    { $sort: buildSort(sortBy) }
  ]);
  
  // Apply search filter if provided
  if (search) {
    const searchLower = search.toLowerCase();
    return reviews.filter(r => 
      r.customerName?.toLowerCase().includes(searchLower) ||
      r.orderDetails?.toLowerCase().includes(searchLower) ||
      r.comment?.toLowerCase().includes(searchLower)
    );
  }
  
  return reviews;
};

/**
 * Get food review statistics
 */
export const getFoodReviewStats = async () => {
  const stats = await FoodOrder.aggregate([
    { $match: { "review.rating": { $exists: true } } },
    { 
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        avgRating: { $avg: '$review.rating' },
        ratings: { $push: '$review.rating' }
      }
    }
  ]);
  
  if (!stats.length) {
    return { 
      totalReviews: 0, 
      avgRating: 0, 
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } 
    };
  }
  
  const { totalReviews, avgRating, ratings } = stats[0];
  
  // Calculate distribution
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  ratings.forEach(rating => {
    if (rating >= 1 && rating <= 5) {
      distribution[rating]++;
    }
  });
  
  return {
    totalReviews,
    avgRating: avgRating.toFixed(1),
    distribution
  };
};

/**
 * Helper function to build sort object
 */
function buildSort(sortBy) {
  switch (sortBy) {
    case 'recent':
      return { orderDate: -1 };
    case 'rating-high':
      return { rating: -1, orderDate: -1 };
    case 'rating-low':
      return { rating: 1, orderDate: -1 };
    default:
      return { orderDate: -1 };
  }
}

