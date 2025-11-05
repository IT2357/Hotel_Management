import smsService from '../services/smsService.js';
import SMSTemplate from '../models/SMSTemplate.js';
import SMSLog from '../models/SMSLog.js';
import { sendSuccess, handleError } from '../utils/responseFormatter.js';

/**
 * Send SMS using template
 */
export const sendSMSTemplate = async (req, res) => {
  try {
    const { templateType, phoneNumber, data, language = 'en' } = req.body;

    // Get template
    const template = await SMSTemplate.getTemplateByType(templateType, language);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'SMS template not found'
      });
    }

    // Render message content
    const message = template.render(data);

    // Send SMS
    const result = await smsService.sendSMS(phoneNumber, message, {
      senderId: template.senderId
    });

    // Log SMS delivery
    await SMSLog.create({
      templateId: template._id,
      templateType,
      to: phoneNumber,
      message,
      provider: result.provider,
      messageId: result.messageId,
      status: result.status,
      sentBy: req.user?.id,
      metadata: data,
    });

    sendSuccess(res, {
      messageId: result.messageId,
      status: result.status,
      template: template.name
    }, 'SMS sent successfully');

  } catch (error) {
    console.error('Send SMS template error:', error);
    handleError(res, error, 'Failed to send SMS');
  }
};

/**
 * Send booking confirmation SMS
 */
export const sendBookingConfirmationSMS = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Get booking details (this would normally come from a service)
    const bookingData = {
      guestName: 'John Doe',
      bookingNumber: 'BK001',
      checkInDate: '2025-01-15',
      checkOutDate: '2025-01-17',
      currency: 'LKR',
      totalAmount: '25000',
      hotelName: 'Grand Hotel Colombo'
    };

    // Get guest phone number
    const guestPhone = '+94771234567'; // This would come from booking/guest data

    const result = await smsService.sendBookingConfirmation(guestPhone, bookingData);

    // Log the SMS
    await SMSLog.create({
      templateType: 'booking_confirmation',
      to: guestPhone,
      message: `Booking confirmation SMS sent to ${guestPhone}`,
      provider: result.provider,
      messageId: result.messageId,
      status: result.status,
      sentBy: req.user?.id,
      metadata: { bookingId },
    });

    sendSuccess(res, result, 'Booking confirmation SMS sent successfully');

  } catch (error) {
    console.error('Booking confirmation SMS error:', error);
    handleError(res, error, 'Failed to send booking confirmation SMS');
  }
};

/**
 * Send payment confirmation SMS
 */
export const sendPaymentConfirmationSMS = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const paymentData = {
      currency: 'LKR',
      amount: '25000',
      bookingNumber: 'BK001'
    };

    const guestPhone = '+94771234567';

    const result = await smsService.sendPaymentConfirmation(guestPhone, paymentData);

    await SMSLog.create({
      templateType: 'payment_confirmation',
      to: guestPhone,
      message: `Payment confirmation SMS sent to ${guestPhone}`,
      provider: result.provider,
      messageId: result.messageId,
      status: result.status,
      sentBy: req.user?.id,
      metadata: { paymentId },
    });

    sendSuccess(res, result, 'Payment confirmation SMS sent successfully');

  } catch (error) {
    console.error('Payment confirmation SMS error:', error);
    handleError(res, error, 'Failed to send payment confirmation SMS');
  }
};

/**
 * Send check-in reminder SMS
 */
export const sendCheckInReminderSMS = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const bookingData = {
      guestName: 'John Doe',
      bookingNumber: 'BK001',
      hotelName: 'Grand Hotel Colombo'
    };

    const guestPhone = '+94771234567';

    const result = await smsService.sendCheckInReminder(guestPhone, bookingData);

    await SMSLog.create({
      templateType: 'checkin_reminder',
      to: guestPhone,
      message: `Check-in reminder SMS sent to ${guestPhone}`,
      provider: result.provider,
      messageId: result.messageId,
      status: result.status,
      sentBy: req.user?.id,
      metadata: { bookingId },
    });

    sendSuccess(res, result, 'Check-in reminder SMS sent successfully');

  } catch (error) {
    console.error('Check-in reminder SMS error:', error);
    handleError(res, error, 'Failed to send check-in reminder SMS');
  }
};

/**
 * Test SMS configuration
 */
export const testSMSConfig = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const result = await smsService.testConfiguration(phoneNumber);

    // Log test SMS
    await SMSLog.create({
      templateType: 'test_sms',
      to: phoneNumber,
      message: `Test SMS sent to ${phoneNumber}`,
      provider: result.provider,
      messageId: result.messageId,
      status: result.status,
      sentBy: req.user?.id,
    });

    sendSuccess(res, result, 'Test SMS sent successfully');

  } catch (error) {
    console.error('Test SMS error:', error);
    handleError(res, error, 'Failed to send test SMS');
  }
};

/**
 * Get SMS templates
 */
export const getSMSTemplates = async (req, res) => {
  try {
    const { type, language = 'en' } = req.query;

    const templates = await SMSTemplate.getActiveTemplates(type, language);

    sendSuccess(res, templates, 'SMS templates retrieved successfully');

  } catch (error) {
    console.error('Get SMS templates error:', error);
    handleError(res, error, 'Failed to get SMS templates');
  }
};

/**
 * Create SMS template
 */
export const createSMSTemplate = async (req, res) => {
  try {
    const templateData = req.body;

    const template = new SMSTemplate(templateData);
    await template.save();

    sendSuccess(res, template, 'SMS template created successfully');

  } catch (error) {
    console.error('Create SMS template error:', error);
    handleError(res, error, 'Failed to create SMS template');
  }
};

/**
 * Update SMS template
 */
export const updateSMSTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const updateData = req.body;

    const template = await SMSTemplate.findByIdAndUpdate(
      templateId,
      updateData,
      { new: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'SMS template not found'
      });
    }

    sendSuccess(res, template, 'SMS template updated successfully');

  } catch (error) {
    console.error('Update SMS template error:', error);
    handleError(res, error, 'Failed to update SMS template');
  }
};

/**
 * Get SMS delivery logs
 */
export const getSMSDeliveryLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, provider } = req.query;

    const query = {};
    if (status) query.status = status;
    if (provider) query.provider = provider;

    const logs = await SMSLog.find(query)
      .populate('sentBy', 'name email')
      .populate('templateId', 'name type')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SMSLog.countDocuments(query);

    sendSuccess(res, {
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'SMS delivery logs retrieved successfully');

  } catch (error) {
    console.error('Get SMS delivery logs error:', error);
    handleError(res, error, 'Failed to get SMS delivery logs');
  }
};
