// 📁 frontend/src/services/roomService.js
import api from './api.js';

const roomService = {
  getAllRooms: (params) => api.get("/rooms/", { params }),
  getRoomById: (id) => api.get(`/rooms/${id}`),

  // Get available rooms for specific dates
  getAvailableRooms: async (checkIn, checkOut, filters = {}) => {
    try {
      const queryParams = new URLSearchParams({
        checkIn,
        checkOut,
        ...(filters.type && { type: filters.type }),
        ...(filters.minCapacity && { minCapacity: filters.minCapacity }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        ...(filters.guests && { guests: filters.guests })
      });

      const response = await api.get(`/rooms/available?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching available rooms:', error);
      throw error;
    }
  },

  // Check specific room availability
  checkRoomAvailability: async (roomId, checkIn, checkOut) => {
    try {
      const queryParams = new URLSearchParams({ checkIn, checkOut });
      const response = await api.get(`/rooms/${roomId}/availability?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error checking room availability:', error);
      throw error;
    }
  },

  // Get room details with availability
  getRoomDetails: async (roomId, checkIn, checkOut) => {
    try {
      const queryParams = new URLSearchParams({
        ...(checkIn && { checkIn }),
        ...(checkOut && { checkOut })
      });

      const response = await api.get(`/rooms/${roomId}/details?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching room details:', error);
      throw error;
    }
  },

  // Get room statistics for admin
  getRoomStats: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams({
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(filters.roomType && { roomType: filters.roomType })
      });

      const response = await api.get(`/rooms/admin/stats?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching room statistics:', error);
      throw error;
    }
  },

  // Update room status (for admin)
  updateRoomStatus: async (roomId, status, reason) => {
    try {
      const response = await api.put(`/rooms/admin/${roomId}/status`, {
        status,
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error updating room status:', error);
      throw error;
    }
  },

  // Get existing bookings for a specific room (for calendar display)
  getRoomBookings: async (roomId) => {
    try {
      const response = await api.get(`/bookings/room/${roomId}/dates`);
      return response.data;
    } catch (error) {
      console.error('Error fetching room bookings:', error);
      throw error;
    }
  }
};

export default roomService;