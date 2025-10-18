import twilio from 'twilio';
import { io } from 'socket.io-client';

/**
 * Notification Service for Food Orders
 * Handles SMS notifications via Twilio and Socket.io real-time updates
 */
class NotificationService {
  constructor() {
    this.twilioClient = null;
    this.socket = null;
    this.initializeTwilio();
  }

  /**
   * Initialize Twilio client
   */
  initializeTwilio() {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      
      if (accountSid && authToken) {
        this.twilioClient = twilio(accountSid, authToken);
        console.log('✅ Twilio client initialized successfully');
      } else {
        console.warn('⚠️ Twilio credentials not found. SMS notifications will be disabled.');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Twilio client:', error);
    }
  }

  /**
   * Send SMS notification
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} message - SMS message
   * @param {Object} order - Order details
   */
  async sendSMS(phoneNumber, message, order = null) {
    if (!this.twilioClient) {
      console.warn('⚠️ Twilio client not available. SMS not sent.');
      return { success: false, error: 'Twilio not configured' };
    }

    try {
      // Format phone number for Sri Lanka
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      const smsMessage = await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER || '+1234567890', // Your Twilio number
        to: formattedNumber
      });

      console.log(`📱 SMS sent successfully: ${smsMessage.sid}`);
      
      // Log SMS for debugging
      console.log(`📱 SMS Details:
        To: ${formattedNumber}
        Message: ${message}
        Order ID: ${order?._id || 'N/A'}
        Status: ${smsMessage.status}
      `);

      return { 
        success: true, 
        messageId: smsMessage.sid,
        status: smsMessage.status
      };
    } catch (error) {
      console.error('❌ Failed to send SMS:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Format phone number for Sri Lanka
   * @param {string} phoneNumber - Raw phone number
   */
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle Sri Lankan numbers
    if (cleaned.startsWith('0')) {
      // Convert 0XXXXXXXX to +94XXXXXXXX
      cleaned = '+94' + cleaned.substring(1);
    } else if (cleaned.startsWith('94')) {
      // Add + if missing
      cleaned = '+' + cleaned;
    } else if (!cleaned.startsWith('+')) {
      // Assume it's a local number and add +94
      cleaned = '+94' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Send order status notification
   * @param {Object} order - Order object
   * @param {string} status - New status
   */
  async sendOrderStatusNotification(order, status) {
    const customerPhone = order.customerDetails?.phone || order.guest?.phone;
    
    if (!customerPhone) {
      console.warn('⚠️ No phone number found for order notification');
      return { success: false, error: 'No phone number' };
    }

    const messages = {
      pending: `🍽️ Order #${order._id} received! We'll start preparing your delicious Jaffna meal shortly.`,
      confirmed: `✅ Order #${order._id} confirmed! Your meal is being prepared with love.`,
      preparing: `👨‍🍳 Order #${order._id} is being prepared by our chefs. Estimated time: 15-20 minutes.`,
      ready: order.orderType === 'dine-in' 
        ? `🍽️ Order #${order._id} is ready! Please wait for table service at Table ${order.tableNumber}.`
        : `📦 Order #${order._id} is ready for pickup! Your pickup code: ${order.pickupCode || 'TK' + order._id.slice(-6).toUpperCase()}`,
      delivered: `🎉 Order #${order._id} delivered! Thank you for choosing VALDOR. Enjoy your meal!`,
      cancelled: `❌ Order #${order._id} has been cancelled. If you have any questions, please contact us.`
    };

    const message = messages[status] || `Order #${order._id} status updated to ${status}`;
    
    return await this.sendSMS(customerPhone, message, order);
  }

  /**
   * Send order confirmation notification
   * @param {Object} order - Order object
   */
  async sendOrderConfirmation(order) {
    const customerPhone = order.customerDetails?.phone || order.guest?.phone;
    
    if (!customerPhone) {
      console.warn('⚠️ No phone number found for order confirmation');
      return { success: false, error: 'No phone number' };
    }

    const orderType = order.orderType === 'dine-in' ? 'dine-in' : 'takeaway';
    const totalAmount = order.totals?.total || order.totalPrice;
    
    let message = `🎉 Order #${order._id} confirmed!\n\n`;
    message += `📋 Order Type: ${orderType}\n`;
    message += `💰 Total: LKR ${totalAmount?.toFixed(2) || '0.00'}\n`;
    
    if (order.tableNumber) {
      message += `🪑 Table: ${order.tableNumber}\n`;
    }
    
    if (order.pickupTime) {
      message += `⏰ Pickup: ${order.pickupTime} minutes\n`;
    }
    
    message += `\nThank you for choosing VALDOR! We'll notify you when your order is ready.`;

    return await this.sendSMS(customerPhone, message, order);
  }

  /**
   * Send pickup reminder for takeaway orders
   * @param {Object} order - Order object
   */
  async sendPickupReminder(order) {
    if (order.orderType !== 'takeaway') {
      return { success: false, error: 'Not a takeaway order' };
    }

    const customerPhone = order.customerDetails?.phone || order.guest?.phone;
    
    if (!customerPhone) {
      return { success: false, error: 'No phone number' };
    }

    const message = `⏰ Reminder: Your takeaway order #${order._id} is ready for pickup!\n\n` +
                   `📦 Pickup Code: ${order.pickupCode || 'TK' + order._id.slice(-6).toUpperCase()}\n` +
                   `📍 Location: VALDOR Restaurant, 123 Culinary Street\n` +
                   `⏰ Please collect within 30 minutes.`;

    return await this.sendSMS(customerPhone, message, order);
  }

  /**
   * Send table ready notification for dine-in orders
   * @param {Object} order - Order object
   */
  async sendTableReadyNotification(order) {
    if (order.orderType !== 'dine-in') {
      return { success: false, error: 'Not a dine-in order' };
    }

    const customerPhone = order.customerDetails?.phone || order.guest?.phone;
    
    if (!customerPhone) {
      return { success: false, error: 'No phone number' };
    }

    const message = `🍽️ Your table is ready!\n\n` +
                   `🪑 Table: ${order.tableNumber}\n` +
                   `📋 Order: #${order._id}\n` +
                   `👨‍🍳 Our staff will serve your meal shortly.\n\n` +
                   `Thank you for choosing VALDOR!`;

    return await this.sendSMS(customerPhone, message, order);
  }

  /**
   * Emit Socket.io event for real-time updates
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emitSocketEvent(event, data) {
    try {
      // This would typically be called from the main server
      // where Socket.io is initialized
      if (global.io) {
        global.io.emit(event, data);
        console.log(`📡 Socket event emitted: ${event}`);
      } else {
        console.warn('⚠️ Socket.io not available for real-time updates');
      }
    } catch (error) {
      console.error('❌ Failed to emit socket event:', error);
    }
  }

  /**
   * Send order update via Socket.io
   * @param {Object} order - Order object
   * @param {string} status - New status
   */
  sendOrderUpdate(order, status) {
    const updateData = {
      orderId: order._id,
      status,
      orderType: order.orderType,
      tableNumber: order.tableNumber,
      pickupCode: order.pickupCode,
      timestamp: new Date().toISOString(),
      message: this.getStatusMessage(status, order)
    };

    this.emitSocketEvent('orderUpdate', updateData);
  }

  /**
   * Get status message for Socket.io
   * @param {string} status - Order status
   * @param {Object} order - Order object
   */
  getStatusMessage(status, order) {
    const messages = {
      pending: 'Order received and being processed',
      confirmed: 'Order confirmed and being prepared',
      preparing: 'Your meal is being prepared by our chefs',
      ready: order.orderType === 'dine-in' 
        ? `Your order is ready! Please wait for table service at Table ${order.tableNumber}`
        : `Your order is ready for pickup! Code: ${order.pickupCode || 'TK' + order._id.slice(-6).toUpperCase()}`,
      delivered: 'Order delivered successfully',
      cancelled: 'Order has been cancelled'
    };

    return messages[status] || 'Order status updated';
  }

  /**
   * Send bulk notifications for multiple orders
   * @param {Array} orders - Array of order objects
   * @param {string} status - Status to notify about
   */
  async sendBulkNotifications(orders, status) {
    const results = [];
    
    for (const order of orders) {
      try {
        const result = await this.sendOrderStatusNotification(order, status);
        results.push({ orderId: order._id, ...result });
      } catch (error) {
        results.push({ 
          orderId: order._id, 
          success: false, 
          error: error.message 
        });
      }
    }
    
    return results;
  }

  /**
   * Test SMS functionality
   * @param {string} phoneNumber - Test phone number
   */
  async testSMS(phoneNumber) {
    const testMessage = `🧪 Test message from VALDOR Restaurant\n\n` +
                       `This is a test to verify SMS functionality.\n` +
                       `Time: ${new Date().toLocaleString()}\n\n` +
                       `If you received this, SMS notifications are working!`;

    return await this.sendSMS(phoneNumber, testMessage);
  }
}

export default new NotificationService();
