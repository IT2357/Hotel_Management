/**
 * Utility functions for feedback management
 */

/**
 * Format date to readable string
 * @param {string|Date} value - Date value to format
 * @returns {string} Formatted date string
 */
export const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

/**
 * Get status badge configuration
 * @param {string} status - Feedback status
 * @returns {Object} Badge variant and label
 */
export const getStatusBadge = (status) => {
  switch (status) {
    case "published":
      return { variant: "success", label: "Published" };
    case "pending":
      return { variant: "warning", label: "Pending response" };
    default:
      return { variant: "secondary", label: status };
  }
};

/**
 * Get sentiment configuration
 * @param {string} sentiment - Sentiment type (positive/neutral/negative)
 * @returns {Object} Sentiment icon, color, and label
 */
export const getSentimentConfig = (sentiment) => {
  const config = {
    positive: { icon: '😊', color: 'green', label: 'Positive' },
    neutral: { icon: '😐', color: 'yellow', label: 'Neutral' },
    negative: { icon: '😢', color: 'red', label: 'Negative' },
  };
  return config[sentiment] || config.neutral;
};

/**
 * Get color scheme based on rating
 * @param {number} rating - Rating value (1-5)
 * @returns {Object} Color scheme for UI elements
 */
export const getRatingColorScheme = (rating) => {
  if (rating >= 4) {
    return {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      bar: 'from-emerald-400 to-green-500',
      text: 'text-emerald-700'
    };
  } else if (rating === 3) {
    return {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      bar: 'from-amber-400 to-orange-500',
      text: 'text-amber-700'
    };
  } else {
    return {
      bg: 'bg-red-50',
      border: 'border-red-200',
      bar: 'from-red-400 to-rose-500',
      text: 'text-red-700'
    };
  }
};

/**
 * Calculate sentiment statistics from feedback array
 * @param {Array} feedback - Array of feedback objects
 * @returns {Object} Sentiment statistics with counts and percentages
 */
export const calculateSentimentStats = (feedback) => {
  const stats = { positive: 0, neutral: 0, negative: 0 };
  feedback.forEach(entry => {
    if (entry.sentiment) stats[entry.sentiment]++;
  });
  const total = feedback.length || 1;
  return {
    positive: { count: stats.positive, percent: ((stats.positive / total) * 100).toFixed(0) },
    neutral: { count: stats.neutral, percent: ((stats.neutral / total) * 100).toFixed(0) },
    negative: { count: stats.negative, percent: ((stats.negative / total) * 100).toFixed(0) },
  };
};

/**
 * Calculate rating distribution from feedback array
 * @param {Array} feedback - Array of feedback objects
 * @returns {Object} Rating distribution (1-5 stars)
 */
export const calculateRatingDistribution = (feedback) => {
  const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  feedback.forEach(entry => {
    if (entry.rating >= 1 && entry.rating <= 5) {
      dist[entry.rating]++;
    }
  });
  return dist;
};

/**
 * Calculate average rating from feedback array
 * @param {Array} feedback - Array of feedback objects
 * @returns {string} Average rating formatted to 1 decimal place
 */
export const calculateAverageRating = (feedback) => {
  if (!feedback.length) return '0.0';
  const total = feedback.reduce((sum, entry) => sum + entry.rating, 0);
  return (total / feedback.length).toFixed(1);
};
