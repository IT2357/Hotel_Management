import crypto from 'crypto';
import axios from 'axios';

class PayHereService {
  constructor() {
    this.merchantId = process.env.PAYHERE_MERCHANT_ID;
    this.merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    this.apiUrl = process.env.PAYHERE_API_URL || 'https://sandbox.payhere.lk/pay/checkout';
    this.notifyUrl = process.env.PAYHERE_NOTIFY_URL;
    this.returnUrl = process.env.PAYHERE_RETURN_URL;
    this.cancelUrl = process.env.PAYHERE_CANCEL_URL;
    this.isSandbox = process.env.NODE_ENV !== 'production';
  }

  /**
   * Generate PayHere payment form data
   */
  generatePaymentData(orderData) {
    const {
      orderId,
      amount,
      currency = 'LKR',
      customerName,
      customerEmail,
      customerPhone,
      items = [],
      custom1 = '', // User ID
      custom2 = '', // Booking ID
    } = orderData;

    const formData = {
      merchant_id: this.merchantId,
      return_url: this.returnUrl,
      cancel_url: this.cancelUrl,
      notify_url: this.notifyUrl,
      order_id: orderId,
      items: items.length > 0 ? items[0].name : 'Hotel Booking',
      currency: currency,
      amount: amount,
      first_name: customerName.split(' ')[0] || '',
      last_name: customerName.split(' ').slice(1).join(' ') || '',
      email: customerEmail,
      phone: customerPhone,
      address: '',
      city: '',
      country: 'Sri Lanka',
      custom_1: custom1,
      custom_2: custom2,
    };

    return formData;
  }

  /**
   * Generate PayHere payment hash for security
   */
  generateHash(paymentData) {
    const {
      merchant_id,
      order_id,
      amount,
      currency,
      merchant_secret = this.merchantSecret
    } = paymentData;

    const hashString = `${merchant_id}${order_id}${amount}${currency}${merchant_secret}`;
    return crypto.createHash('md5').update(hashString).digest('hex');
  }

  /**
   * Verify PayHere payment notification
   */
  verifyPaymentNotification(notificationData) {
    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig
    } = notificationData;

    const expectedHash = crypto.createHash('md5')
      .update(`${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${this.merchantSecret}`)
      .digest('hex');

    return md5sig === expectedHash;
  }

  /**
   * Process PayHere webhook notification
   */
  async processPaymentNotification(notificationData) {
    try {
      // Verify the notification
      if (!this.verifyPaymentNotification(notificationData)) {
        throw new Error('Invalid payment notification signature');
      }

      const {
        order_id,
        payment_id,
        payhere_amount,
        payhere_currency,
        status_code,
        custom_1, // User ID
        custom_2, // Booking ID
        method,
        card_holder_name,
      } = notificationData;

      // Process based on status code
      let paymentStatus;
      switch (status_code) {
        case '2':
          paymentStatus = 'success';
          break;
        case '-1':
          paymentStatus = 'cancelled';
          break;
        case '-2':
          paymentStatus = 'failed';
          break;
        case '-3':
          paymentStatus = 'charged_back';
          break;
        default:
          paymentStatus = 'pending';
      }

      return {
        orderId: order_id,
        paymentId: payment_id,
        amount: parseFloat(payhere_amount),
        currency: payhere_currency,
        status: paymentStatus,
        userId: custom_1,
        bookingId: custom_2,
        paymentMethod: method,
        cardHolderName: card_holder_name,
        rawNotification: notificationData,
      };

    } catch (error) {
      console.error('PayHere notification processing error:', error);
      throw error;
    }
  }

  /**
   * Get PayHere checkout URL
   */
  getCheckoutUrl() {
    return this.isSandbox
      ? 'https://sandbox.payhere.lk/pay/checkout'
      : 'https://www.payhere.lk/pay/checkout';
  }

  /**
   * Create PayHere payment session
   */
  createPaymentSession(orderData) {
    const paymentData = this.generatePaymentData(orderData);
    const hash = this.generateHash({
      merchant_id: paymentData.merchant_id,
      order_id: paymentData.order_id,
      amount: paymentData.amount,
      currency: paymentData.currency,
    });

    return {
      ...paymentData,
      hash,
      action: this.getCheckoutUrl(),
    };
  }
}

export default new PayHereService();
