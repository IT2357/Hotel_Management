// services/feedback/feedbackStatsService.js
import Feedback from '../../models/Feedback.js';

/**
 * Get comprehensive feedback statistics
 * @returns {Object} Feedback statistics including total, average rating, and distribution
 */
export const getFeedbackStatistics = async () => {
  const [totalFeedback, averageRatingResult, ratingDistribution] = await Promise.all([
    Feedback.countDocuments(),
    Feedback.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]),
    Feedback.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])
  ]);

  return {
    totalFeedback,
    averageRating: averageRatingResult[0]?.avgRating || 0,
    ratingDistribution
  };
};

/**
 * Get count of unread feedback
 * @returns {Number} Count of unread feedback
 */
export const getUnreadFeedbackCount = async () => {
  return await Feedback.countDocuments({ isRead: false });
};
