import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const staffMessagingAPI = {
  // Send message to manager
  sendMessageToManager: async (messageData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/staff/messaging/send-to-manager`,
        messageData,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get conversation with manager
  getConversation: async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/staff/messaging/conversation`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Mark messages as read
  markAsRead: async () => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/staff/messaging/mark-read`,
        {},
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get unread message count
  getUnreadCount: async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/staff/messaging/unread-count`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get available managers
  getManagers: async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/staff/messaging/managers`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default staffMessagingAPI;
