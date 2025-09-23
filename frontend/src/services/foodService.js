import api from './api.js';

const FOOD_API_BASE = '/menu';

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

      const queryString = queryParams.toString();
      const url = `${FOOD_API_BASE}/items${queryString ? `?${queryString}` : ''}`;

      const response = await api.get(url);
      // Handle different response formats
      if (response.data && response.data.data) {
        // New format with success/data structure
        return { ...response, data: response.data.data };
      }
      // Legacy format or direct array
      return response;
    } catch (error) {
      console.error('Error fetching menu items:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch menu items');
    }
  }

  // Get single menu item by ID
  async getMenuItem(id) {
    try {
      const response = await api.get(`${FOOD_API_BASE}/items/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching menu item:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch menu item');
    }
  }

  // Create new menu item
  async createMenuItem(menuItemData) {
    try {
      const formData = new FormData();

      // Add all text fields
      Object.keys(menuItemData).forEach(key => {
        if (key !== 'image' && menuItemData[key] !== undefined && menuItemData[key] !== null) {
          if (typeof menuItemData[key] === 'object') {
            formData.append(key, JSON.stringify(menuItemData[key]));
          } else {
            formData.append(key, menuItemData[key]);
          }
        }
      });

      // Add image file if present
      if (menuItemData.image && menuItemData.image instanceof File) {
        formData.append('image', menuItemData.image);
      }

      const response = await api.post(`${FOOD_API_BASE}/items`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error creating menu item:', error);
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
          if (typeof menuItemData[key] === 'object') {
            formData.append(key, JSON.stringify(menuItemData[key]));
          } else {
            formData.append(key, menuItemData[key]);
          }
        }
      });

      // Add image file if present
      if (menuItemData.image && menuItemData.image instanceof File) {
        formData.append('image', menuItemData.image);
      }

      const response = await api.put(`${FOOD_API_BASE}/items/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error updating menu item:', error);
      throw new Error(error.response?.data?.message || 'Failed to update menu item');
    }
  }

  // Delete menu item
  async deleteMenuItem(id) {
    try {
      const response = await api.delete(`${FOOD_API_BASE}/items/${id}`);
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

      const response = await api.post(`${FOOD_API_BASE}/process-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error processing menu image:', error);
      throw new Error(error.response?.data?.message || 'Failed to process menu image');
    }
  }

  // Generate menu items with AI
  async generateMenuItems(cuisineType, dietaryRestrictions = [], numberOfItems = 5) {
    try {
      const response = await api.post(`${FOOD_API_BASE}/generate`, {
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

      const response = await api.post(`${FOOD_API_BASE}/generate-from-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error generating menu from image:', error);
      throw new Error(error.response?.data?.message || 'Failed to generate menu from image');
    }
  }

  // Create multiple menu items at once
  async createBatchMenuItems(items) {
    try {
      const response = await api.post(`${FOOD_API_BASE}/batch`, { items });
      return response.data;
    } catch (error) {
      console.error('Error creating batch menu items:', error);
      throw new Error(error.response?.data?.message || 'Failed to create menu items');
    }
  }

  // Get menu item image
  async getMenuItemImage(id) {
    try {
      const response = await api.get(`${FOOD_API_BASE}/items/${id}/image`, {
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
      const response = await api.post('/food/orders/create', orderData);
      return response;
    } catch (error) {
      console.error('Error creating food order:', error);
      throw new Error(error.response?.data?.message || 'Failed to create order');
    }
  }

  // Get user's food orders
  async getUserOrders() {
    try {
      const response = await api.get('/food/orders/my-orders');
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
}

const foodService = new FoodService();
export default foodService;