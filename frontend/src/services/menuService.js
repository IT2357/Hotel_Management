// src/services/menuService.js
import api from './api';

export const menuService = {
  // Get all categories
  getCategories: async () => {
    try {
      const response = await api.get('/api/menu/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Get all menu items
  getMenuItems: async () => {
    try {
      const response = await api.get('/api/menu/items');
      return response.data;
    } catch (error) {
      console.error('Error fetching menu items:', error);
      throw error;
    }
  },

  // Get menu items by category (category is a NAME string in backend schema)
  getMenuItemsByCategory: async (categoryName) => {
    try {
      // Backend route: GET /api/menu/categories/:category/items
      const safe = encodeURIComponent(categoryName);
      const response = await api.get(`/api/menu/categories/${safe}/items`);
      return response.data;
    } catch (error) {
      console.error('Error fetching menu items by category:', error);
      throw error;
    }
  },

  // Get single menu item
  getMenuItem: async (itemId) => {
    try {
      const response = await api.get(`/api/menu/items/${itemId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching menu item:', error);
      throw error;
    }
  },

  // Create a customer order (used by CheckoutModal)
  // Transforms cart payload to match backend validation in `backend/routes/orderRoutes.js`
  createOrder: async (orderData) => {
    try {
      // Transform to backend expected structure
      const payload = {
        orderType: (orderData.orderType || '').toLowerCase() === 'dine-in' ? 'dine-in' : 'takeaway',
        tableNumber: orderData.tableNumber || undefined,
        customerInfo: orderData.customerInfo,
        items: (orderData.items || []).map((it) => ({
          // Backend expects menuItemId and quantity; keep optional fields for record
          menuItemId: it.menuItem || it.menuItemId,
          quantity: it.quantity,
          selectedPortion: it.portion?.name || it.portion?.label || null,
          price: it.portion?.price || it.price || 0,
          specialInstructions: it.specialInstructions || ''
        })),
        // Totals for server-side verification and display
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        serviceCharge: orderData.serviceCharge,
        total: orderData.total,
        paymentMethod: orderData.paymentMethod,
        estimatedPrepTime: orderData.estimatedPrepTime || 30
      };

      // Persist email for My Orders lookup (guest users)
      if (payload.customerInfo?.email) {
        try { localStorage.setItem('customerEmail', payload.customerInfo.email); } catch {}
      }

      const response = await api.post('/api/orders/customer', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      // Normalize error shape for UI
      throw error?.response?.data || { success: false, message: 'Failed to create order' };
    }
  }
};
