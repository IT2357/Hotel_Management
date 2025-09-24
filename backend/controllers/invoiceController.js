// 📁 backend/controllers/invoiceController.js
import InvoiceService from "../services/payment/invoiceService.js";
import Booking from "../models/Booking.js";

// Helper for consistent error responses
const handleError = (res, error, defaultMessage = "Operation failed") => {
  console.error(`${defaultMessage}:`, error);

  const statusCode = error.message.includes("not found")
    ? 404
    : error.message.includes("already exists")
    ? 400
    : error.message.includes("Invalid")
    ? 400
    : 500;

  res.status(statusCode).json({
    success: false,
    message: error.message || defaultMessage,
  });
};

// Helper for success responses
const sendSuccess = (
  res,
  data,
  message = "Operation successful",
  statusCode = 200
) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

// Create invoice for booking
export const createBookingInvoice = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { additionalCharges } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    const invoice = await InvoiceService.createInvoiceFromBooking(bookingId, additionalCharges);
    sendSuccess(res, invoice, "Invoice created successfully", 201);

  } catch (error) {
    handleError(res, error, "Failed to create invoice");
  }
};

// Finalize invoice (mark as ready for payment)
export const finalizeInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { paymentMethod } = req.body;

    if (!invoiceId) {
      return res.status(400).json({
        success: false,
        message: "Invoice ID is required",
      });
    }

    const invoice = await InvoiceService.finalizeInvoice(invoiceId, paymentMethod);
    sendSuccess(res, invoice, "Invoice finalized successfully");

  } catch (error) {
    handleError(res, error, "Failed to finalize invoice");
  }
};

// Get invoice details
export const getInvoiceDetails = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    if (!invoiceId) {
      return res.status(400).json({
        success: false,
        message: "Invoice ID is required",
      });
    }

    const invoice = await InvoiceService.getInvoiceDetails(invoiceId);
    sendSuccess(res, invoice);

  } catch (error) {
    handleError(res, error, "Failed to get invoice details");
  }
};

// Get user's invoices
export const getUserInvoices = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, page, limit } = req.query;

    const filters = { status, page: parseInt(page) || 1, limit: parseInt(limit) || 10 };
    const result = await InvoiceService.getUserInvoices(userId, filters);

    sendSuccess(res, result);

  } catch (error) {
    handleError(res, error, "Failed to get invoices");
  }
};

// Get invoice statistics
export const getInvoiceStats = async (req, res) => {
  try {
    const { period = 'all' } = req.query;
    let matchStage = {};

    if (period !== 'all') {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));
      matchStage = {
        createdAt: { $gte: startDate }
      };
    }

    const Invoice = (await import("../models/Invoice.js")).default;

    const stats = await Invoice.aggregate([
      {
        $match: matchStage
      },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          paid: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "Paid"] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "Pending"] }, 1, 0] }
          },
          refunded: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "Refunded"] }, 1, 0] }
          },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "Paid"] }, "$amount", 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalInvoices: 0,
      paid: 0,
      pending: 0,
      refunded: 0,
      totalRevenue: 0
    };

    sendSuccess(res, result);

  } catch (error) {
    handleError(res, error, "Failed to get invoice statistics");
  }
};

// Get all invoices (admin)
export const getAllInvoices = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;

    const Invoice = (await import("../models/Invoice.js")).default;
    const User = (await import("../models/User.js")).default;

    let query = {};

    if (status) {
      query.paymentStatus = status;
    }

    if (search) {
      const users = await User.find({
        name: { $regex: search, $options: 'i' }
      }).select('_id');

      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { userId: { $in: users.map(u => u._id) } }
      ];
    }

    const invoices = await Invoice.find(query)
      .populate('userId', 'name email')
      .populate('bookingId', 'checkIn checkOut roomId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Invoice.countDocuments(query);

    sendSuccess(res, {
      invoices,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalInvoices: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    handleError(res, error, "Failed to get invoices");
  }
};

// Update invoice status
export const updateInvoiceStatus = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { status, reason } = req.body;

    if (!invoiceId) {
      return res.status(400).json({
        success: false,
        message: "Invoice ID is required",
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const Invoice = (await import("../models/Invoice.js")).default;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Update invoice status
    invoice.statusNotes = reason;
    invoice.updatedAt = new Date();

    // Update invoice status using consolidated status field
    if (status === 'Paid') {
      invoice.status = 'Paid';
      invoice.paidAt = new Date();
    } else if (status === 'Overdue') {
      invoice.status = 'Overdue';
      invoice.overdueAt = new Date();
    } else if (status === 'Cancelled') {
      invoice.status = 'Cancelled';
    } else if (status === 'Sent') {
      invoice.status = 'Sent - Payment Pending';
    } else {
      // For other statuses like 'Draft', 'Pending'
      invoice.status = status;
    }

    invoice.statusNotes = reason;
    invoice.updatedAt = new Date();

    await invoice.save();

    // Update linked booking status if invoice status changes
    if (invoice.bookingId) {
      const Booking = (await import("../models/Booking.js")).default;
      const booking = await Booking.findById(invoice.bookingId);

      if (booking) {
        // Update booking status based on invoice status
        if (status === 'Paid') {
          booking.status = 'Confirmed'; // Payment completed, booking confirmed
          booking.paidAt = new Date();
        } else if (status === 'Sent - Payment Pending') {
          // Invoice sent, keep booking status as is but ensure it's not completed
          if (booking.status === 'Confirmed') {
            booking.status = booking.paymentMethod === 'cash' ? 'Approved - Payment Pending' : 'Approved - Payment Processing';
          }
        } else if (status === 'Cancelled') {
          booking.status = 'Cancelled';
        }

        await booking.save();
        console.log(`✅ Booking ${booking.bookingNumber} status updated to ${booking.status} due to invoice status change`);
      }
    }

  } catch (error) {
    handleError(res, error, "Failed to update invoice status");
  }
};

export default {
  createBookingInvoice,
  finalizeInvoice,
  getInvoiceDetails,
  getUserInvoices,
  getAllInvoices,
  getInvoiceStats,
  updateInvoiceStatus,
};
