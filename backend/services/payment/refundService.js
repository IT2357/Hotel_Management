// 📁 backend/services/payment/refundService.js
import RefundRequest from "../../models/RefundRequest.js";
import Booking from "../../models/Booking.js";
import Invoice from "../../models/Invoice.js";
import { User } from "../../models/User.js";
import NotificationService from "../notification/notificationService.js";

class RefundService {
  /**
   * Create refund request for booking rejection/cancellation
   * @param {Object} booking - Booking object
   * @param {string} reason - Reason for refund
   * @param {string} requestedBy - User ID who requested the refund
   * @returns {Object} - Created refund request
   */
  static async createRefundRequest(booking, reason, requestedBy = null) {
    try {
      // Get booking with populated fields
      const populatedBooking = await Booking.findById(booking._id || booking.id)
        .populate('userId')
        .populate('invoiceId');

      if (!populatedBooking) {
        throw new Error('Booking not found');
      }

      // Check if booking has an invoice and that it's paid
      if (!populatedBooking.invoiceId) {
        console.log('No invoice found for booking, skipping refund creation');
        return null;
      }

      // Only create refunds for paid invoices (pay-at-hotel flow)
      const invoiceDoc = populatedBooking.invoiceId;
      if (!invoiceDoc || invoiceDoc.status !== 'Paid') {
        console.log(`Invoice not paid (status: ${invoiceDoc?.status}). Skipping refund creation for booking ${populatedBooking.bookingNumber}`);
        return null;
      }

      // Check if refund already exists for this booking
      const existingRefund = await RefundRequest.findOne({
        bookingId: populatedBooking._id
      });

      if (existingRefund) {
        console.log('Refund request already exists for this booking');
        return existingRefund;
      }

      // Calculate refund amount based on booking status and policy
  const refundAmount = await this.calculateRefundAmount(populatedBooking, requestedBy);

      if (refundAmount < 0) {
        console.log('Negative refund amount calculated, skipping refund creation');
        return null;
      }

      // Create refund request
      const refundRequest = new RefundRequest({
        bookingId: populatedBooking._id,
        guestId: populatedBooking.userId._id,
        invoiceId: populatedBooking.invoiceId._id,
        amount: refundAmount,
        currency: 'LKR', // Tailored for Sri Lankan site
        reason: reason || 'Booking rejected/cancelled',
        paymentGatewayRef: populatedBooking.invoiceId.paymentGatewayRef,
        status: 'pending',
        evidence: []
      });

      await refundRequest.save();

      // Send notification to guest about refund request
      await NotificationService.sendNotification({
        userId: populatedBooking.userId._id,
        userType: populatedBooking.userId.role,
        type: 'refund_initiated',
        title: 'Refund Request Initiated',
        message: `A refund request has been created for your booking ${populatedBooking.bookingNumber}. Amount: ${refundRequest.amount} ${refundRequest.currency}`,
        channel: 'email',
        metadata: {
          bookingId: populatedBooking._id,
          bookingNumber: populatedBooking.bookingNumber,
          refundAmount: refundRequest.amount,
          refundCurrency: refundRequest.currency,
          reason: reason
        }
      });

      console.log(`✅ Refund request created successfully for booking ${populatedBooking.bookingNumber}`);
      return refundRequest;

    } catch (error) {
      console.error('❌ Error creating refund request:', error);
      throw error;
    }
  }

  /**
   * Calculate refund amount based on booking and admin settings
   * @param {Object} booking - Booking object
   * @returns {number} - Calculated refund amount
   */
  static async calculateRefundAmount(booking, requestedBy = null) {
    try {
      // Get admin settings for refund policy
      const AdminSettings = (await import("../../models/AdminSettings.js")).default;
      const settings = await AdminSettings.findOne();

      if (!settings) {
        console.warn('No admin settings found, using default refund policy');
      }

      let refundPercentage = 100; // Default full refund

      // For guest-initiated refunds, always give full refund
      const isGuestRequest = requestedBy && requestedBy.toString() === booking.userId.toString();
      if (!isGuestRequest) {
        // Admin-initiated: apply time-based policy
        const now = new Date();
        const checkInDate = new Date(booking.checkIn);
        const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60);

        // Refund policy based on time until check-in
        if (hoursUntilCheckIn < 24) {
          // Less than 24 hours - no refund
          refundPercentage = 0;
        } else if (hoursUntilCheckIn < 48) {
          // Less than 48 hours - 50% refund
          refundPercentage = 50;
        } else if (hoursUntilCheckIn < 72) {
          // Less than 72 hours - 75% refund
          refundPercentage = 75;
        }
      }

      // Apply admin refund policy if set (only for admin-initiated refunds)
      if (!isGuestRequest) {
        if (settings?.financialSettings?.refundPolicy === 'partial') {
          refundPercentage = Math.min(refundPercentage, 80); // Max 80% for partial policy
        } else if (settings?.financialSettings?.refundPolicy === 'none') {
          refundPercentage = 0; // No refunds
        }
      }

      const refundAmount = (booking.totalPrice * refundPercentage) / 100;

      // Deduct any applicable fees
      const processingFee = settings?.financialSettings?.lateFeeAmount || 0;
      const finalAmount = Math.max(0, refundAmount - processingFee);

      console.log(`Calculated refund amount: ${finalAmount} (${refundPercentage}% of ${booking.totalPrice})`);
      return finalAmount;

    } catch (error) {
      console.error('Error calculating refund amount:', error);
      return 0;
    }
  }

  /**
   * Get all refund requests with filtering
   * @param {Object} filters - Filter criteria
   * @returns {Array} - Refund requests
   */
  static async getRefundRequests(filters = {}) {
    try {
      let query = {};

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
      }

      if (filters.search) {
        // Search across multiple fields
        const searchRegex = new RegExp(filters.search, 'i');

        // Find users matching the search term
        const users = await User.find({
          $or: [
            { name: { $regex: filters.search, $options: 'i' } },
            { email: { $regex: filters.search, $options: 'i' } }
          ]
        }).select('_id');

        query.$or = [
          { paymentGatewayRef: { $regex: filters.search, $options: 'i' } },
          { reason: { $regex: filters.search, $options: 'i' } },
          { 'bookingId.bookingNumber': { $regex: filters.search, $options: 'i' } },
          { guestId: { $in: users.map(u => u._id) } }
        ];
      }

      const refundRequests = await RefundRequest.find(query)
        .populate('bookingId', 'bookingNumber checkIn checkOut totalPrice')
        .populate('guestId', 'name email')
        .populate('invoiceId', 'invoiceNumber status paymentMethod')
        .populate('approvedBy', 'name')
        .populate('deniedBy', 'name')
        .populate('infoRequestedBy', 'name')
        .sort({ createdAt: -1 });

      return refundRequests;

    } catch (error) {
      console.error('Error fetching refund requests:', error);
      throw error;
    }
  }

  /**
   * Approve refund request
   * @param {string} refundId - Refund request ID
   * @param {string} adminId - Admin who approved
   * @returns {Object} - Updated refund request
   */
  static async approveRefund(refundId, adminId) {
    try {
      const refund = await RefundRequest.findById(refundId)
        .populate('bookingId')
        .populate('guestId');

      if (!refund) {
        throw new Error('Refund request not found');
      }

      if (refund.status !== 'pending') {
        throw new Error(`Refund is already ${refund.status}`);
      }

      refund.status = 'approved';
      refund.approvedBy = adminId;
      refund.approvedAt = new Date();

      await refund.save();

      // Send notification to guest
      await NotificationService.sendNotification({
        userId: refund.guestId._id,
        userType: refund.guestId.role,
        type: 'refund_approved',
        title: 'Refund Approved',
        message: `Your refund request for booking ${refund.bookingId.bookingNumber} has been approved. Amount: ${refund.amount} ${refund.currency}`,
        channel: 'email',
        metadata: {
          bookingId: refund.bookingId._id,
          bookingNumber: refund.bookingId.bookingNumber,
          refundAmount: refund.amount,
          refundCurrency: refund.currency
        }
      });

      return refund;

    } catch (error) {
      console.error('Error approving refund:', error);
      throw error;
    }
  }

  /**
   * Deny refund request
   * @param {string} refundId - Refund request ID
   * @param {string} adminId - Admin who denied
   * @param {string} reason - Denial reason
   * @returns {Object} - Updated refund request
   */
  static async denyRefund(refundId, adminId, reason) {
    try {
      const refund = await RefundRequest.findById(refundId)
        .populate('bookingId')
        .populate('guestId');

      if (!refund) {
        throw new Error('Refund request not found');
      }

      if (refund.status !== 'pending') {
        throw new Error(`Refund is already ${refund.status}`);
      }

      refund.status = 'denied';
      refund.deniedBy = adminId;
      refund.deniedAt = new Date();
      refund.denialReason = reason;

      await refund.save();

      // Send notification to guest
      await NotificationService.sendNotification({
        userId: refund.guestId._id,
        userType: refund.guestId.role,
        type: 'refund_denied',
        title: 'Refund Denied',
        message: `Your refund request for booking ${refund.bookingId.bookingNumber} has been denied. Reason: ${reason}`,
        channel: 'email',
        metadata: {
          bookingId: refund.bookingId._id,
          bookingNumber: refund.bookingId.bookingNumber,
          denialReason: reason
        }
      });

      return refund;

    } catch (error) {
      console.error('Error denying refund:', error);
      throw error;
    }
  }
}

export default RefundService;
