import api from './api.js';

const FOOD_API_BASE = '/food/items';

class FoodService {
  // Get all menu items with optional filters
  async getMenuItems(filters = {}) {
    try {
      const queryParams = new URLSearchParams();

      if (filters.category && filters.category !== 'all') {
        queryParams.append('category', filters.category);
      }

      if (filters.search) {
        queryParams.append('search', filters.search);
      }

      if (filters.isAvailable !== undefined) {
        queryParams.append('isAvailable', filters.isAvailable);
      }

      if (filters.mealTime) {
        queryParams.append('mealTime', filters.mealTime);
      }

      const queryString = queryParams.toString();
      const url = `${FOOD_API_BASE}${queryString ? `?${queryString}` : ''}`;

      console.log('📦 Fetching menu items from:', url);
      const response = await api.get(url);
      console.log('📦 Menu items response:', response.data);
      
      // Handle different response formats
      if (response.data && response.data.data) {
        // New format with success/data structure
        if (response.data.data.items) {
          // Return just the items array for compatibility
          console.log('📦 Returning', response.data.data.items.length, 'menu items');
          return { ...response, data: response.data.data.items };
        }
        console.log('📦 Returning', response.data.data.length || 0, 'menu items');
        return { ...response, data: response.data.data };
      }
      // Legacy format or direct array
      console.log('📦 Returning legacy format menu items');
      return response;
    } catch (error) {
      console.error('❌ Error fetching menu items:', error);
      console.error('❌ Error response:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to fetch menu items');
    }
  }

  // Get categories
  async getCategories() {
    try {
      console.log('📂 Fetching categories from /food/categories...');
      const response = await api.get('/food/categories');
      console.log('📂 Categories response:', response.data);
      
      // Ensure we have the data array
      const categoriesData = response.data?.data || response.data || [];
      console.log('📂 Categories loaded:', categoriesData.length, 'items');
      
      return { ...response, data: categoriesData };
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      console.error('❌ Error response:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to fetch categories');
    }
  }

  // Get single menu item by ID
  async getMenuItem(id) {
    try {
      const response = await api.get(`${FOOD_API_BASE}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching menu item:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch menu item');
    }
  }

  // Create new menu item
  async createMenuItem(menuItemData) {
    try {
      console.log('📝 Creating menu item with data:', menuItemData);
      
      const formData = new FormData();

      // Add all text fields
      Object.keys(menuItemData).forEach(key => {
        if (key !== 'image' && menuItemData[key] !== undefined && menuItemData[key] !== null) {
          if (Array.isArray(menuItemData[key])) {
            // Handle arrays by appending each element
            menuItemData[key].forEach(item => {
              formData.append(`${key}[]`, item);
            });
          } else if (typeof menuItemData[key] === 'object') {
            // For category field, extract the ID if it's an object
            if (key === 'category') {
              const categoryId = menuItemData[key]._id || menuItemData[key].id || menuItemData[key];
              console.log('📂 Category ID being sent:', categoryId);
              formData.append(key, categoryId);
            } else {
              formData.append(key, JSON.stringify(menuItemData[key]));
            }
          } else {
            formData.append(key, menuItemData[key]);
          }
        }
      });

      // Add image file if present
      if (menuItemData.image && menuItemData.image instanceof File) {
        formData.append('file', menuItemData.image);
      }

      // Log all FormData entries for debugging
      console.log('📤 FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }

      const response = await api.post(`${FOOD_API_BASE}`, formData);

      return response.data;
    } catch (error) {
      console.error('❌ Error creating menu item:', error);
      console.error('❌ Response data:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to create menu item');
    }
  }

  // Update menu item
  async updateMenuItem(id, menuItemData) {
    try {
      const formData = new FormData();

      // Add all text fields
      Object.keys(menuItemData).forEach(key => {
        if (key !== 'image' && menuItemData[key] !== undefined && menuItemData[key] !== null) {
          if (Array.isArray(menuItemData[key])) {
            // Handle arrays by appending each element
            menuItemData[key].forEach(item => {
              formData.append(`${key}[]`, item);
            });
          } else if (typeof menuItemData[key] === 'object') {
            // For category field, extract the ID if it's an object
            if (key === 'category') {
              formData.append(key, menuItemData[key]._id || menuItemData[key].id || menuItemData[key]);
            } else {
              formData.append(key, JSON.stringify(menuItemData[key]));
            }
          } else {
            formData.append(key, menuItemData[key]);
          }
        }
      });

      // Add image file if present
      if (menuItemData.image && menuItemData.image instanceof File) {
        formData.append('file', menuItemData.image);
      }

      const response = await api.put(`${FOOD_API_BASE}/${id}`, formData);

      return response.data;
    } catch (error) {
      console.error('Error updating menu item:', error);
      throw new Error(error.response?.data?.message || 'Failed to update menu item');
    }
  }

  // Delete menu item
  async deleteMenuItem(id) {
    try {
      const response = await api.delete(`${FOOD_API_BASE}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting menu item:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete menu item');
    }
  }

  // Process menu image with AI/OCR
  async processMenuImage(imageFile) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await api.post('/food/process-image', formData);

      return response.data;
    } catch (error) {
      console.error('Error processing menu image:', error);
      throw new Error(error.response?.data?.message || 'Failed to process menu image');
    }
  }

  // Generate menu items with AI
  async generateMenuItems(cuisineType, dietaryRestrictions = [], numberOfItems = 5) {
    try {
      const response = await api.post('/food/ai/generate', {
        cuisineType,
        dietaryRestrictions,
        numberOfItems
      });

      return response.data;
    } catch (error) {
      console.error('Error generating menu items:', error);
      throw new Error(error.response?.data?.message || 'Failed to generate menu items');
    }
  }

  // Generate menu items from image using AI
  async generateMenuFromImage(imageFile, cuisineType = 'General', dietaryRestrictions = []) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('cuisineType', cuisineType);

      if (dietaryRestrictions.length > 0) {
        dietaryRestrictions.forEach(restriction => {
          formData.append('dietaryRestrictions[]', restriction);
        });
      }

      const response = await api.post('/food/ai/generate-from-image', formData);

      return response.data;
    } catch (error) {
      console.error('Error generating menu from image:', error);
      throw new Error(error.response?.data?.message || 'Failed to generate menu from image');
    }
  }

  // Create multiple menu items at once
  async createBatchMenuItems(items) {
    try {
      const response = await api.post('/food/batch', { items });
      return response.data;
    } catch (error) {
      console.error('Error creating batch menu items:', error);
      throw new Error(error.response?.data?.message || 'Failed to create menu items');
    }
  }

  // Get menu item image
  async getMenuItemImage(id) {
    try {
      const response = await api.get(`/food/image/${id}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching menu item image:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch menu item image');
    }
  }

  // Get menu items with proper image handling
  async getMenuItemsWithImages(filters = {}) {
    try {
      const response = await this.getMenuItems(filters);
      const items = response.data || [];

      // Process images for each item
      const itemsWithImages = await Promise.all(
        items.map(async (item) => {
          if (item.image && item.image.data) {
            // Convert binary image data to base64
            const base64Image = `data:${item.image.contentType};base64,${item.image.data.toString('base64')}`;
            return { ...item, imageUrl: base64Image };
          }
          return item;
        })
      );

      return { ...response, data: itemsWithImages };
    } catch (error) {
      console.error('Error fetching menu items with images:', error);
      throw error;
    }
  }

  // Create food order
  async createOrder(orderData) {
    try {
      console.log('Creating food order with data:', orderData);
      const response = await api.post('/food/orders', orderData);
      console.log('Order creation response:', response);
      return response;
    } catch (error) {
      console.error('Error creating food order:', error);
      throw new Error(error.response?.data?.message || 'Failed to create order');
    }
  }

  // Get user's food orders
  async getUserOrders(email = null) {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      
      // If authenticated, get user's orders with cache-busting
      if (token) {
        const response = await api.get(`/food/orders/customer?_t=${Date.now()}`);
        return response;
      }
      
      // For guest users, require email parameter
      if (!email) {
        // Try to get email from last order in localStorage
        const lastOrderEmail = localStorage.getItem('guestOrderEmail');
        if (!lastOrderEmail) {
          throw new Error('Email is required to view orders. Please log in or provide your email.');
        }
        email = lastOrderEmail;
      }
      
      // Fetch guest orders by email with cache-busting
      const response = await api.get(`/food/orders/customer?email=${encodeURIComponent(email)}&_t=${Date.now()}`);
      
      // Save email for future requests
      if (email) {
        localStorage.setItem('guestOrderEmail', email);
      }
      
      return response;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch orders');
    }
  }

  // Get specific food order
  async getOrder(orderId) {
    try {
      const response = await api.get(`/food/orders/${orderId}`);
      return response;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch order');
    }
  }

  // Review methods
  async getMenuItemReviews(menuItemId, options = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(options).forEach(key => {
        if (options[key] !== undefined) {
          queryParams.append(key, options[key]);
        }
      });
      
      const queryString = queryParams.toString();
      const url = `/food/reviews/menu/${menuItemId}${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch reviews');
    }
  }

  async submitReview(menuItemId, reviewData) {
    try {
      const response = await api.post(`/food/reviews/menu/${menuItemId}`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Error submitting review:', error);
      throw new Error(error.response?.data?.message || 'Failed to submit review');
    }
  }

  // Alias method for menu item reviews for clarity
  async submitMenuItemReview(menuItemId, reviewData) {
    return this.submitReview(menuItemId, reviewData);
  }

  async voteReview(reviewId, isHelpful) {
    try {
      const response = await api.post(`/food/reviews/${reviewId}/vote`, { isHelpful });
      return response.data;
    } catch (error) {
      console.error('Error voting on review:', error);
      throw new Error(error.response?.data?.message || 'Failed to vote on review');
    }
  }

  async reportReview(reviewId, reason, description) {
    try {
      const response = await api.post(`/food/reviews/${reviewId}/report`, { reason, description });
      return response.data;
    } catch (error) {
      console.error('Error reporting review:', error);
      throw new Error(error.response?.data?.message || 'Failed to report review');
    }
  }

  // Kitchen methods
  async getKitchenStats() {
    try {
      const response = await api.get('/kitchen/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching kitchen stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch kitchen stats');
    }
  }

  async getKitchenOrders(options = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(options).forEach(key => {
        if (options[key] !== undefined) {
          queryParams.append(key, options[key]);
        }
      });
      
      const queryString = queryParams.toString();
      const url = `/kitchen/orders${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching kitchen orders:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch kitchen orders');
    }
  }

  async updateOrderStatus(orderId, status, notes) {
    try {
      const response = await api.patch(`/kitchen/orders/${orderId}/status`, { status, notes });
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw new Error(error.response?.data?.message || 'Failed to update order status');
    }
  }

  async assignOrderToStaff(orderId, staffId) {
    try {
      const response = await api.patch(`/kitchen/orders/${orderId}/assign`, { staffId });
      return response.data;
    } catch (error) {
      console.error('Error assigning order:', error);
      throw new Error(error.response?.data?.message || 'Failed to assign order');
    }
  }

  // AI Menu Extraction (Admin Only)
  async extractMenuFromImage(imageFile) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await api.post('/food-complete/ai/extract', formData);

      return response.data;
    } catch (error) {
      console.error('Error extracting menu from image:', error);
      throw new Error(error.response?.data?.message || 'Failed to extract menu from image');
    }
  }

  // Get supported languages for AI extraction
  async getSupportedLanguages() {
    try {
      const response = await api.get('/food-complete/ai/supported-languages');
      return response.data;
    } catch (error) {
      console.error('Error fetching supported languages:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch supported languages');
    }
  }

  // Payment methods
  async initializePayment(orderId, amount, customerDetails) {
    try {
      const response = await api.post('/food/payment/initialize', {
        orderId,
        amount,
        customerDetails
      });
      return response.data;
    } catch (error) {
      console.error('Error initializing payment:', error);
      throw new Error(error.response?.data?.message || 'Failed to initialize payment');
    }
  }

  async verifyPayment(orderId, paymentId) {
    try {
      const response = await api.post('/food/payment/verify', {
        orderId,
        paymentId
      });
      return response.data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw new Error(error.response?.data?.message || 'Failed to verify payment');
    }
  }

  async getPaymentStatus(orderId) {
    try {
      const response = await api.get(`/food/payment/status/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting payment status:', error);
      throw new Error(error.response?.data?.message || 'Failed to get payment status');
    }
  }
}

const foodService = new FoodService();
export default foodService;