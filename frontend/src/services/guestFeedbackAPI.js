import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Get all feedback with filters
export const getAllFeedback = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.rating) params.append('rating', filters.rating);
    if (filters.search) params.append('search', filters.search);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);

    const response = await api.get(`/manager/feedback?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching feedback:', error);
    throw error;
  }
};

// Get feedback statistics
export const getFeedbackStats = async () => {
  try {
    const response = await api.get('/manager/feedback/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    throw error;
  }
};

// Respond to feedback
export const respondToFeedback = async (feedbackId, message) => {
  try {
    const response = await api.post(`/manager/feedback/${feedbackId}/respond`, {
      message,
    });
    return response.data;
  } catch (error) {
    console.error('Error responding to feedback:', error);
    throw error;
  }
};

// Mark feedback as helpful
export const markFeedbackHelpful = async (feedbackId) => {
  try {
    const response = await api.post(`/manager/feedback/${feedbackId}/helpful`);
    return response.data;
  } catch (error) {
    console.error('Error marking feedback as helpful:', error);
    throw error;
  }
};

// Publish feedback
export const publishFeedback = async (feedbackId) => {
  try {
    const response = await api.put(`/manager/feedback/${feedbackId}/publish`);
    return response.data;
  } catch (error) {
    console.error('Error publishing feedback:', error);
    throw error;
  }
};

// Archive feedback
export const archiveFeedback = async (feedbackId) => {
  try {
    const response = await api.put(`/manager/feedback/${feedbackId}/archive`);
    return response.data;
  } catch (error) {
    console.error('Error archiving feedback:', error);
    throw error;
  }
};

export default {
  getAllFeedback,
  getFeedbackStats,
  respondToFeedback,
  markFeedbackHelpful,
  publishFeedback,
  archiveFeedback,
};
