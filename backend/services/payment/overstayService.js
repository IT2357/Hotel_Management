// 📁 backend/services/payment/overstayService.js
import Invoice from "../../models/Invoice.js";
import CheckInOut from "../../models/CheckInOut.js";
import Booking from "../../models/Booking.js";
import Room from "../../models/Room.js";
import NotificationService from "../notification/notificationService.js";

class OverstayService {
  /**
   * Create an overstay invoice for a guest
   * Invoice will track and grow as the guest continues to overstay
   */
  async createOverstayInvoice(checkInOutId, daysOverstayed, chargeAmount) {
    try {
      const checkInOut = await CheckInOut.findById(checkInOutId)
        .populate('guest', 'name email phone')
        .populate('room', 'title basePrice')
        .populate('booking', 'checkOut totalPrice costBreakdown');

      if (!checkInOut) {
        throw new Error('Check-in/out record not found');
      }

      // Check if overstay invoice already exists
      let existingInvoice = await Invoice.findOne({
        checkInOutId: checkInOutId,
        'overstayTracking.isOverstayInvoice': true
      });

      if (existingInvoice) {
        console.log(`✅ Overstay invoice already exists for ${checkInOutId}, will update it`);
        return existingInvoice;
      }

      // Generate invoice number
      const invoiceNumber = await this.generateOverstayInvoiceNumber();

      // Calculate daily rate (1.5x base rate for overstay)
      const baseRate = checkInOut.room?.basePrice || 5000;
      const dailyRate = baseRate * 1.5;

      // Get original checkout date
      const bookingCheckOut = new Date(checkInOut.booking?.checkOut);

      // Create overstay invoice
      const invoice = new Invoice({
        checkInOutId: checkInOutId,
        bookingId: checkInOut.booking?._id,
        userId: checkInOut.guest._id,
        invoiceNumber,
        amount: chargeAmount,
        totalAmount: chargeAmount,
        currency: 'LKR',
        status: 'Awaiting Approval', // Cash payment awaiting admin approval
        paymentMethod: 'Cash',
        issuedAt: new Date(),
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due in 24 hours
        items: [
          {
            description: `Overstay charges for ${checkInOut.room?.title} - ${daysOverstayed} day(s)`,
            quantity: daysOverstayed,
            unitPrice: dailyRate,
            amount: chargeAmount,
            type: 'overstay_charge',
            metadata: {
              daysOverstayed,
              baseRate,
              multiplier: 1.5,
              roomTitle: checkInOut.room?.title
            }
          }
        ],
        overstayTracking: {
          isOverstayInvoice: true,
          originalCheckOutDate: bookingCheckOut,
          currentCheckOutDate: new Date(),
          daysOverstayed,
          dailyRate,
          chargeBreakdown: {
            baseCharges: 0,
            accumulatedCharges: chargeAmount
          },
          lastUpdatedAt: new Date(),
          updatedByAdmin: false
        },
        paymentApproval: {
          approvalStatus: 'pending'
        },
        statusNotes: `Overstay invoice created on ${new Date().toLocaleString()}. Guest must pay at reception.`
      });

      await invoice.save();

      // Update CheckInOut record with invoice reference
      checkInOut.overstay.invoiceId = invoice._id;
      checkInOut.overstay.paymentStatus = 'pending_approval';
      checkInOut.overstay.canCheckout = false;
      await checkInOut.save();

      console.log(`✅ Overstay invoice created: ${invoiceNumber} for ${daysOverstayed} days at රු${dailyRate}/day = රු${chargeAmount}`);

      // Notify guest about overstay charges
      await this.notifyGuestAboutOverstayCharges(checkInOut, invoice, daysOverstayed, chargeAmount);

      return invoice;

    } catch (error) {
      console.error('❌ Error creating overstay invoice:', error);
      throw error;
    }
  }

  /**
   * Update overstay invoice with new charges as guest continues to stay
   * This allows the invoice to "grow" as the guest overstays
   */
  async updateOverstayInvoice(checkInOutId, newDaysOverstayed, newChargeAmount) {
    try {
      const invoice = await Invoice.findOne({
        checkInOutId: checkInOutId,
        'overstayTracking.isOverstayInvoice': true
      });

      if (!invoice) {
        console.log(`⚠️ No overstay invoice found for ${checkInOutId}, creating new one`);
        return null;
      }

      // Only update if there's been significant change (at least 1 more day or 10% charge increase)
      const previousDays = invoice.overstayTracking.daysOverstayed;
      const previousAmount = invoice.amount;

      if (newDaysOverstayed <= previousDays) {
        console.log(`⏭️ Overstay invoice already reflects ${previousDays} days, no update needed`);
        return invoice;
      }

      // Update invoice with new charges
      const dailyRate = invoice.overstayTracking.dailyRate;
      const additionalCharges = newChargeAmount - previousAmount;

      invoice.amount = newChargeAmount;
      invoice.totalAmount = newChargeAmount;
      invoice.items[0].quantity = newDaysOverstayed;
      invoice.items[0].amount = newChargeAmount;
      invoice.items[0].description = `Overstay charges for ${newDaysOverstayed} day(s)`;
      invoice.items[0].metadata.daysOverstayed = newDaysOverstayed;

      invoice.overstayTracking.daysOverstayed = newDaysOverstayed;
      invoice.overstayTracking.currentCheckOutDate = new Date();
      invoice.overstayTracking.chargeBreakdown.accumulatedCharges = newChargeAmount;
      invoice.overstayTracking.lastUpdatedAt = new Date();

      invoice.statusNotes = `Invoice updated: ${previousDays} days → ${newDaysOverstayed} days. Previous charge: රු${previousAmount} → New charge: රු${newChargeAmount}. Additional: රු${additionalCharges}`;

      await invoice.save();

      // Update CheckInOut record
      const checkInOut = await CheckInOut.findById(checkInOutId);
      if (checkInOut) {
        checkInOut.overstay.daysOverstayed = newDaysOverstayed;
        checkInOut.overstay.chargeAmount = newChargeAmount;
        await checkInOut.save();
      }

      console.log(`✅ Overstay invoice updated: ${previousDays} → ${newDaysOverstayed} days (රු${previousAmount} → රු${newChargeAmount})`);

      // Notify guest about updated charges
      await this.notifyGuestAboutUpdatedCharges(checkInOutId, newDaysOverstayed, newChargeAmount, additionalCharges);

      return invoice;

    } catch (error) {
      console.error('❌ Error updating overstay invoice:', error);
      throw error;
    }
  }

  /**
   * Admin approves overstay payment
   * This marks the overstay as paid and allows guest to checkout
   */
  async approveOverstayPayment(invoiceId, adminId, approvalNotes = '') {
    try {
      const invoice = await Invoice.findById(invoiceId)
        .populate('checkInOutId');

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (!invoice.overstayTracking?.isOverstayInvoice) {
        throw new Error('This is not an overstay invoice');
      }

      if (invoice.paymentApproval.approvalStatus === 'approved') {
        throw new Error('This invoice has already been approved');
      }

      // Mark as approved
      invoice.status = 'Paid';
      invoice.paymentApproval.approvalStatus = 'approved';
      invoice.paymentApproval.approvedBy = adminId;
      invoice.paymentApproval.approvalNotes = approvalNotes;
      invoice.paymentApproval.approvedAt = new Date();
      invoice.paidAt = new Date();

      await invoice.save();

      // Update CheckInOut to allow checkout
      const checkInOut = await CheckInOut.findById(invoice.checkInOutId);
      if (checkInOut) {
        checkInOut.overstay.paymentStatus = 'approved';
        checkInOut.overstay.canCheckout = true;
        checkInOut.overstay.approvalNotes = approvalNotes;
        await checkInOut.save();
      }

      console.log(`✅ Overstay payment approved for invoice ${invoice.invoiceNumber}`);

      // Notify guest that they can now checkout
      await this.notifyGuestPaymentApproved(invoice, approvalNotes);

      return invoice;

    } catch (error) {
      console.error('❌ Error approving overstay payment:', error);
      throw error;
    }
  }

  /**
   * Admin rejects overstay payment (e.g., guest needs to pay more or provide evidence)
   */
  async rejectOverstayPayment(invoiceId, adminId, rejectionReason = '') {
    try {
      const invoice = await Invoice.findById(invoiceId)
        .populate('checkInOutId');

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (!invoice.overstayTracking?.isOverstayInvoice) {
        throw new Error('This is not an overstay invoice');
      }

      // Mark as rejected
      invoice.status = 'Failed';
      invoice.paymentApproval.approvalStatus = 'rejected';
      invoice.paymentApproval.rejectionReason = rejectionReason;
      invoice.paymentApproval.rejectionDate = new Date();
      invoice.statusNotes = `Payment rejected: ${rejectionReason}`;

      await invoice.save();

      // Keep CheckInOut blocked for checkout
      const checkInOut = await CheckInOut.findById(invoice.checkInOutId);
      if (checkInOut) {
        checkInOut.overstay.paymentStatus = 'rejected';
        checkInOut.overstay.canCheckout = false;
        checkInOut.overstay.approvalNotes = rejectionReason;
        await checkInOut.save();
      }

      console.log(`❌ Overstay payment rejected for invoice ${invoice.invoiceNumber}: ${rejectionReason}`);

      // Notify guest about rejection
      await this.notifyGuestPaymentRejected(invoice, rejectionReason);

      return invoice;

    } catch (error) {
      console.error('❌ Error rejecting overstay payment:', error);
      throw error;
    }
  }

  /**
   * Admin manually adjusts overstay charges (e.g., for special circumstances)
   */
  async adjustOverstayCharges(invoiceId, adminId, newAmount, adjustmentNotes = '') {
    try {
      const invoice = await Invoice.findById(invoiceId)
        .populate('checkInOutId');

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (!invoice.overstayTracking?.isOverstayInvoice) {
        throw new Error('This is not an overstay invoice');
      }

      const previousAmount = invoice.amount;

      // Update invoice with adjusted amount
      invoice.amount = newAmount;
      invoice.totalAmount = newAmount;
      invoice.items[0].amount = newAmount;
      invoice.items[0].unitPrice = newAmount / invoice.items[0].quantity;

      invoice.overstayTracking.chargeBreakdown.accumulatedCharges = newAmount;
      invoice.overstayTracking.updatedByAdmin = true;
      invoice.overstayTracking.adjustmentNotes = adjustmentNotes;
      invoice.overstayTracking.lastUpdatedAt = new Date();

      invoice.statusNotes = `Charges adjusted by admin from රු${previousAmount} to රු${newAmount}. Reason: ${adjustmentNotes}`;

      await invoice.save();

      // Update CheckInOut record
      const checkInOut = await CheckInOut.findById(invoice.checkInOutId);
      if (checkInOut) {
        checkInOut.overstay.chargeAmount = newAmount;
        await checkInOut.save();
      }

      console.log(`✅ Overstay charges adjusted: රු${previousAmount} → රු${newAmount}`);

      // Notify guest about adjustment
      await this.notifyGuestChargesAdjusted(invoice, previousAmount, newAmount, adjustmentNotes);

      return invoice;

    } catch (error) {
      console.error('❌ Error adjusting overstay charges:', error);
      throw error;
    }
  }

  /**
   * Generate unique invoice number for overstay invoices
   */
  async generateOverstayInvoiceNumber() {
    try {
      const lastInvoice = await Invoice.findOne(
        { 'overstayTracking.isOverstayInvoice': true },
        { invoiceNumber: 1 },
        { sort: { 'createdAt': -1 } }
      );

      const lastNumber = lastInvoice?.invoiceNumber ?
        parseInt(lastInvoice.invoiceNumber.replace(/\D/g, '')) || 0 : 0;

      return `OVERSTAY-${String(lastNumber + 1).padStart(6, '0')}`;
    } catch (error) {
      console.error('Error generating overstay invoice number:', error);
      return `OVERSTAY-${Date.now()}`;
    }
  }

  /**
   * Get all pending overstay invoices (for admin dashboard)
   */
  async getPendingOverstayInvoices(filters = {}) {
    try {
      const query = {
        'overstayTracking.isOverstayInvoice': true,
        'paymentApproval.approvalStatus': filters.approvalStatus || 'pending'
      };

      if (filters.userId) {
        query.userId = filters.userId;
      }

      const invoices = await Invoice.find(query)
        .populate('userId', 'name email phone')
        .populate('checkInOutId', 'guest room overstay')
        .sort({ 'createdAt': -1 });

      return invoices;

    } catch (error) {
      console.error('❌ Error fetching pending overstay invoices:', error);
      throw error;
    }
  }

  /**
   * Get overstay invoices for a specific guest
   */
  async getGuestOverstayInvoices(userId) {
    try {
      const invoices = await Invoice.find({
        userId,
        'overstayTracking.isOverstayInvoice': true
      })
        .populate('checkInOutId')
        .sort({ 'createdAt': -1 });

      return invoices;

    } catch (error) {
      console.error('❌ Error fetching guest overstay invoices:', error);
      throw error;
    }
  }

  // ===== NOTIFICATION HELPERS =====

  async notifyGuestAboutOverstayCharges(checkInOut, invoice, daysOverstayed, chargeAmount) {
    try {
      await NotificationService.sendNotification({
        userId: checkInOut.guest._id,
        userType: 'guest',
        type: 'overstay_charges_created',
        title: 'Overstay Charges Applied',
        message: `You have overstayed by ${daysOverstayed} day(s). Total charges: රු${chargeAmount}. Please proceed to reception to pay.`,
        channel: 'email',
        metadata: {
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          daysOverstayed,
          chargeAmount,
          roomTitle: checkInOut.room?.title
        }
      });
    } catch (error) {
      console.error('Error sending overstay notification:', error);
    }
  }

  async notifyGuestAboutUpdatedCharges(checkInOutId, newDaysOverstayed, newChargeAmount, additionalCharges) {
    try {
      const checkInOut = await CheckInOut.findById(checkInOutId).populate('guest');
      if (!checkInOut) return;

      await NotificationService.sendNotification({
        userId: checkInOut.guest._id,
        userType: 'guest',
        type: 'overstay_charges_updated',
        title: 'Overstay Charges Updated',
        message: `Your overstay charges have been updated. New total: රු${newChargeAmount} for ${newDaysOverstayed} day(s). Additional charge: රු${additionalCharges}.`,
        channel: 'email',
        metadata: {
          daysOverstayed: newDaysOverstayed,
          totalCharge: newChargeAmount,
          additionalCharge: additionalCharges
        }
      });
    } catch (error) {
      console.error('Error sending updated charges notification:', error);
    }
  }

  async notifyGuestPaymentApproved(invoice, approvalNotes) {
    try {
      const checkInOut = await CheckInOut.findById(invoice.checkInOutId).populate('guest');
      if (!checkInOut) return;

      await NotificationService.sendNotification({
        userId: checkInOut.guest._id,
        userType: 'guest',
        type: 'overstay_payment_approved',
        title: 'Overstay Payment Approved',
        message: `Your overstay payment has been approved. You can now proceed with checkout. Invoice: ${invoice.invoiceNumber}. Notes: ${approvalNotes || 'Payment confirmed.'}`,
        channel: 'email',
        metadata: {
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          approvalNotes
        }
      });
    } catch (error) {
      console.error('Error sending payment approved notification:', error);
    }
  }

  async notifyGuestPaymentRejected(invoice, rejectionReason) {
    try {
      const checkInOut = await CheckInOut.findById(invoice.checkInOutId).populate('guest');
      if (!checkInOut) return;

      await NotificationService.sendNotification({
        userId: checkInOut.guest._id,
        userType: 'guest',
        type: 'overstay_payment_rejected',
        title: 'Overstay Payment Rejected',
        message: `Your overstay payment has been rejected. Reason: ${rejectionReason}. Please contact reception for details.`,
        channel: 'email',
        metadata: {
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          rejectionReason
        }
      });
    } catch (error) {
      console.error('Error sending payment rejected notification:', error);
    }
  }

  async notifyGuestChargesAdjusted(invoice, previousAmount, newAmount, adjustmentNotes) {
    try {
      const checkInOut = await CheckInOut.findById(invoice.checkInOutId).populate('guest');
      if (!checkInOut) return;

      const difference = newAmount - previousAmount;
      await NotificationService.sendNotification({
        userId: checkInOut.guest._id,
        userType: 'guest',
        type: 'overstay_charges_adjusted',
        title: 'Overstay Charges Adjusted',
        message: `Your overstay charges have been adjusted. Previous: රු${previousAmount}, New: රු${newAmount} (${difference > 0 ? '+' : ''}රු${difference}). Reason: ${adjustmentNotes}`,
        channel: 'email',
        metadata: {
          invoiceId: invoice._id,
          previousAmount,
          newAmount,
          difference,
          adjustmentNotes
        }
      });
    } catch (error) {
      console.error('Error sending charges adjusted notification:', error);
    }
  }
}

export default new OverstayService();
