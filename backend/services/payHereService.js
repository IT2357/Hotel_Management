import crypto from 'crypto';
import axios from 'axios';
import AdminSettings from '../models/AdminSettings.js';

class PayHereService {
  constructor() {
    // Fallback to environment variables (will be overridden by DB settings)
    this.merchantId = process.env.PAYHERE_MERCHANT_ID;
    this.merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    this.apiUrl = process.env.PAYHERE_API_URL || 'https://sandbox.payhere.lk/pay/checkout';
    this.notifyUrl = process.env.PAYHERE_NOTIFY_URL;
    this.returnUrl = process.env.PAYHERE_RETURN_URL;
    this.cancelUrl = process.env.PAYHERE_CANCEL_URL;
    this.isSandbox = process.env.NODE_ENV !== 'production';
    
    // Flag to track if settings are loaded
    this.settingsLoaded = false;
  }

  /**
   * Load PayHere configuration from database
   */
  async loadSettings() {
    try {
      const settings = await AdminSettings.findOne().select('paymentGateway').lean();
      
      if (settings && settings.paymentGateway) {
        const pg = settings.paymentGateway;
        
        // Only update if PayHere is the selected provider
        if (pg.provider === 'payhere') {
          this.merchantId = pg.publicKey || this.merchantId;
          this.merchantSecret = pg.secretKey || this.merchantSecret;
          this.webhookSecret = pg.webhookSecret || this.merchantSecret;
          
          // Update sandbox mode if provided in settings
          if (pg.testMode !== undefined) {
            this.isSandbox = pg.testMode;
          }
          
          // Update URLs from settings (fallback to environment if not set)
          this.returnUrl = pg.returnUrl || this.returnUrl;
          this.cancelUrl = pg.cancelUrl || this.cancelUrl;
          this.notifyUrl = pg.notifyUrl || this.notifyUrl;
          
          this.settingsLoaded = true;
          console.log('✅ PayHere settings loaded from database:', {
            merchantId: this.merchantId ? `${this.merchantId.substring(0, 4)}...` : 'not set',
            testMode: this.isSandbox,
            returnUrl: this.returnUrl,
            cancelUrl: this.cancelUrl,
            notifyUrl: this.notifyUrl
          });
        } else {
          console.warn(`⚠️ Payment gateway provider is ${pg.provider}, not PayHere`);
        }
      } else {
        console.warn('⚠️ No payment gateway settings found in database, using environment variables');
      }
    } catch (error) {
      console.error('❌ Failed to load PayHere settings from database:', error);
      console.log('⚠️ Falling back to environment variables');
    }
  }

  /**
   * Ensure settings are loaded before operations
   */
  async ensureSettings() {
    if (!this.settingsLoaded) {
      await this.loadSettings();
    }
  }

  /**
   * Generate PayHere payment form data
   */
  async generatePaymentData(orderData) {
    await this.ensureSettings();
    
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
      amount: parseFloat(amount).toFixed(2), // Ensure 2 decimal places
      first_name: customerName.split(' ')[0] || 'Guest',
      last_name: customerName.split(' ').slice(1).join(' ') || 'User',
      email: customerEmail,
      phone: customerPhone || '',
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
  async generateHash(paymentData) {
    await this.ensureSettings();
    
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
  async verifyPaymentNotification(notificationData) {
    await this.ensureSettings();
    
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
  async createPaymentSession(orderData) {
    await this.ensureSettings();
    
    // Validate required settings
    if (!this.merchantId) {
      throw new Error('PayHere Merchant ID is not configured. Please configure payment settings in Admin Settings.');
    }
    
    if (!this.merchantSecret) {
      throw new Error('PayHere Merchant Secret is not configured. Please configure payment settings in Admin Settings.');
    }
    
    if (!this.returnUrl || !this.cancelUrl || !this.notifyUrl) {
      console.warn('⚠️ PayHere URLs not fully configured:', {
        returnUrl: this.returnUrl,
        cancelUrl: this.cancelUrl,
        notifyUrl: this.notifyUrl
      });
    }
    
    const paymentData = await this.generatePaymentData(orderData);
    const hash = await this.generateHash({
      merchant_id: paymentData.merchant_id,
      order_id: paymentData.order_id,
      amount: paymentData.amount,
      currency: paymentData.currency,
    });

    const session = {
      ...paymentData,
      hash,
      action: this.getCheckoutUrl(),
    };
    
    console.log('✅ PayHere payment session created:', {
      order_id: session.order_id,
      amount: session.amount,
      currency: session.currency,
      merchant_id: session.merchant_id ? `${session.merchant_id.substring(0, 4)}...` : 'not set',
      action: session.action,
      hash: hash ? `${hash.substring(0, 8)}...` : 'not generated'
    });
    
    return session;
  }
}

export default new PayHereService();
