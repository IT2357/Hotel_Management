import api from './api';

const managerFoodReviewAPI = {
  // Get all food reviews with filters
  getAllReviews: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.rating) params.append('rating', filters.rating);
      if (filters.search) params.append('search', filters.search);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);

      const response = await api.get(`/manager/food-reviews?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching food reviews:', error);
      throw error;
    }
  },

  // Get food review statistics
  getReviewStats: async () => {
    try {
      const response = await api.get('/manager/food-reviews/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching food review stats:', error);
      throw error;
    }
  },

  // Respond to food review
  respondToReview: async (reviewId, message) => {
    try {
      const response = await api.post(`/manager/food-reviews/${reviewId}/respond`, { message });
      return response.data;
    } catch (error) {
      console.error('Error responding to food review:', error);
      throw error;
    }
  },

  // Publish food review
  publishReview: async (reviewId) => {
    try {
      const response = await api.put(`/manager/food-reviews/${reviewId}/publish`);
      return response.data;
    } catch (error) {
      console.error('Error publishing food review:', error);
      throw error;
    }
  },

  // Archive food review
  archiveReview: async (reviewId) => {
    try {
      const response = await api.put(`/manager/food-reviews/${reviewId}/archive`);
      return response.data;
    } catch (error) {
      console.error('Error archiving food review:', error);
      throw error;
    }
  },

  // Mark food review as helpful
  markReviewHelpful: async (reviewId) => {
    try {
      const response = await api.post(`/manager/food-reviews/${reviewId}/helpful`);
      return response.data;
    } catch (error) {
      console.error('Error marking food review as helpful:', error);
      throw error;
    }
  }
};

export default managerFoodReviewAPI;

