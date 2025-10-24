// 📁 frontend/src/services/bookingService.js
import api from './api.js';

const bookingService = {
  // Get all bookings for admin with filtering
  getAllBookings: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams({
        page: filters.page || 1,
        limit: filters.limit || 20,
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo })
      });

      const response = await api.get(`/bookings/admin/all?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all bookings:', error);
      throw error;
    }
  },

  // Get booking statistics for admin
  getBookingStats: async (period = '30') => {
    try {
      const response = await api.get(`/bookings/admin/stats?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching booking stats:', error);
      throw error;
    }
  },

  // Update booking status (approve/reject/hold)
  updateBookingStatus: async (bookingId, status, data = {}) => {
    try {
      let endpoint = '';
      let method = 'PUT';

      switch (status) {
        case 'Approve':
          endpoint = `/bookings/admin/${bookingId}/approve`;
          break;
        case 'Rejected':
          endpoint = `/bookings/admin/${bookingId}/reject`;
          break;
        case 'On Hold':
          endpoint = `/bookings/admin/${bookingId}/hold`;
          break;
        default:
          throw new Error('Invalid status');
      }

      const response = await api.put(endpoint, data);
      return response.data;
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  },

  // Get user's bookings
  getUserBookings: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams({
        page: filters.page || 1,
        limit: filters.limit || 10,
        ...(filters.status && { status: filters.status })
      });

      const response = await api.get(`/bookings/my-bookings?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      const serverMsg = error?.response?.data?.message;
      const msg = serverMsg || error.message || 'Failed to fetch user bookings';
      throw new Error(msg);
    }
  },

  // Create new booking
  createBooking: async (bookingData) => {
    try {
      const response = await api.post('/bookings', bookingData);
      return response.data;
    } catch (error) {
      console.error('Error creating booking:', error);
      const serverMsg = error?.response?.data?.message;
      const msg = serverMsg || error.message || 'Failed to create booking';
      throw new Error(msg);
    }
  },

  // Cancel booking
  cancelBooking: async (bookingId, reason = '') => {
    try {
      const response = await api.put(`/bookings/${bookingId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  },

  // Get booking details
  getBookingDetails: async (bookingId) => {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching booking details:', error);
      throw error;
    }
  },

  // Get booking statistics for user
  getUserBookingStats: async () => {
    try {
      const response = await api.get('/bookings/user/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching user booking stats:', error);
      throw error;
    }
  },

  // Get bookings that are pending review (completed bookings without reviews)
  getPendingReviewBookings: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams({
        page: filters.page || 1,
        limit: filters.limit || 10
      });

      const response = await api.get(`/bookings/for-review?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching pending review bookings:', error);
      throw error;
    }
  }
};

export default bookingService;