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

  // Process booking payment
  processBookingPayment: (bookingNumber, paymentData) => api.put(`/bookings/${bookingNumber}/process-payment`, paymentData),

  // Submit payment to PayHere (for card payments)
  submitToPayHere: (paymentSession) => {
    return new Promise((resolve, reject) => {
      try {
        // Create a form element dynamically
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = paymentSession.action || 'https://sandbox.payhere.lk/pay/checkout';
        form.style.display = 'none';

        // Add all payment data as hidden inputs
        Object.entries(paymentSession).forEach(([key, value]) => {
          if (key !== 'action' && value !== null && value !== undefined) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value;
            form.appendChild(input);
          }
        });

        // Append form to body and submit
        document.body.appendChild(form);
        console.log('Submitting PayHere payment form with data:', paymentSession);
        form.submit();
        
        // Resolve immediately after submission (PayHere will handle the redirect)
        resolve({ success: true, message: 'Redirecting to PayHere...' });
      } catch (error) {
        console.error('Error submitting PayHere form:', error);
        reject(error);
      }
    });
  },
};

export default paymentService;
