// 📁 frontend/src/services/reviewService.js
import api from './api.js';

const reviewService = {
  // Get all reviews for current user
  getUserReviews: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams({
        page: filters.page || 1,
        limit: filters.limit || 20,
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });

      const response = await api.get(`/reviews/my-reviews?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      throw error;
    }
  },

  // Create a new review
  createReview: async (reviewData) => {
    try {
      const response = await api.post('/reviews/create', reviewData);
      return response.data;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  },

  // Update an existing review
  updateReview: async (reviewId, reviewData) => {
    try {
      const response = await api.put(`/reviews/${reviewId}`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  },

  // Delete a review
  deleteReview: async (reviewId) => {
    try {
      const response = await api.delete(`/reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  },

  // Get a specific review by ID
  getReviewById: async (reviewId) => {
    try {
      const response = await api.get(`/reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching review:', error);
      throw error;
    }
  },

  // Publish a draft review
  publishReview: async (reviewId) => {
    try {
      const response = await api.put(`/reviews/${reviewId}/publish`);
      return response.data;
    } catch (error) {
      console.error('Error publishing review:', error);
      throw error;
    }
  },

  // Mark a review as helpful
  markHelpful: async (reviewId) => {
    try {
      const response = await api.post(`/reviews/${reviewId}/helpful`);
      return response.data;
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      throw error;
    }
  },

  // Get review statistics for the user
  getUserReviewStats: async () => {
    try {
      const response = await api.get('/reviews/my-stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching review stats:', error);
      throw error;
    }
  },

  // Get all reviews for a specific booking
  getBookingReviews: async (bookingId) => {
    try {
      const response = await api.get(`/reviews/booking/${bookingId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching booking reviews:', error);
      throw error;
    }
  },

  // Get hotel reviews (public)
  // getHotelReviews: async (filters = {}) => {
  //   try {
  //     const queryParams = new URLSearchParams({
  //       page: filters.page || 1,
  //       limit: filters.limit || 20,
  //       ...(filters.rating && { rating: filters.rating }),
  //       ...(filters.sortBy && { sortBy: filters.sortBy })
  //     });

  //     const response = await api.get(`/reviews/hotel?${queryParams}`);
  //     return response.data;
  //   } catch (error) {
  //     console.error('Error fetching hotel reviews:', error);
  //     throw error;
  //   }
  // }
};

export { reviewService };