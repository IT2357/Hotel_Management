// 📁 backend/controllers/invoiceController.js
import InvoiceService from "../services/payment/invoiceService.js";
import Booking from "../models/Booking.js";
import { createPreCheckInRecord } from "./checkInOutController.js";

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
    const { 
      status, 
      paymentMethod, 
      dateFrom, 
      dateTo, 
      search, 
      page = 1, 
      limit = 20 
    } = req.query;

    // Import models at the top level to avoid issues with dynamic imports
    const Invoice = (await import("../models/Invoice.js")).default;
    let User;
    try {
      // models/User.js exports named { User, Guest, Staff, Manager, Admin }
      ({ User } = await import("../models/User.js"));
      if (!User) {
        throw new Error('User model not found in named exports');
      }
    } catch (error) {
      console.error('Failed to load User model:', error);
      throw new Error('Failed to load required models');
    }

    // Build the query
    const query = {};
    const orConditions = [];
    const userIds = [];

    // Status filter - normalize status value for case-insensitive matching
    if (status) {
      // Normalize the status by capitalizing first letter of each word
      const normalizedStatus = status.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      // Map common status variations to the correct values
      const statusMap = {
        'Draft': 'Draft',
        'Draft ': 'Draft',
        'Sent - Payment Pending': 'Sent - Payment Pending',
        'Sent - Payment Pending ': 'Sent - Payment Pending',
        'Sent - Payment Processing': 'Sent - Payment Processing',
        'Sent - Payment Processing ': 'Sent - Payment Processing',
        'Awaiting Approval': 'Awaiting Approval',
        'Awaiting Approval ': 'Awaiting Approval',
        'Paid': 'Paid',
        'Paid ': 'Paid',
        'Overdue': 'Overdue',
        'Overdue ': 'Overdue',
        'Cancelled': 'Cancelled',
        'Cancelled ': 'Cancelled',
        'Refunded': 'Refunded',
        'Refunded ': 'Refunded',
        'Failed': 'Failed',
        'Failed ': 'Failed'
      };

      // Use the mapped status if it exists, otherwise use the normalized version
      query.status = statusMap[normalizedStatus] || normalizedStatus;
    }

    // Payment method filter - use exact match with index
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    // Date range filter - use indexed field with proper range
    if (dateFrom || dateTo) {
      query.issuedAt = {};
      if (dateFrom) {
        query.issuedAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query.issuedAt.$lte = endOfDay;
      }
    }

    // Search functionality with optimized queries
    if (search && search.trim().length > 0) {
      // Search in invoice number (case-insensitive regex with index hint)
      orConditions.push({
        invoiceNumber: { $regex: search, $options: 'i' }
      });

      // Search in user details - use text index if available
      const users = await User.find(
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        },
        { _id: 1 },
        { limit: 1000 } // Limit to prevent performance issues
      ).lean();

      if (users.length > 0) {
        userIds.push(...users.map(u => u._id));
      }
    }

    // Add user IDs to OR conditions if we found any
    if (userIds.length > 0) {
      orConditions.push({ userId: { $in: userIds } });
    }

    // Combine search conditions with OR if we have any
    if (orConditions.length > 0) {
      query.$or = orConditions;
    }

    // Optimize query with index hints and projection
    const findOptions = {
      sort: { createdAt: -1 },
      limit: parseInt(limit, 10),
      skip: (parseInt(page, 10) - 1) * parseInt(limit, 10),
      lean: true
    };

    // Only include necessary fields in the response
    const projection = {
      invoiceNumber: 1,
      status: 1,
      amount: 1,
      dueDate: 1,
      paymentMethod: 1,
      issuedAt: 1,
      userId: 1,  // Include userId for population
      bookingId: 1,  // Include bookingId for population
      overstayTracking: 1,  // Include overstay tracking data
      paymentApproval: 1,  // Include payment approval data
      checkInOutId: 1  // Include check-in/out reference
    };

    // Execute optimized parallel queries
    const [invoices, total] = await Promise.all([
      Invoice.find(query, projection, findOptions)
        .populate({
          path: 'userId',
          select: 'name email phone address',
          options: { lean: true }
        })
        .populate({
          path: 'bookingId',
          select: 'bookingNumber checkIn checkOut roomId',
          populate: {
            path: 'roomId',
            select: 'roomNumber title',
            options: { lean: true }
          },
          options: { lean: true }
        })
        .lean(),
      Invoice.countDocuments(query)
    ]);

    // Cache control headers
    res.set('Cache-Control', 'no-store, max-age=0');
    
    // Response with optimized structure
    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          currentPage: parseInt(page, 10),
          totalPages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit, 10)
        }
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
    const CheckInOut = (await import("../models/CheckInOut.js")).default;

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
      
      // 🎯 OVERSTAY SPECIFIC: If this is an overstay invoice being marked as Paid
      // Update CheckInOut record to allow guest checkout
      if (invoice.overstayTracking?.isOverstayInvoice && invoice.checkInOutId) {
        try {
          const checkInOut = await CheckInOut.findById(invoice.checkInOutId);
          if (checkInOut) {
            checkInOut.overstay.paymentStatus = 'approved';
            checkInOut.overstay.canCheckout = true;
            checkInOut.overstay.approvalNotes = reason || 'Payment approved by admin';
            await checkInOut.save();
            console.log(`✅ CheckInOut updated: canCheckout = true for overstay invoice ${invoice.invoiceNumber}`);
          }
        } catch (checkInOutError) {
          console.error('⚠️ Warning: Could not update CheckInOut record:', checkInOutError.message);
          // Don't fail the entire operation, just log the warning
        }
      }
    } else if (status === 'Overdue') {
      invoice.status = 'Overdue';
      invoice.overdueAt = new Date();
    } else if (status === 'Cancelled') {
      invoice.status = 'Cancelled';
    } else if (status === 'Sent') {
      invoice.status = 'Sent - Payment Pending';
    } else if (status === 'Failed') {
      invoice.status = 'Failed';
      
      // 🎯 OVERSTAY SPECIFIC: If this is an overstay invoice being marked as Failed
      // Update CheckInOut record to block guest checkout
      if (invoice.overstayTracking?.isOverstayInvoice && invoice.checkInOutId) {
        try {
          const checkInOut = await CheckInOut.findById(invoice.checkInOutId);
          if (checkInOut) {
            checkInOut.overstay.paymentStatus = 'rejected';
            checkInOut.overstay.canCheckout = false; // Block checkout
            checkInOut.overstay.approvalNotes = reason || 'Payment rejected by admin';
            await checkInOut.save();
            console.log(`✅ CheckInOut updated: canCheckout = false, guest blocked from checkout for overstay invoice ${invoice.invoiceNumber}`);
          }
        } catch (checkInOutError) {
          console.error('⚠️ Warning: Could not update CheckInOut record:', checkInOutError.message);
        }
      }
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
          
          // Create pre-check-in record when booking is confirmed via payment
          try {
            await createPreCheckInRecord(booking._id);
            console.log('✅ Pre-check-in record created for confirmed booking:', booking._id);
          } catch (preCheckInError) {
            console.error('❌ Failed to create pre-check-in record:', preCheckInError.message);
            // Don't fail the booking confirmation if pre-check-in creation fails
          }
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
