// 📁 frontend/src/services/paymentService.js
import api from './api';

export const paymentService = {
  initPayHere: async (orderData) => {
    const response = await api.post('/api/payments/payhere/init', orderData);
    return response.data; // { success, data: { order, payhere: { action, params } } }
  }
};
