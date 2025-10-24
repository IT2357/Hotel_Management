import GuestFeedback from '../../models/GuestFeedback.js';

/**
 * Service for calculating feedback statistics and analytics
 */

/**
 * Get basic feedback counts
 * @returns {Object} Count statistics
 */
const getBasicCounts = async () => {
  const [totalFeedback, pendingCount, publishedCount, respondedCount] = await Promise.all([
    GuestFeedback.countDocuments(),
    GuestFeedback.countDocuments({ status: 'pending' }),
    GuestFeedback.countDocuments({ status: 'published' }),
    GuestFeedback.countDocuments({ 'response.hasResponse': true }),
  ]);

  return {
    totalFeedback,
    pendingCount,
    publishedCount,
    respondedCount,
  };
};

/**
 * Calculate average rating
 * @returns {number} Average rating
 */
const calculateAverageRating = async () => {
  const avgRatingResult = await GuestFeedback.aggregate([
    { $group: { _id: null, avgRating: { $avg: '$rating' } } },
  ]);
  
  return avgRatingResult[0]?.avgRating || 0;
};

/**
 * Get rating distribution
 * @returns {Object} Rating distribution (1-5 stars)
 */
const getRatingDistribution = async () => {
  const ratingDist = await GuestFeedback.aggregate([
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
  ]);

  const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  ratingDist.forEach(item => {
    ratingDistribution[item._id] = item.count;
  });

  return ratingDistribution;
};

/**
 * Get sentiment distribution
 * @returns {Object} Sentiment statistics
 */
const getSentimentDistribution = async () => {
  const sentimentDist = await GuestFeedback.aggregate([
    { $group: { _id: '$sentiment', count: { $sum: 1 } } },
  ]);

  const sentimentStats = { positive: 0, neutral: 0, negative: 0 };
  sentimentDist.forEach(item => {
    sentimentStats[item._id] = item.count;
  });

  return sentimentStats;
};

/**
 * Calculate rating trend (compare this month to last month)
 * @returns {number} Percentage change in rating
 */
const calculateRatingTrend = async () => {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  
  const [thisMonthAvg, lastMonthAvg] = await Promise.all([
    GuestFeedback.aggregate([
      { $match: { createdAt: { $gte: startOfThisMonth } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } },
    ]),
    GuestFeedback.aggregate([
      { 
        $match: { 
          createdAt: { 
            $gte: startOfLastMonth, 
            $lt: startOfThisMonth 
          } 
        } 
      },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } },
    ]),
  ]);

  const thisMonthRating = thisMonthAvg[0]?.avgRating || 0;
  const lastMonthRating = lastMonthAvg[0]?.avgRating || 0;
  
  let trend = 0;
  if (lastMonthRating > 0) {
    trend = ((thisMonthRating - lastMonthRating) / lastMonthRating) * 100;
  }

  return trend;
};

/**
 * Get all feedback statistics
 * @returns {Object} Complete statistics data
 */
export const getAllFeedbackStats = async () => {
  try {
    const [
      basicCounts,
      averageRating,
      ratingDistribution,
      sentimentStats,
      trend,
    ] = await Promise.all([
      getBasicCounts(),
      calculateAverageRating(),
      getRatingDistribution(),
      getSentimentDistribution(),
      calculateRatingTrend(),
    ]);

    return {
      ...basicCounts,
      averageRating: parseFloat(averageRating.toFixed(1)),
      ratingDistribution,
      sentimentStats,
      trend: parseFloat(trend.toFixed(1)),
    };
  } catch (error) {
    console.error('Error calculating feedback stats:', error);
    throw error;
  }
};
