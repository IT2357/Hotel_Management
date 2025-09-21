// src/services/paymentService.js
import api from "./api";

const paymentService = {
  // Initiate PayHere payment
  initiatePayment: (paymentData) => api.post("/admin/payments/initiate", paymentData),

  // Get payment status
  getPaymentStatus: (paymentId) => api.get(`/admin/payments/${paymentId}`),

  // Process refund
  refundPayment: (paymentId, refundData) =>
    api.post(`/admin/payments/${paymentId}/refund`, refundData),

  // Get payment methods from settings
  getPaymentMethods: () => api.get("/admin/settings"),

  // Create PayHere payment form
  createPayHereForm: (paymentSession) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = paymentSession.action;
    form.style.display = 'none';

    // Add all payment data as hidden inputs
    Object.entries(paymentSession).forEach(([key, value]) => {
      if (key !== 'action') {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      }
    });

    document.body.appendChild(form);
    return form;
  },

  // Submit PayHere payment
  submitPayHerePayment: (paymentSession) => {
    return new Promise((resolve, reject) => {
      try {
        const form = paymentService.createPayHereForm(paymentSession);
        form.submit();
        resolve({ success: true });
      } catch (error) {
        reject(error);
      }
    });
  },

  // Validate payment configuration
  validatePaymentConfig: (provider) => {
    return api.post("/admin/settings/validate-payment", { provider });
  }
};

export default paymentService;
