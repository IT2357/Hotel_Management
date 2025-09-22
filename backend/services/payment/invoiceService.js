// 📁 backend/services/payment/invoiceService.js
import Invoice from "../../models/Invoice.js";
import Booking from "../../models/Booking.js";
import { User } from "../../models/User.js";
import AdminSettings from "../../models/AdminSettings.js";
import NotificationService from "../notification/notificationService.js";

class InvoiceService {
  constructor() {
    this.settingsCache = null;
    this.settingsCacheTime = 0;
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  // Get cached settings
  async getSettings() {
    const now = Date.now();
    if (!this.settingsCache || (now - this.settingsCacheTime) > this.CACHE_DURATION) {
      try {
        this.settingsCache = await AdminSettings.findOne().lean();
        this.settingsCacheTime = now;
      } catch (error) {
        console.error("Failed to fetch settings for invoice:", error);
        // Use defaults if database fails
        this.settingsCache = {
          currency: 'LKR',
          financialSettings: {
            taxRate: 0,
            serviceFee: 0,
            invoicePrefix: 'INV',
            invoiceNumbering: 'sequential'
          }
        };
      }
    }
    return this.settingsCache;
  }

  // Generate invoice number
  async generateInvoiceNumber() {
    const settings = await this.getSettings();
    const prefix = settings.financialSettings?.invoicePrefix || 'INV';
    const numbering = settings.financialSettings?.invoiceNumbering || 'sequential';

    if (numbering === 'random') {
      return `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    } else if (numbering === 'date-based') {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      return `${prefix}${dateStr}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    } else {
      // Sequential numbering
      const lastInvoice = await Invoice.findOne({}, {}, { sort: { 'createdAt': -1 } });
      const lastNumber = lastInvoice?.invoiceNumber ?
        parseInt(lastInvoice.invoiceNumber.replace(/\D/g, '')) || 0 : 0;
      return `${prefix}${String(lastNumber + 1).padStart(6, '0')}`;
    }
  }

  // Create invoice from booking
  async createInvoiceFromBooking(bookingId, additionalCharges = {}) {
    try {
      const booking = await Booking.findById(bookingId)
        .populate('userId', 'name email')
        .populate('roomId', 'title basePrice');

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.status !== 'Pending Approval' && booking.status !== 'Confirmed') {
        throw new Error(`Cannot create invoice for booking with status: ${booking.status}`);
      }

      const settings = await this.getSettings();

      // Calculate amounts
      const subtotal = booking.totalPrice || booking.costBreakdown?.total || 0;
      const taxRate = (settings.financialSettings?.taxRate || 0) / 100;
      const serviceFeeRate = (settings.financialSettings?.serviceFee || 0) / 100;

      const tax = subtotal * taxRate;
      const serviceFee = subtotal * serviceFeeRate;
      const total = subtotal + tax + serviceFee;

      // Add any additional charges
      const additionalChargesAmount = Object.values(additionalCharges).reduce((sum, charge) => sum + (charge.amount || 0), 0);
      const finalTotal = total + additionalChargesAmount;

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();

      // Create invoice
      const invoice = new Invoice({
        bookingId: booking._id,
        userId: booking.userId._id,
        invoiceNumber,
        amount: finalTotal,
        currency: settings.currency || 'LKR',
        taxRate: settings.financialSettings?.taxRate || 0,
        discountApplied: 0, // Could be calculated from booking discounts
        paymentStatus: 'Pending',
        paymentMethod: 'Online', // Default, can be changed during payment
        issuedAt: new Date(),
        // Additional charges breakdown
        additionalCharges: Object.keys(additionalCharges).length > 0 ? additionalCharges : undefined
      });

      await invoice.save();

      // Update booking with invoice reference
      booking.invoiceId = invoice._id;
      await booking.save();

      return invoice;

    } catch (error) {
      console.error('Error creating invoice from booking:', error);
      throw error;
    }
  }

  // Finalize invoice (mark as ready for payment)
  async finalizeInvoice(invoiceId, paymentMethod = 'Online') {
    try {
      const invoice = await Invoice.findById(invoiceId)
        .populate('bookingId')
        .populate('userId', 'name email');

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.paymentStatus !== 'Pending') {
        throw new Error(`Invoice is already ${invoice.paymentStatus}`);
      }

      // Update invoice status
      invoice.paymentStatus = 'Pending Payment';
      invoice.paymentMethod = paymentMethod;
      await invoice.save();

      // Send invoice ready notification
      await NotificationService.sendNotification({
        userId: invoice.userId._id,
        userType: invoice.userId.role,
        type: 'invoice_ready',
        title: 'Invoice Ready for Payment',
        message: `Your invoice ${invoice.invoiceNumber} is ready for payment. Total amount: ${invoice.currency} ${invoice.amount.toFixed(2)}`,
        channel: 'email',
        metadata: {
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
          currency: invoice.currency,
          bookingId: invoice.bookingId._id,
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
        }
      });

      return invoice;

    } catch (error) {
      console.error('Error finalizing invoice:', error);
      throw error;
    }
  }

  // Mark invoice as paid
  async markInvoiceAsPaid(invoiceId, paymentId, transactionData = {}) {
    try {
      const invoice = await Invoice.findById(invoiceId)
        .populate('bookingId')
        .populate('userId', 'name email');

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.paymentStatus === 'Paid') {
        throw new Error('Invoice is already paid');
      }

      // Update invoice
      invoice.paymentStatus = 'Paid';
      invoice.paymentId = paymentId;
      invoice.transactionId = transactionData.transactionId;
      invoice.paidAt = new Date();
      await invoice.save();

      // Update booking status if linked
      if (invoice.bookingId) {
        const booking = invoice.bookingId;
        if (booking.status === 'Pending Approval') {
          // Move to On Hold for admin approval
          booking.status = 'On Hold';
          booking.holdUntil = new Date(Date.now() + 60 * 60 * 1000); // 1 hour hold
          booking.lastStatusChange = new Date();
          await booking.save();

          // Notify admin for approval
          await this.notifyAdminForApproval(booking, invoice);
        }
      }

      // Send payment confirmation
      await NotificationService.sendNotification({
        userId: invoice.userId._id,
        userType: invoice.userId.role,
        type: 'payment_confirmed',
        title: 'Payment Confirmed',
        message: `Payment for invoice ${invoice.invoiceNumber} has been confirmed. Amount: ${invoice.currency} ${invoice.amount.toFixed(2)}`,
        channel: 'email',
        metadata: {
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
          currency: invoice.currency,
          paymentId: paymentId,
          transactionId: transactionData.transactionId
        }
      });

      return invoice;

    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      throw error;
    }
  }

  // Process refund for invoice
  async processInvoiceRefund(invoiceId, refundAmount, reason = '') {
    try {
      const invoice = await Invoice.findById(invoiceId)
        .populate('bookingId')
        .populate('userId', 'name email');

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.paymentStatus !== 'Paid') {
        throw new Error('Cannot refund unpaid invoice');
      }

      // Update invoice status
      invoice.paymentStatus = 'Refunded';
      await invoice.save();

      // Send refund notification
      await NotificationService.sendNotification({
        userId: invoice.userId._id,
        userType: invoice.userId.role,
        type: 'refund_processed',
        title: 'Refund Processed',
        message: `Refund for invoice ${invoice.invoiceNumber} has been processed. Amount: ${invoice.currency} ${refundAmount.toFixed(2)}`,
        channel: 'email',
        metadata: {
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          refundAmount,
          currency: invoice.currency,
          reason,
          originalAmount: invoice.amount
        }
      });

      return invoice;

    } catch (error) {
      console.error('Error processing invoice refund:', error);
      throw error;
    }
  }

  // Notify admin for booking approval
  async notifyAdminForApproval(booking, invoice) {
    try {
      const settings = await this.getSettings();
      if (!settings.adminNotifications) return;

      const User = (await import("../../models/User.js")).default;
      const admins = await User.find({ role: 'admin', isActive: true });

      for (const admin of admins) {
        await NotificationService.sendNotification({
          userId: admin._id,
          userType: 'admin',
          type: 'booking_payment_approval_required',
          title: 'Booking Payment Received - Approval Required',
          message: `Payment received for booking from ${booking.userId.name}. Invoice: ${invoice.invoiceNumber}. Please review and approve.`,
          channel: 'email',
          metadata: {
            bookingId: booking._id,
            invoiceId: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            guestName: booking.userId.name,
            amount: invoice.amount,
            currency: invoice.currency
          }
        });
      }

    } catch (error) {
      console.error('Error notifying admin for approval:', error);
    }
  }

  // Get invoice details
  async getInvoiceDetails(invoiceId) {
    try {
      const invoice = await Invoice.findById(invoiceId)
        .populate('bookingId')
        .populate('userId', 'name email')
        .populate('paymentId');

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      return invoice;

    } catch (error) {
      console.error('Error getting invoice details:', error);
      throw error;
    }
  }

  // Get user's invoices
  async getUserInvoices(userId, filters = {}) {
    try {
      const { status, page = 1, limit = 10 } = filters;
      const query = { userId };

      if (status) {
        query.paymentStatus = status;
      }

      const invoices = await Invoice.find(query)
        .populate('bookingId', 'checkIn checkOut roomId')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Invoice.countDocuments(query);

      return {
        invoices,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalInvoices: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };

    } catch (error) {
      console.error('Error getting user invoices:', error);
      throw error;
    }
  }

  // Clear settings cache
  clearSettingsCache() {
    this.settingsCache = null;
    this.settingsCacheTime = 0;
  }
}

export default new InvoiceService();