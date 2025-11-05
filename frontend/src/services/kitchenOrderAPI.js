import api from './api';

const kitchenOrderAPI = {
  // Get orders assigned to kitchen staff
  getOrders: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      const response = await api.get(`/kitchen/orders?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching kitchen orders:', error);
      throw error;
    }
  },

  // Update order status
  updateStatus: async (orderId, status, notes = '') => {
    try {
      const response = await api.put(`/kitchen/orders/${orderId}/status`, {
        status,
        kitchenStatus: status,
        notes
      });
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  // Confirm delivery (triggers review)
  confirmDelivery: async (orderId) => {
    try {
      const response = await api.post(`/kitchen/orders/${orderId}/deliver`);
      return response.data;
    } catch (error) {
      console.error('Error confirming delivery:', error);
      throw error;
    }
  },

  // Get kitchen stats
  getStats: async () => {
    try {
      const response = await api.get('/kitchen/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching kitchen stats:', error);
      throw error;
    }
  }
};

export default kitchenOrderAPI;

