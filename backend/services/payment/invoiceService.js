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
        .populate('roomId', 'title basePrice seasonalPricing');

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Check if invoice already exists for this booking
      const existingInvoice = await Invoice.findOne({ bookingId: booking._id });
      if (existingInvoice) {
        throw new Error('Invoice already exists for this booking');
      }

      const settings = await this.getSettings();

      if (booking.status !== 'Pending Approval' &&
          booking.status !== 'Accepted' &&
          booking.status !== 'On Hold' &&
          booking.status !== 'Confirmed' &&
          booking.status !== 'Approved - Payment Pending' &&
          booking.status !== 'Approved - Payment Processing') {
        throw new Error(`Cannot create invoice for booking with status: ${booking.status}`);
      }

      // Calculate amounts from booking cost breakdown
      const subtotal = booking.costBreakdown?.subtotal || booking.totalPrice || 0;
      const taxRate = (settings.financialSettings?.taxRate || 0) / 100;
      const serviceFeeRate = (settings.financialSettings?.serviceFee || 0) / 100;

      const tax = booking.costBreakdown?.tax || (subtotal * taxRate);
      const serviceFee = booking.costBreakdown?.serviceFee || (subtotal * serviceFeeRate);
      const mealPlanCost = booking.costBreakdown?.mealPlanCost || 0;

      // Add any additional charges
      const additionalChargesAmount = Object.values(additionalCharges).reduce((sum, charge) => sum + (charge.amount || 0), 0);
      const finalTotal = subtotal + tax + serviceFee + mealPlanCost + additionalChargesAmount;

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();

      // Create invoice items based on booking breakdown
      const invoiceItems = [];

      // Room cost item
      invoiceItems.push({
        description: `${booking.roomId.title} - ${booking.costBreakdown?.nights || 0} nights`,
        quantity: booking.costBreakdown?.nights || 1,
        unitPrice: booking.costBreakdown?.roomRate || booking.roomId.basePrice || 0,
        amount: booking.costBreakdown?.subtotal || booking.totalPrice || 0,
        type: 'room'
      });

      // Meal plan items
      if (mealPlanCost > 0 && booking.costBreakdown?.mealBreakdown) {
        if (booking.costBreakdown.mealBreakdown.plan) {
          // Standard meal plan
          invoiceItems.push({
            description: `${booking.costBreakdown.mealBreakdown.plan} for ${booking.costBreakdown.mealBreakdown.guests} guests`,
            quantity: booking.costBreakdown.mealBreakdown.nights || 1,
            unitPrice: booking.costBreakdown.mealBreakdown.rate || 0,
            amount: booking.costBreakdown.mealPlanCost || 0,
            type: 'meal_plan'
          });
        } else if (booking.costBreakdown.mealBreakdown.meals) {
          // Individual meals
          booking.costBreakdown.mealBreakdown.meals.forEach(meal => {
            invoiceItems.push({
              description: meal.name,
              quantity: meal.quantity,
              unitPrice: meal.price,
              amount: meal.total,
              type: 'meal'
            });
          });
        }
      }

      // Tax item
      if (tax > 0) {
        invoiceItems.push({
          description: `Tax (${settings.financialSettings?.taxRate || 0}%)`,
          quantity: 1,
          unitPrice: tax,
          amount: tax,
          type: 'tax'
        });
      }

      // Service fee item
      if (serviceFee > 0) {
        invoiceItems.push({
          description: `Service Fee (${settings.financialSettings?.serviceFee || 0}%)`,
          quantity: 1,
          unitPrice: serviceFee,
          amount: serviceFee,
          type: 'service_fee'
        });
      }

      // Additional charges
      Object.entries(additionalCharges).forEach(([key, charge]) => {
        if (charge.amount > 0) {
          invoiceItems.push({
            description: charge.description || key,
            quantity: charge.quantity || 1,
            unitPrice: charge.unitPrice || charge.amount,
            amount: charge.amount,
            type: 'additional'
          });
        }
      });

      // Create invoice
      const invoice = new Invoice({
        bookingId: booking._id,
        userId: booking.userId._id,
        invoiceNumber,
        amount: finalTotal,
        currency: settings.currency || 'LKR',
        taxRate: settings.financialSettings?.taxRate || 0,
        discountApplied: 0, // Could be calculated from booking discounts
        status: booking.status === 'Accepted' || booking.status === 'Confirmed' ? 'Sent - Payment Pending' : 'Draft',
        paymentMethod: booking.paymentMethod === 'card' ? 'Online' : booking.paymentMethod === 'cash' ? 'Cash' : 'Online',
        issuedAt: new Date(),
        items: invoiceItems,
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

      if (invoice.status !== 'Sent - Payment Pending' && invoice.status !== 'Draft') {
        throw new Error(`Invoice is already ${invoice.status}`);
      }

      // Update invoice status based on booking status
      const bookingStatus = invoice.bookingId?.status;
      if (bookingStatus === 'Accepted' || bookingStatus === 'Confirmed' ||
          bookingStatus === 'Approved - Payment Pending' || bookingStatus === 'Approved - Payment Processing') {
        invoice.status = 'Sent - Payment Pending';
        invoice.paymentMethod = invoice.bookingId.paymentMethod === 'card' ? 'Online' : invoice.bookingId.paymentMethod === 'cash' ? 'Cash' : 'Online';
      } else {
        invoice.status = 'Draft';
        invoice.paymentMethod = 'Online';
      }
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

      if (invoice.status === 'Paid') {
        throw new Error('Invoice is already paid');
      }

      // Update invoice
      invoice.status = 'Paid';
      invoice.paymentId = paymentId;
      invoice.transactionId = transactionData.transactionId;
      invoice.paidAt = new Date();
      await invoice.save();

      // Update booking status if linked (remove paymentStatus update since field doesn't exist)
      if (invoice.bookingId) {
        const Booking = (await import("../../models/Booking.js")).default;
        const booking = invoice.bookingId;
        booking.status = 'Confirmed'; // Set to confirmed since payment is completed
        booking.paidAt = new Date();
        await booking.save();
        console.log(`✅ Booking ${booking.bookingNumber} status updated to Confirmed`);
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

      if (invoice.status !== 'Paid') {
        throw new Error('Cannot refund unpaid invoice');
      }

      // Update invoice status
      invoice.status = 'Refunded';
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
        query.status = status; // Filter by consolidated status instead of paymentStatus
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