import payHereService from '../services/payHereService.js';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import { sendSuccess, handleError } from '../utils/responseFormatter.js';

/**
 * Initiate PayHere payment
 */
export const initiatePayment = async (req, res) => {
  try {
    const { orderId, amount, currency, customerName, customerEmail, customerPhone, items, userId, bookingId } = req.body;

    // Validate required fields
    if (!orderId || !amount || !customerName || !customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment fields'
      });
    }

    // Create payment session
    const paymentSession = payHereService.createPaymentSession({
      orderId,
      amount,
      currency: currency || 'LKR',
      customerName,
      customerEmail,
      customerPhone,
      items,
      custom1: userId, // User ID
      custom2: bookingId, // Booking ID
    });

    // Save payment record
    const payment = new Payment({
      orderId,
      userId,
      bookingId,
      amount,
      currency: currency || 'LKR',
      provider: 'payhere',
      status: 'pending',
      paymentData: paymentSession,
    });

    await payment.save();

    sendSuccess(res, {
      paymentId: payment._id,
      paymentSession,
    }, 'Payment initiated successfully');

  } catch (error) {
    console.error('Payment initiation error:', error);
    handleError(res, error, 'Failed to initiate payment');
  }
};

/**
 * Handle PayHere webhook notifications
 */
export const handleWebhook = async (req, res) => {
  try {
    const notificationData = req.body;

    console.log('PayHere webhook received:', notificationData);

    // Process the notification
    const processedPayment = await payHereService.processPaymentNotification(notificationData);

    // Update payment record
    const payment = await Payment.findOneAndUpdate(
      { orderId: processedPayment.orderId },
      {
        status: processedPayment.status,
        paymentId: processedPayment.paymentId,
        transactionData: processedPayment,
        completedAt: processedPayment.status === 'success' ? new Date() : undefined,
      },
      { new: true }
    );

    if (!payment) {
      console.error('Payment record not found for order:', processedPayment.orderId);
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    // Update booking status if payment successful
    if (processedPayment.status === 'success' && processedPayment.bookingId) {
      await Booking.findByIdAndUpdate(processedPayment.bookingId, {
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentId: payment._id,
      });

      console.log('Booking confirmed:', processedPayment.bookingId);
    }

    // Always respond with success to PayHere
    res.status(200).json({ success: true, message: 'Webhook processed successfully' });

  } catch (error) {
    console.error('Webhook processing error:', error);
    // Still return success to PayHere to prevent retries
    res.status(200).json({ success: true, message: 'Webhook received' });
  }
};

/**
 * Get payment status
 */
export const getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    sendSuccess(res, {
      paymentId: payment._id,
      orderId: payment.orderId,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      createdAt: payment.createdAt,
      completedAt: payment.completedAt,
    }, 'Payment status retrieved successfully');

  } catch (error) {
    console.error('Get payment status error:', error);
    handleError(res, error, 'Failed to get payment status');
  }
};

/**
 * Refund payment via PayHere
 */
export const refundPayment = async (req, res) => {
  try {
    const { paymentId, amount, reason } = req.body;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: 'Only successful payments can be refunded'
      });
    }

    // PayHere refund logic would go here
    // For now, we'll mark as refunded in our system
    payment.status = 'refunded';
    payment.refundedAt = new Date();
    payment.refundReason = reason;
    payment.refundAmount = amount || payment.amount;

    await payment.save();

    // Update booking status
    if (payment.bookingId) {
      await Booking.findByIdAndUpdate(payment.bookingId, {
        status: 'cancelled',
        paymentStatus: 'refunded',
      });
    }

    sendSuccess(res, payment, 'Payment refunded successfully');

  } catch (error) {
    console.error('Payment refund error:', error);
    handleError(res, error, 'Failed to process refund');
  }
};
