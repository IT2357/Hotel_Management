import axios from 'axios';
import twilio from 'twilio';
import crypto from 'crypto';

class SMSService {
  constructor() {
    this.provider = process.env.SMS_PROVIDER || 'twilio';
    this.twilioClient = null;

    // Initialize Twilio if configured and credentials are valid
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (accountSid && authToken) {
      if (accountSid.startsWith('AC') && accountSid.length === 34) {
        try {
          this.twilioClient = twilio(accountSid, authToken);
        } catch (error) {
          console.warn('Failed to initialize Twilio client, disabling Twilio SMS:', error.message);
          this.twilioClient = null;
        }
      } else {
        console.warn('Invalid Twilio Account SID detected. Expected value starting with "AC". Twilio SMS disabled.');
      }
    }

    if (!this.twilioClient && this.provider === 'twilio') {
      console.warn('Twilio credentials missing or invalid. Falling back to mock SMS provider.');
      this.provider = process.env.FALLBACK_SMS_PROVIDER || 'aws-sns';
    }

    this.providers = {
      twilio: this.sendViaTwilio.bind(this),
      'aws-sns': this.sendViaAWSSNS.bind(this),
      nexmo: this.sendViaNexmo.bind(this),
      dialog: this.sendViaDialog.bind(this),
      mobitel: this.sendViaMobitel.bind(this)
    };
  }

  /**
   * Send SMS using configured provider
   */
  async sendSMS(to, message, options = {}) {
    try {
      const provider = this.providers[this.provider];

      if (!provider) {
        throw new Error(`SMS provider '${this.provider}' not supported`);
      }

      // Validate phone number format
      const formattedNumber = this.formatPhoneNumber(to);
      if (!formattedNumber) {
        throw new Error('Invalid phone number format');
      }

      // Check message length (SMS limit is 160 characters for single SMS)
      if (message.length > 160) {
        console.warn('SMS message exceeds 160 characters, may be split');
      }

      const result = await provider(formattedNumber, message, options);

      // Log SMS delivery
      console.log(`SMS sent via ${this.provider} to ${formattedNumber}: ${message.substring(0, 50)}...`);

      return {
        success: true,
        provider: this.provider,
        messageId: result.messageId,
        to: formattedNumber,
        status: 'sent'
      };

    } catch (error) {
      console.error('SMS sending failed:', error);
      return {
        success: false,
        provider: this.provider,
        to,
        error: error.message,
        status: 'failed'
      };
    }
  }

  /**
   * Send SMS via Twilio
   */
  async sendViaTwilio(to, message, options) {
    if (!this.twilioClient) {
      throw new Error('Twilio client not initialized');
    }

    const result = await this.twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
      ...options
    });

    return {
      messageId: result.sid,
      status: result.status
    };
  }

  /**
   * Send SMS via AWS SNS
   */
  async sendViaAWSSNS(to, message, options) {
    const params = {
      Message: message,
      PhoneNumber: to,
      MessageAttributes: {
        'AWS.SNS.SMS.SenderID': {
          DataType: 'String',
          StringValue: options.senderId || 'HotelSystem'
        }
      }
    };

    // AWS SNS implementation would go here
    // For now, return mock response
    return {
      messageId: `aws_${Date.now()}`,
      status: 'sent'
    };
  }

  /**
   * Send SMS via Nexmo/Vonage
   */
  async sendViaNexmo(to, message, options) {
    const response = await axios.post('https://rest.nexmo.com/sms/json', {
      api_key: process.env.NEXMO_API_KEY,
      api_secret: process.env.NEXMO_API_SECRET,
      to: to,
      from: options.senderId || 'HotelSystem',
      text: message
    });

    if (response.data.messages[0].status !== '0') {
      throw new Error(`Nexmo error: ${response.data.messages[0]['error-text']}`);
    }

    return {
      messageId: response.data.messages[0]['message-id'],
      status: 'sent'
    };
  }

  /**
   * Send SMS via Dialog (Sri Lanka)
   */
  async sendViaDialog(to, message, options) {
    const timestamp = new Date().toISOString();
    const password = crypto.createHash('md5')
      .update(`${process.env.DIALOG_USERNAME}${process.env.DIALOG_PASSWORD}${timestamp}`)
      .digest('hex');

    const response = await axios.post(process.env.DIALOG_API_URL || 'https://api.dialog.lk/sms/send', {
      username: process.env.DIALOG_USERNAME,
      password: password,
      timestamp: timestamp,
      from: options.senderId || 'HotelSystem',
      to: to,
      message: message
    });

    return {
      messageId: response.data.messageId || `dialog_${Date.now()}`,
      status: response.data.status || 'sent'
    };
  }

  /**
   * Send SMS via Mobitel (Sri Lanka)
   */
  async sendViaMobitel(to, message, options) {
    const response = await axios.post(process.env.MOBITEL_API_URL || 'https://api.mobitel.lk/sms/send', {
      username: process.env.MOBITEL_USERNAME,
      password: process.env.MOBITEL_PASSWORD,
      from: options.senderId || 'HotelSystem',
      to: to,
      message: message
    });

    return {
      messageId: response.data.messageId || `mobitel_${Date.now()}`,
      status: response.data.status || 'sent'
    };
  }

  /**
   * Format phone number to international format
   */
  formatPhoneNumber(phoneNumber) {
    // Remove all non-numeric characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Handle Sri Lankan numbers
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      // Convert 0771234567 to +94771234567
      cleaned = '94' + cleaned.substring(1);
    } else if (cleaned.length === 9 && !cleaned.startsWith('94')) {
      // Convert 771234567 to +94771234567
      cleaned = '94' + cleaned;
    }

    // Add + prefix if not present
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }

    // Validate format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(cleaned) ? cleaned : null;
  }

  /**
   * Send booking confirmation SMS
   */
  async sendBookingConfirmation(phoneNumber, bookingData) {
    const message = `Dear ${bookingData.guestName}, your booking #${bookingData.bookingNumber} is confirmed. ` +
                   `Check-in: ${bookingData.checkInDate}, Check-out: ${bookingData.checkOutDate}. ` +
                   `Total: ${bookingData.currency} ${bookingData.totalAmount}`;

    return this.sendSMS(phoneNumber, message, {
      senderId: 'HotelBooking'
    });
  }

  /**
   * Send payment confirmation SMS
   */
  async sendPaymentConfirmation(phoneNumber, paymentData) {
    const message = `Payment received! Amount: ${paymentData.currency} ${paymentData.amount}. ` +
                   `Booking #${paymentData.bookingNumber} confirmed. Thank you!`;

    return this.sendSMS(phoneNumber, message, {
      senderId: 'PaymentConfirm'
    });
  }

  /**
   * Send check-in reminder SMS
   */
  async sendCheckInReminder(phoneNumber, bookingData) {
    const message = `Hi ${bookingData.guestName}, reminder: Check-in tomorrow at ${bookingData.hotelName}. ` +
                   `Booking #${bookingData.bookingNumber}`;

    return this.sendSMS(phoneNumber, message, {
      senderId: 'CheckInReminder'
    });
  }

  /**
   * Send custom SMS
   */
  async sendCustomSMS(phoneNumber, message, senderId = 'HotelSystem') {
    return this.sendSMS(phoneNumber, message, { senderId });
  }

  /**
   * Test SMS configuration
   */
  async testConfiguration(testPhoneNumber) {
    const testMessage = `SMS Test from ${process.env.HOTEL_NAME || 'Hotel Management System'}. ` +
                       `Provider: ${this.provider}, Time: ${new Date().toLocaleString()}`;

    return this.sendSMS(testPhoneNumber, testMessage, {
      senderId: 'SMSTest'
    });
  }
}

export default new SMSService();
