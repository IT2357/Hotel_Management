import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Create axios instance for menu extraction endpoints
const menuExtractionApi = axios.create({
  baseURL: `${API_BASE_URL}/api/menu-extraction`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
menuExtractionApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && token !== 'undefined') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
menuExtractionApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

class MenuExtractionService {
  // Upload and extract menu from various sources
  async uploadMenu(formData) {
    try {
      const response = await menuExtractionApi.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading menu:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload menu');
    }
  }

  // Get all extracted menus with pagination
  async getExtractedMenus(params = {}) {
    try {
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('status', params.status);
      if (params.source) queryParams.append('source', params.source);

      const response = await menuExtractionApi.get(`/?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching extracted menus:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch menus');
    }
  }

  // Get single extracted menu by ID
  async getExtractedMenu(id) {
    try {
      const response = await menuExtractionApi.get(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching menu:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch menu');
    }
  }

  // Update extracted menu data
  async updateExtractedMenu(id, updates) {
    try {
      const response = await menuExtractionApi.put(`/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating menu:', error);
      throw new Error(error.response?.data?.message || 'Failed to update menu');
    }
  }

  // Delete extracted menu
  async deleteExtractedMenu(id) {
    try {
      const response = await menuExtractionApi.delete(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting menu:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete menu');
    }
  }

  // Convert extracted menu to MenuItem format and save
  async saveToMenuItems(menuData) {
    try {
      // Convert to MenuItem format
      const menuItems = [];

      menuData.categories.forEach(category => {
        category.items.forEach(item => {
          menuItems.push({
            name: item.name,
            description: item.description || '',
            price: item.price,
            category: category.name.toLowerCase().replace(/\s+/g, '-'),
            isAvailable: true,
            isVeg: false, // Default values - can be enhanced
            isSpicy: false,
            isPopular: false,
            ingredients: [],
            cookingTime: 15,
            customizations: []
          });
        });
      });

      // Use the main API for saving to menu items
      const response = await menuExtractionApi.post('/save-to-menu-items', { items: menuItems });
      return response.data;
    } catch (error) {
      console.error('Error saving to menu items:', error);
      throw new Error(error.response?.data?.message || 'Failed to save menu items');
    }
  }

  // Get extraction statistics
  async getExtractionStats() {
    try {
      const response = await menuExtractionApi.get('/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching extraction stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch stats');
    }
  }

  // Validate URL before processing
  async validateUrl(url) {
    try {
      const response = await menuExtractionApi.post('/validate-url', { url });
      return response.data;
    } catch (error) {
      console.error('Error validating URL:', error);
      throw new Error(error.response?.data?.message || 'Failed to validate URL');
    }
  }

  // Get supported file formats
  getSupportedFormats() {
    return {
      images: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      maxSize: '15MB',
      sources: ['upload', 'url', 'path']
    };
  }

  // Format extraction confidence level
  formatConfidence(confidence) {
    if (confidence >= 90) return { level: 'high', color: 'green', text: 'Excellent' };
    if (confidence >= 75) return { level: 'medium', color: 'yellow', text: 'Good' };
    if (confidence >= 60) return { level: 'low', color: 'orange', text: 'Fair' };
    return { level: 'very-low', color: 'red', text: 'Poor' };
  }

  // Format extraction method for display
  formatExtractionMethod(method) {
    const methods = {
      'openai-vision': 'OpenAI Vision',
      'google-vision': 'Google Vision',
      'tesseract': 'Tesseract OCR',
      'web-scraping': 'Web Scraping'
    };
    return methods[method] || method;
  }

  // Validate menu data structure
  validateMenuData(menuData) {
    const errors = [];

    if (!menuData.title || !menuData.title.trim()) {
      errors.push('Menu title is required');
    }

    if (!menuData.categories || menuData.categories.length === 0) {
      errors.push('At least one category is required');
    }

    menuData.categories?.forEach((category, categoryIndex) => {
      if (!category.name || !category.name.trim()) {
        errors.push(`Category ${categoryIndex + 1} name is required`);
      }

      if (!category.items || category.items.length === 0) {
        errors.push(`Category "${category.name}" must have at least one item`);
      }

      category.items?.forEach((item, itemIndex) => {
        if (!item.name || !item.name.trim()) {
          errors.push(`Item ${itemIndex + 1} in "${category.name}" must have a name`);
        }

        if (!item.price || item.price <= 0) {
          errors.push(`Item "${item.name}" must have a valid price`);
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

const menuExtractionService = new MenuExtractionService();
export default menuExtractionService;
