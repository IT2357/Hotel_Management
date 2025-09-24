import api from './api';

export const staffAPI = {
  // Get staff dashboard data
  getDashboardData: async () => {
    try {
      const response = await api.get('/staff/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching staff dashboard data:', error);
      throw error;
    }
  },

  // Get staff bookings
  getMyBookings: async () => {
    try {
      const response = await api.get('/staff/bookings');
      return response.data;
    } catch (error) {
      console.error('Error fetching staff bookings:', error);
      throw error;
    }
  },

  // Get room status
  getRoomStatus: async () => {
    try {
      const response = await api.get('/staff/rooms/status');
      return response.data;
    } catch (error) {
      console.error('Error fetching room status:', error);
      throw error;
    }
  },

  // Get support requests
  getSupportRequests: async () => {
    try {
      const response = await api.get('/staff/support-requests');
      return response.data;
    } catch (error) {
      console.error('Error fetching support requests:', error);
      throw error;
    }
  },

  // Get assigned tasks for staff
  getMyTasks: async () => {
    try {
      const response = await api.get('/staff/tasks');
      return response.data;
    } catch (error) {
      console.error('Error fetching staff tasks:', error);
      throw error;
    }
  }
};

export default staffAPI;