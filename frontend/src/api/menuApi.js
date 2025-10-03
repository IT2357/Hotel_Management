import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/menu`,
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

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Menu API service
 */
class MenuAPI {
  /**
   * Extract menu from image upload
   * @param {File} file - Image file
   * @returns {Promise<Object>} Extraction result
   */
  async extractFromImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/extract', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Extract menu from local file path
   * @param {string} path - Local file path
   * @returns {Promise<Object>} Extraction result
   */
  async extractFromPath(path) {
    const response = await api.post('/extract', { path });
    return response.data;
  }

  /**
   * Extract menu from URL
   * @param {string} url - Website URL
   * @returns {Promise<Object>} Extraction result
   */
  async extractFromURL(url) {
    const response = await api.post('/extract', { url });
    return response.data;
  }

  /**
   * Get menu preview by ID
   * @param {string} id - Menu ID
   * @returns {Promise<Object>} Menu data
   */
  async getPreview(id) {
    const response = await api.get(`/${id}`);
    return response.data;
  }

  /**
   * Save edited menu to database
   * @param {Object} menuData - Complete menu data
   * @returns {Promise<Object>} Save result
   */
  async saveMenu(menuData) {
    const response = await api.post('/save', menuData);
    return response.data;
  }

  /**
   * Get saved menu by ID
   * @param {string} id - Menu ID
   * @returns {Promise<Object>} Menu data
   */
  async getMenu(id) {
    const response = await api.get(`/${id}`);
    return response.data;
  }

  /**
   * List menus with pagination and filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Menus list with pagination
   */
  async listMenus(params = {}) {
    const response = await api.get('/', { params });
    return response.data;
  }

  /**
   * Delete menu by ID
   * @param {string} id - Menu ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteMenu(id) {
    const response = await api.delete(`/${id}`);
    return response.data;
  }

  /**
   * Get extraction statistics
   * @returns {Promise<Object>} Statistics data
   */
  async getStats() {
    const response = await api.get('/stats');
    return response.data;
  }

  /**
   * Get image URL for GridFS image
   * @param {string} gridfsId - GridFS file ID
   * @returns {string} Image URL
   */
  getImageUrl(gridfsId) {
    return `${API_BASE_URL}/api/menu-extractor/image/${gridfsId}`;
  }

  /**
   * Download image from GridFS
   * @param {string} gridfsId - GridFS file ID
   * @returns {Promise<Blob>} Image blob
   */
  async downloadImage(gridfsId) {
    const response = await api.get(`/image/${gridfsId}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Validate menu structure before saving
   * @param {Object} menuData - Menu data to validate
   * @returns {Array} Array of validation errors (empty if valid)
   */
  validateMenuStructure(menuData) {
    const errors = [];

    if (!menuData.source || !menuData.source.type || !menuData.source.value) {
      errors.push('Source information is required');
    }

    if (!menuData.categories || !Array.isArray(menuData.categories)) {
      errors.push('Categories must be an array');
    } else {
      menuData.categories.forEach((category, catIndex) => {
        if (!category.name || typeof category.name !== 'string') {
          errors.push(`Category ${catIndex + 1}: name is required`);
        }

        if (!category.items || !Array.isArray(category.items)) {
          errors.push(`Category "${category.name}": items must be an array`);
        } else {
          category.items.forEach((item, itemIndex) => {
            if (!item.name || typeof item.name !== 'string') {
              errors.push(`Category "${category.name}", Item ${itemIndex + 1}: name is required`);
            }

            if (typeof item.price !== 'number' || item.price < 0) {
              errors.push(`Category "${category.name}", Item "${item.name}": price must be a positive number`);
            }
          });
        }
      });
    }

    return errors;
  }

  /**
   * Format price for display
   * @param {number} price - Price value
   * @param {string} currency - Currency symbol
   * @returns {string} Formatted price
   */
  formatPrice(price, currency = '$') {
    if (typeof price !== 'number') return 'N/A';
    return `${currency}${price.toFixed(2)}`;
  }

  /**
   * Clean and normalize extracted text
   * @param {string} text - Raw text
   * @returns {string} Cleaned text
   */
  cleanText(text) {
    if (!text) return '';
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?-]/g, '')
      .trim();
  }

  /**
   * Extract price from text
   * @param {string} text - Text containing price
   * @returns {number} Extracted price or 0
   */
  extractPrice(text) {
    const pricePatterns = [
      /\$(\d+\.?\d*)/,
      /(\d+\.?\d*)\s*\$/,
      /(\d+)\s*rs/i,
      /rs\s*(\d+)/i,
      /₹\s*(\d+\.?\d*)/,
      /(\d+\.?\d*)\s*₹/,
      /(\d+)\s*\/-/,
      /(\d+\.?\d*)/
    ];

    for (const pattern of pricePatterns) {
      const match = text.match(pattern);
      if (match) {
        const price = parseFloat(match[1]);
        if (price > 0 && price < 10000) {
          return price;
        }
      }
    }

    return 0;
  }
}

export default new MenuAPI();
