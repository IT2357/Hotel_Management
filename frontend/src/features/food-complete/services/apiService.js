/**
 * 🔌 Enhanced Food API Service (2025)
 * Connects to /api/food-complete/* endpoints
 * Supports: Bilingual menus, AI extraction, reviews
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance with base config
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Menu API (Enhanced with bilingual support)
 */
export const menuAPI = {
  // Get all menu items with filters
  getItems: async (params = {}) => {
    const response = await api.get('/food-complete/menu', { params });
    return response.data;
  },

  // Get single menu item
  getItem: async (id) => {
    const response = await api.get(`/food-complete/menu/${id}`);
    return response.data;
  },

  // Create menu item (admin)
  createItem: async (formData) => {
    const response = await api.post('/food-complete/menu', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Update menu item (admin)
  updateItem: async (id, formData) => {
    const response = await api.put(`/food-complete/menu/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Delete menu item (admin)
  deleteItem: async (id) => {
    const response = await api.delete(`/food-complete/menu/${id}`);
    return response.data;
  },

  // Toggle availability (admin)
  toggleAvailability: async (id, isAvailable) => {
    const response = await api.patch(`/food-complete/menu/${id}/availability`, { isAvailable });
    return response.data;
  },

  // Get admin stats
  getStats: async () => {
    const response = await api.get('/food-complete/menu/stats/summary');
    return response.data;
  }
};

/**
 * AI Extraction API
 */
export const aiAPI = {
  // Extract menu from image
  extractMenu: async (imageFile, onProgress) => {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await api.post('/food-complete/ai/extract', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });
    return response.data;
  },

  // Get supported languages
  getSupportedLanguages: async () => {
    const response = await api.get('/food-complete/ai/supported-languages');
    return response.data;
  }
};

/**
 * Order API (Enhanced)
 */
export const orderAPI = {
  // Modify order
  modifyOrder: async (orderId, data) => {
    const response = await api.patch(`/food-complete/orders/${orderId}/modify`, data);
    return response.data;
  },

  // Cancel order
  cancelOrder: async (orderId, reason) => {
    const response = await api.post(`/food-complete/orders/${orderId}/cancel`, { reason });
    return response.data;
  }
};

/**
 * Review API
 */
export const reviewAPI = {
  // Create review
  createReview: async (data) => {
    const response = await api.post('/food-complete/reviews', data);
    return response.data;
  },

  // Get menu item reviews
  getMenuItemReviews: async (menuItemId, params = {}) => {
    const response = await api.get(`/food-complete/reviews/menu/${menuItemId}`, { params });
    return response.data;
  }
};

/**
 * Categories API (existing)
 */
export const categoryAPI = {
  getAll: async () => {
    const response = await api.get('/menu/categories');
    return response.data;
  }
};

export default {
  menuAPI,
  aiAPI,
  orderAPI,
  reviewAPI,
  categoryAPI
};
