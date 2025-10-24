/**
 * Helper functions for building feedback queries
 */

/**
 * Build filter query for feedback
 * @param {Object} params - Query parameters
 * @returns {Object} MongoDB query object
 */
export const buildFeedbackQuery = ({ status, rating, search }) => {
  const query = {};

  if (status && status !== 'all') {
    query.status = status;
  }

  if (rating) {
    query.rating = parseInt(rating);
  }

  if (search) {
    query.$or = [
      { guestName: { $regex: search, $options: 'i' } },
      { roomTitle: { $regex: search, $options: 'i' } },
      { roomNumber: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
      { comment: { $regex: search, $options: 'i' } },
    ];
  }

  return query;
};

/**
 * Build sort query for feedback
 * @param {string} sortBy - Sort option
 * @returns {Object} MongoDB sort object
 */
export const buildFeedbackSort = (sortBy = 'recent') => {
  const sortOptions = {
    'recent': { stayDate: -1 },
    'rating-high': { rating: -1 },
    'rating-low': { rating: 1 },
  };

  return sortOptions[sortBy] || { createdAt: -1 };
};
