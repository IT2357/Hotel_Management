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
    // Default to timestamp+random for better uniqueness and to match requested format
    const numbering = settings.financialSettings?.invoiceNumbering || 'timestamp-random';

    if (numbering === 'random' || numbering === 'timestamp-random') {
      // Format: INV<ms><4 uppercase letters>, e.g., INV1761243005307EIRR
      return `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
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

  // Fallback generator with entropy to avoid duplicates under concurrency
  async generateInvoiceNumberFallback() {
    const settings = await this.getSettings();
    const prefix = settings.financialSettings?.invoicePrefix || 'INV';
    const now = Date.now();
    const rand = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${prefix}${now}${rand}`;
  }

  // Create invoice from booking
  async createInvoiceFromBooking(bookingId, additionalCharges = {}) {
    try {
      console.log(`📄 [INVOICE-SERVICE] createInvoiceFromBooking called with bookingId: ${bookingId}`);
      
      const booking = await Booking.findById(bookingId)
        .populate('userId', 'name email')
        .populate('roomId', 'title basePrice seasonalPricing');

      console.log(`📄 [INVOICE-SERVICE] Booking found: ${booking ? 'Yes' : 'No'}`);
      
      if (!booking) {
        console.error(`❌ [INVOICE-SERVICE] Booking not found with ID: ${bookingId}`);
        throw new Error('Booking not found');
      }

      console.log(`📄 [INVOICE-SERVICE] Booking status: ${booking.status}, Number: ${booking.bookingNumber}`);

      // Check if invoice already exists for this booking
      const existingInvoice = await Invoice.findOne({ bookingId: booking._id });
      
      console.log(`📄 [INVOICE-SERVICE] Existing invoice check: ${existingInvoice ? 'Found' : 'None'}`);
      
      if (existingInvoice) {
        console.error(`❌ [INVOICE-SERVICE] Invoice already exists: ${existingInvoice.invoiceNumber} (ID: ${existingInvoice._id})`);
        throw new Error('Invoice already exists for this booking');
      }

      const settings = await this.getSettings();
      console.log(`📄 [INVOICE-SERVICE] Settings loaded, currency: ${settings.currency || 'LKR'}`);

      // ✅ REMOVED STATUS RESTRICTION - Allow invoice creation for ALL booking statuses
      // This is essential for check-in/out flow to work properly
      // Invoices are needed at every stage of the booking lifecycle

  // Calculate amounts from booking cost breakdown
  // Use booking's own breakdown as the source of truth (prevents double-counting)
  const cb = booking.costBreakdown || {};
  const nights = booking.nights || cb.nights || 0;
  const roomRate = booking.roomBasePrice || cb.roomRate || 0;
  const mealPlanCost = typeof cb.mealPlanCost === 'number' ? cb.mealPlanCost : 0;
  // If subtotal present, it already includes meals; otherwise compute fallback
  const subtotal = typeof cb.subtotal === 'number' ? cb.subtotal : ((nights * roomRate) + mealPlanCost);
      
  // Prefer explicit tax/service from booking; otherwise compute using settings
  const taxRate = (settings.financialSettings?.taxRate || 0) / 100;
  const serviceFeeRate = (settings.financialSettings?.serviceFee || 0) / 100;
  const tax = typeof cb.tax === 'number' ? cb.tax : (subtotal * taxRate);
  const serviceFee = typeof cb.serviceFee === 'number' ? cb.serviceFee : (subtotal * serviceFeeRate);
      
  // Final total: if booking provided, use it; else compute
  const baseTotal = typeof cb.total === 'number' ? cb.total : (subtotal + tax + serviceFee);
      
  // Use booking's currency, not settings currency
  const bookingCurrency = cb.currency || 'LKR';

      console.log(`📄 [INVOICE-SERVICE] Calculated amounts - Nights: ${nights}, RoomRate: ${roomRate}, Subtotal: ${subtotal}, Tax: ${tax}, Service: ${serviceFee}, Meals: ${mealPlanCost}, Currency: ${bookingCurrency}`);

  // Add any additional charges on top of the base total
  const additionalChargesAmount = Object.values(additionalCharges).reduce((sum, charge) => sum + (charge.amount || 0), 0);
  const finalTotal = baseTotal + additionalChargesAmount;

      // Generate invoice number
      let invoiceNumber = await this.generateInvoiceNumber();

      // Create invoice items based on booking breakdown
      const invoiceItems = [];

      // ✅ Room cost item with correct amount calculation
      const roomAmount = nights * roomRate;
      invoiceItems.push({
        description: `${booking.roomId.title} - ${nights} night${nights !== 1 ? 's' : ''}`,
        quantity: nights,
        unitPrice: roomRate,
        amount: roomAmount, // ✅ FIX: Use calculated amount, not subtotal
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

      // ✅ Set invoice status based on booking status for proper workflow
      // Draft: For bookings pending approval or on hold
      // Sent - Payment Pending: For approved bookings awaiting payment
      // Paid: For completed payments (handled elsewhere)
      let invoiceStatus = 'Draft'; // Default status
      
      if (booking.status === 'Confirmed' || booking.status === 'Checked In' || booking.status === 'Checked Out') {
        // Confirmed bookings should show invoice as ready for payment
        invoiceStatus = 'Sent - Payment Pending';
      } else if (booking.status === 'Approved - Payment Pending') {
        // Approved bookings awaiting payment
        invoiceStatus = 'Sent - Payment Pending';
      } else if (booking.status === 'Approved - Payment Processing') {
        // Payment is being processed
        invoiceStatus = 'Sent - Payment Pending';
      } else if (booking.status === 'Accepted') {
        // Old status that means approved
        invoiceStatus = 'Sent - Payment Pending';
      } else if (booking.status === 'Completed') {
        // Completed bookings should have paid invoices
        invoiceStatus = 'Paid';
      } else {
        // Pending Approval, On Hold, Rejected, Cancelled, etc.
        invoiceStatus = 'Draft';
      }

      console.log(`📋 Creating invoice with status "${invoiceStatus}" for booking status "${booking.status}"`);

      // Map booking payment method to invoice schema enum
      const mapPaymentMethod = (pm) => {
        switch ((pm || '').toLowerCase()) {
          case 'cash': return 'Cash';
          case 'card': return 'Credit Card';
          case 'paypal': return 'Online';
          case 'bank': return 'Online';
          default: return 'Online';
        }
      };

      // Create invoice
      const invoice = new Invoice({
        bookingId: booking._id,
        userId: booking.userId._id,
        invoiceNumber,
        amount: finalTotal,
        currency: bookingCurrency, // ✅ FIX: Use booking's currency, not settings
        taxRate: settings.financialSettings?.taxRate || 0,
        discountApplied: 0, // Could be calculated from booking discounts
        status: invoiceStatus,
        // ✅ Map to schema-supported labels
        paymentMethod: mapPaymentMethod(booking.paymentMethod),
        issuedAt: new Date(),
        items: invoiceItems,
        // Additional charges breakdown
        additionalCharges: Object.keys(additionalCharges).length > 0 ? additionalCharges : undefined
      });

      // Save with retry on duplicate invoiceNumber (E11000)
      console.log(`📄 [INVOICE-SERVICE] Attempting to save invoice with number: ${invoice.invoiceNumber}`);
      let saved = false;
      for (let attempt = 0; attempt < 5 && !saved; attempt++) {
        try {
          console.log(`📄 [INVOICE-SERVICE] Save attempt ${attempt + 1}/5`);
          await invoice.save();
          saved = true;
          console.log(`✅ [INVOICE-SERVICE] Invoice saved successfully on attempt ${attempt + 1}`);
        } catch (err) {
          console.error(`❌ [INVOICE-SERVICE] Save attempt ${attempt + 1} failed:`, err.message);
          const isDup = err?.code === 11000 && (err?.keyPattern?.invoiceNumber || (err?.message || '').includes('invoiceNumber'));
          if (isDup) {
            console.log(`🔄 [INVOICE-SERVICE] Duplicate invoice number detected, regenerating...`);
            // Regenerate with high-entropy fallback and retry
            invoice.invoiceNumber = await this.generateInvoiceNumberFallback();
            console.log(`📄 [INVOICE-SERVICE] New invoice number generated: ${invoice.invoiceNumber}`);
            continue;
          }
          console.error(`❌ [INVOICE-SERVICE] Non-duplicate error, throwing:`, err);
          throw err;
        }
      }
      if (!saved) {
        console.error(`❌ [INVOICE-SERVICE] Failed to save invoice after 5 attempts`);
        throw new Error('Failed to create invoice after multiple attempts due to duplicate invoice numbers');
      }

      console.log(`📄 [INVOICE-SERVICE] Updating booking ${booking.bookingNumber} with invoiceId: ${invoice._id}`);
      // Update booking with invoice reference
      booking.invoiceId = invoice._id;
      await booking.save();
      console.log(`✅ [INVOICE-SERVICE] Booking updated with invoice reference`);

      console.log(`✅ [INVOICE-SERVICE] Invoice creation complete: ${invoice.invoiceNumber} (ID: ${invoice._id}) for booking ${booking.bookingNumber}`);
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

  // ✅ NEW: Recalculate and repair invoice amounts/items from booking costBreakdown
  async recalculateInvoiceFromBooking(bookingId, options = { overwriteItems: true }) {
    try {
      const booking = await Booking.findById(bookingId)
        .populate('userId', 'name email')
        .populate('roomId', 'title basePrice');
      if (!booking) throw new Error('Booking not found');

      let invoice = await Invoice.findOne({ bookingId: booking._id });
      if (!invoice) {
        // If missing, create a fresh one
        return await this.createInvoiceFromBooking(booking._id);
      }

      const settings = await this.getSettings();
      const cb = booking.costBreakdown || {};
      const nights = booking.nights || cb.nights || 0;
      const roomRate = booking.roomBasePrice || cb.roomRate || 0;
      const mealPlanCost = typeof cb.mealPlanCost === 'number' ? cb.mealPlanCost : 0;
      const subtotal = typeof cb.subtotal === 'number' ? cb.subtotal : ((nights * roomRate) + mealPlanCost);
      const tax = typeof cb.tax === 'number' ? cb.tax : 0;
      const serviceFee = typeof cb.serviceFee === 'number' ? cb.serviceFee : 0;
      const baseTotal = typeof cb.total === 'number' ? cb.total : (subtotal + tax + serviceFee);
      const currency = cb.currency || 'LKR';

      // Rebuild items if requested
      if (options.overwriteItems) {
        const items = [];
        const roomAmount = (typeof cb.roomCost === 'number') ? cb.roomCost : (nights * roomRate);
        items.push({
          description: `${booking.roomId.title} - ${nights} night${nights !== 1 ? 's' : ''}`,
          quantity: nights,
          unitPrice: roomRate,
          amount: roomAmount,
          type: 'room'
        });
        if (mealPlanCost > 0 && cb.mealBreakdown) {
          if (cb.mealBreakdown.plan) {
            items.push({
              description: `${cb.mealBreakdown.plan} for ${cb.mealBreakdown.guests} guests`,
              quantity: cb.mealBreakdown.nights || 1,
              unitPrice: cb.mealBreakdown.rate || 0,
              amount: mealPlanCost,
              type: 'meal_plan'
            });
          } else if (cb.mealBreakdown.meals) {
            cb.mealBreakdown.meals.forEach(meal => {
              items.push({
                description: meal.name,
                quantity: meal.quantity,
                unitPrice: meal.price,
                amount: meal.total,
                type: 'meal'
              });
            });
          }
        }
        if (tax > 0) items.push({ description: `Tax`, quantity: 1, unitPrice: tax, amount: tax, type: 'tax' });
        if (serviceFee > 0) items.push({ description: `Service Fee`, quantity: 1, unitPrice: serviceFee, amount: serviceFee, type: 'service_fee' });
        invoice.items = items;
      }

      // Update amounts and currency
      invoice.amount = baseTotal;
      invoice.currency = currency;

      // Ensure paymentMethod mapping matches schema
      const mapPaymentMethod = (pm) => {
        switch ((pm || '').toLowerCase()) {
          case 'cash': return 'Cash';
          case 'card': return 'Credit Card';
          case 'paypal': return 'Online';
          case 'bank': return 'Online';
          default: return 'Online';
        }
      };
      invoice.paymentMethod = mapPaymentMethod(booking.paymentMethod);

      // Align invoice status with booking
      await invoice.save();
      await this.updateInvoiceStatusFromBooking(booking._id);

      return invoice;
    } catch (error) {
      console.error('Error recalculating invoice from booking:', error);
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

  // ✅ NEW: Update invoice status when booking status changes
  // This keeps invoice and booking in sync throughout the lifecycle
  async updateInvoiceStatusFromBooking(bookingId) {
    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      const invoice = await Invoice.findOne({ bookingId: booking._id });
      if (!invoice) {
        console.log(`⚠️ No invoice found for booking ${bookingId} - skipping status update`);
        return null;
      }

      // Determine invoice status based on booking status
      let newInvoiceStatus = invoice.status; // Keep current status by default
      
      if (booking.status === 'Confirmed' || booking.status === 'Checked In' || booking.status === 'Checked Out') {
        newInvoiceStatus = 'Sent - Payment Pending';
      } else if (booking.status === 'Approved - Payment Pending') {
        newInvoiceStatus = 'Sent - Payment Pending';
      } else if (booking.status === 'Approved - Payment Processing') {
        newInvoiceStatus = 'Sent - Payment Pending';
      } else if (booking.status === 'Accepted') {
        newInvoiceStatus = 'Sent - Payment Pending';
      } else if (booking.status === 'Completed') {
        newInvoiceStatus = 'Paid';
      } else if (booking.status === 'Cancelled' || booking.status === 'Rejected') {
        newInvoiceStatus = 'Cancelled';
      } else if (booking.status === 'Pending Approval' || booking.status === 'On Hold') {
        newInvoiceStatus = 'Draft';
      }

      // Only update if status changed
      if (invoice.status !== newInvoiceStatus) {
        console.log(`📋 Updating invoice ${invoice.invoiceNumber} status from "${invoice.status}" to "${newInvoiceStatus}"`);
        invoice.status = newInvoiceStatus;
        await invoice.save();
      }

      return invoice;

    } catch (error) {
      console.error('Error updating invoice status from booking:', error);
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