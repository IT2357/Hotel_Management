// 📁 backend/controllers/bookings/bookingController.js
import BookingService from "../../services/booking/bookingService.js";
import RoomService from "../../services/rooms/roomService.js";
import AdminSettings from "../../models/AdminSettings.js";
import Booking from "../../models/Booking.js";
import { User } from "../../models/User.js";
import NotificationService from "../../services/notification/notificationService.js";
import RefundService from "../../services/payment/refundService.js";
import AutoApprovalService from "../../services/booking/autoApprovalService.js";
import payHereService from '../../services/payHereService.js';
import Payment from '../../models/Payment.js';
import { createPreCheckInRecord } from '../checkInOutController.js';

// Helper for consistent error responses
const handleError = (res, error, defaultMessage = "Operation failed") => {
  console.error(`${defaultMessage}:`, error);

  const statusCode = error.message.includes("not found")
    ? 404
    : error.message.includes("already exists")
    ? 400
    : error.message.includes("Invalid")
    ? 400
    : error.message.includes("already approved")
    ? 400
    : 500;

  res.status(statusCode).json({
    success: false,
    message: error.message || defaultMessage,
  });
};

// List currently held bookings (On Hold and not expired)
export const getHeldBookings = async (req, res) => {
  try {
    const held = await Booking.find({
      status: 'On Hold',
      holdUntil: { $gt: new Date() }
    })
      .populate('userId', 'name email phone')
      .populate('roomId', 'title roomNumber type')
      .sort({ holdUntil: 1 });

    sendSuccess(res, held);
  } catch (error) {
    handleError(res, error, 'Failed to fetch held bookings');
  }
};

// Release hold for a booking: stop blocking inventory but keep it pending approval
export const releaseBookingHold = async (req, res) => {
  try {
    const { bookingId } = req.params;
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'Booking ID is required' });
    }

    let booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status !== 'On Hold') {
      return res.status(400).json({ success: false, message: `Booking is not on hold (status: ${booking.status})` });
    }

    booking.status = 'Pending Approval';
    booking.holdUntil = null;
    booking.lastStatusChange = new Date();
    await booking.save();

    sendSuccess(res, { bookingId: booking._id, status: booking.status }, 'Hold released');
  } catch (error) {
    handleError(res, error, 'Failed to release booking hold');
  }
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

// ===== GUEST BOOKING FUNCTIONS =====

// Create new booking
export const createBooking = async (req, res) => {
  try {
    const {
      roomId,
      checkIn,
      checkOut,
      guests,
      specialRequests,
      foodPlan,
      selectedMeals,
      paymentMethod,
      totalAmount,
      nights,
      status,
      roomBasePrice,
      guestCount,
      roomTitle,
      source,
      costBreakdown,
      metadata
    } = req.body;

    // Input validation
    if (!roomId || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: "Room ID, check-in date, and check-out date are required",
      });
    }

    // Check if user is authenticated if guest booking is not allowed
    let settings = await AdminSettings.findOne().lean() || {};
    if (settings.allowGuestBooking === false && !req.user?._id) {
      return res.status(403).json({
        success: false,
        message: "Guest booking is not allowed. Please log in to make a booking.",
        requiresLogin: true
      });
    }

    const userId = req.user?._id;

    // Get operational settings for validation
    let currentSettings = settings;
    if (!currentSettings.general) {
      const defaultSettings = new AdminSettings({
        general: {
          hotelName: 'Hotel Management System',
          contactEmail: 'admin@hotel.com',
          contactPhone: '+1234567890',
          address: 'Default Address'
        },
        booking: {
          requireApprovalForAllBookings: false,
          autoApprovalThreshold: 50000,
          approvalTimeoutHours: 24,
          allowGuestBooking: false // Default to false for security
        },
        // Root-level payment approval settings (new approach)
        cashPaymentApprovalRequired: true,
        bankTransferApprovalRequired: true,
        cardPaymentApprovalRequired: false,
        email: {
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          smtpUser: 'admin@hotel.com',
          smtpPassword: 'password123',
          fromEmail: 'admin@hotel.com',
          fromName: 'Hotel Management'
        }
      });
      await defaultSettings.save();
      currentSettings = defaultSettings.toObject();
    }

    // Check operational hours if enabled
    if (currentSettings.operationalSettings?.enabled) {
      const checkInDate = new Date(checkIn);
      const checkInTime = checkInDate.toTimeString().slice(0, 5);

      if (checkInTime < currentSettings.operationalSettings.startTime ||
          checkInTime > currentSettings.operationalSettings.endTime) {
        const shouldApprove = currentSettings.operationalSettings.requireApprovalOutsideHours;
        if (currentSettings.operationalSettings.autoCancelOutsideHours && !shouldApprove) {
          return res.status(400).json({
            success: false,
            message: `Bookings are not allowed outside operational hours (${currentSettings.operationalSettings.startTime} - ${currentSettings.operationalSettings.endTime}). Booking has been cancelled.`,
          });
        }
      }
    }

    // Determine booking status based on payment method
    let bookingStatus = 'Pending Approval'; // Default to pending approval
    let requiresApproval = true;

    // All bookings now go through admin review to ensure proper validation
    // The service will determine the final status based on payment method and settings
    const bookingData = {
      roomId,
      checkIn,
      checkOut,
      guests: guests || 1,
      specialRequests,
      foodPlan: foodPlan || "None",
      selectedMeals: selectedMeals || [],
      source: source || "website",
      paymentMethod: paymentMethod || 'cash',
      status: status || bookingStatus, // Use provided status or default
      requiresApproval,
      totalAmount,
      nights,
      roomBasePrice,
      guestCount: guestCount || { adults: guests || 1, children: 0 },
      roomTitle,
      // ✅ FIX: Don't pass costBreakdown from frontend - let backend calculate it properly
      // The frontend's costBreakdown is incomplete and causes invoice errors
      // costBreakdown, // REMOVED - backend will calculate complete breakdown
      metadata: metadata || {
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        timestamp: new Date().toISOString(),
        bookingSource: 'backend_controller',
        version: '1.0'
      }
    };

    // Create booking with JWT authentication - backend will extract user from token
    const booking = await BookingService.createBooking({
      ...bookingData,
      userId: req.user._id
    });

    const responseData = {
      bookingId: booking._id,
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      holdUntil: booking.holdUntil,
      totalAmount: booking.totalPrice,
      paymentMethod: booking.paymentMethod,
      requiresApproval: booking.status === 'Pending Approval',
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: booking.guests,
      roomTitle: booking.roomId?.title,
      roomNumber: booking.roomId?.roomNumber,
      specialRequests: booking.specialRequests,
      foodPlan: booking.foodPlan
    };

    // Add approval information to response
    if (requiresApproval) {
      responseData.approvalRequired = true;
      responseData.estimatedApprovalTime = currentSettings.booking?.approvalTimeoutHours || 24;
    } else {
      responseData.autoApproved = true;
    }

    sendSuccess(res, responseData, "Booking created successfully", 201);

  } catch (error) {
    handleError(res, error, "Failed to create booking");
  }
};

// Get user's bookings
export const getUserBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('roomId', 'title roomNumber type images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Check for existing reviews for each booking
    // for (let booking of bookings) {
    //   const existingReview = await '[HotelReview]'.findOne({
    //     booking: booking._id,
    //     user: userId
    //   });
      
    //   booking.hasReview = !!existingReview;
    //   booking.reviewId = existingReview ? existingReview._id : null;
    // }

    const total = await Booking.countDocuments(query);

    sendSuccess(res, {
      bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalBookings: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    handleError(res, error, "Failed to get bookings");
  }
};

// Get booking details
export const getBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      userId: userId
    }).populate('roomId', 'title roomNumber type images amenities');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    sendSuccess(res, booking);

  } catch (error) {
    handleError(res, error, "Failed to get booking details");
  }
};

// Get bookings that need reviews (completed bookings without reviews)
export const getBookingsForReview = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    // Find completed bookings that don't have reviews yet
    const query = {
      userId,
      status: 'Completed',
      hasReview: false
    };

    const bookings = await Booking.find(query)
      .populate('roomId', 'title roomNumber type images')
      .sort({ checkOut: -1 }) // Sort by checkout date (most recent first)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    sendSuccess(res, {
      bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalBookings: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    handleError(res, error, "Failed to get bookings for review");
  }
};

// Cancel booking
export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      userId: userId
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if booking can be cancelled
    if (booking.status === 'Approved - Payment Pending' || booking.status === 'Approved - Payment Processing' || booking.status === 'Confirmed') {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel confirmed booking. Please contact hotel staff.",
      });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled",
      });
    }

    // Cancel the booking
    booking.status = 'Cancelled';
    booking.cancelledAt = new Date();
    booking.cancelledBy = userId;
    booking.cancellationReason = reason || 'Cancelled by guest';
    await booking.save();

    // ✅ Update invoice status to cancelled
    try {
      const InvoiceService = (await import("../../services/payment/invoiceService.js")).default;
      await InvoiceService.updateInvoiceStatusFromBooking(booking._id);
      console.log(`✅ Invoice status updated to reflect cancellation`);
    } catch (invoiceError) {
      console.error('❌ Failed to update invoice status after cancellation:', invoiceError);
      // Don't fail the cancellation if invoice update fails
    }

    // Create refund request for cancelled booking
    try {
      const refundRequest = await RefundService.createRefundRequest(booking, booking.cancellationReason, userId);
      if (refundRequest) {
        console.log(`✅ Refund request created for cancelled booking ${booking.bookingNumber}`);
      }
    } catch (refundError) {
      console.error('❌ Failed to create refund request for cancellation:', refundError);
      // Don't fail the cancellation if refund creation fails
    }

    sendSuccess(res, {
      bookingId: booking._id,
      status: booking.status,
      cancelledAt: booking.cancelledAt
    }, "Booking cancelled successfully");

  } catch (error) {
    handleError(res, error, "Failed to cancel booking");
  }
};

// Guest-initiated: Request refund for a booking (if eligible)
export const requestRefundForBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'Booking ID is required' });
    }

    const Booking = (await import("../../models/Booking.js")).default;
    const booking = await Booking.findOne({ _id: bookingId, userId: userId }).populate('invoiceId');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only allow for Confirmed/Completed/Cancelled bookings
    if (!['Confirmed', 'Completed', 'Cancelled'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Refunds can only be requested for confirmed, completed, or cancelled bookings' });
    }

    // Delegate to RefundService which already checks invoice Paid and window
    const refundRequest = await RefundService.createRefundRequest(booking, reason || 'Refund requested by guest', userId);

    if (!refundRequest) {
      return res.status(400).json({ success: false, message: 'Refund not applicable or invoice not paid' });
    }

    return res.status(201).json({ success: true, message: 'Refund request submitted', data: refundRequest });

  } catch (error) {
    console.error('Failed to request refund:', error);
    return res.status(500).json({ success: false, message: 'Failed to request refund' });
  }
};

// ===== ADMIN BOOKING MANAGEMENT FUNCTIONS =====

// Get all bookings (admin)
export const getAllBookings = async (req, res) => {
  try {
    const {
      status,
      page = 1,
      limit = 20,
      search,
      dateFrom,
      dateTo
    } = req.query;

    let query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      query.checkIn = {};
      if (dateFrom) query.checkIn.$gte = new Date(dateFrom);
      if (dateTo) query.checkIn.$lte = new Date(dateTo);
    }

    // Search by booking number or guest name
    if (search) {
      const users = await User.find({
        name: { $regex: search, $options: 'i' }
      }).select('_id');

      query.$or = [
        { bookingNumber: { $regex: search, $options: 'i' } },
        { userId: { $in: users.map(u => u._id) } }
      ];
    }

    const bookings = await Booking.find(query)
      .populate('userId', 'name email phone')
      .populate('roomId', 'title roomNumber type')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    sendSuccess(res, {
      bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalBookings: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    handleError(res, error, "Failed to get bookings");
  }
};

// Get bookings requiring approval
export const getPendingApprovals = async (req, res) => {
  try {
    const bookings = await Booking.find({ status: 'Pending Approval' })
      .populate('userId', 'name email phone')
      .populate('roomId', 'title roomNumber type')
      .sort({ createdAt: 1 }); // Oldest first for approval queue

    sendSuccess(res, bookings);

  } catch (error) {
    handleError(res, error, "Failed to get pending approvals");
  }
};

// Approve booking
export const approveBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { approvalNotes } = req.body;
    const adminId = req.user._id;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    let booking = await Booking.findById(bookingId)
      .populate('userId')
      .populate('roomId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status !== 'On Hold' && booking.status !== 'Pending Approval') {
      return res.status(400).json({
        success: false,
        message: `Booking status is ${booking.status}, not on hold for approval`,
      });
    }

    // Create invoice for cash payments BEFORE updating booking status
    if (booking.paymentMethod === 'cash') {
      try {
        const InvoiceService = (await import("../../services/payment/invoiceService.js")).default;
        
        // Check if invoice already exists
        if (!booking.invoiceId) {
          // Create invoice if it doesn't exist
          const invoice = await InvoiceService.createInvoiceFromBooking(booking._id);
          booking.invoiceId = invoice._id;
          console.log(`✅ Invoice ${invoice.invoiceNumber} created for cash booking ${booking.bookingNumber}`);
        } else {
          // Update existing invoice status
          await InvoiceService.updateInvoiceStatusFromBooking(booking._id);
          console.log(`✅ Invoice status updated for cash booking ${booking.bookingNumber}`);
        }
      } catch (invoiceError) {
        console.error('❌ Failed to handle invoice for booking:', invoiceError.message);
        // For cash payments, if invoice already exists, that's okay - just log it
        if (invoiceError.message.includes('Invoice already exists')) {
          try {
            const Invoice = (await import("../../models/Invoice.js")).default;
            const existingInvoice = await Invoice.findOne({ bookingId: booking._id }).select('_id invoiceNumber');
            if (existingInvoice) {
              booking.invoiceId = existingInvoice._id;
              console.log(`🔗 Linked existing invoice ${existingInvoice.invoiceNumber} to booking`);
            }
          } catch (linkErr) {
            console.error('❌ Failed to link existing invoice to booking:', linkErr);
          }
        } else {
          console.error('❌ Unexpected invoice error:', invoiceError);
        }
        // Don't fail the approval if invoice handling fails
      }
    } else {
      // For non-cash payments, ensure invoice exists and update its status
      try {
        const InvoiceService = (await import("../../services/payment/invoiceService.js")).default;
        
        if (!booking.invoiceId) {
          // Create invoice if it doesn't exist
          const invoice = await InvoiceService.createInvoiceFromBooking(booking._id);
          booking.invoiceId = invoice._id;
          console.log(`✅ Invoice ${invoice.invoiceNumber} created for booking ${booking.bookingNumber}`);
        } else {
          // Update existing invoice status
          await InvoiceService.updateInvoiceStatusFromBooking(booking._id);
          console.log(`✅ Invoice status updated for booking ${booking.bookingNumber}`);
        }
      } catch (invoiceError) {
        console.error('❌ Failed to handle invoice:', invoiceError);
        // Don't fail approval on invoice errors
      }
    }

    // Update booking status based on payment method
    if (booking.paymentMethod === 'cash') {
      booking.status = 'Approved - Payment Pending'; // Cash bookings are approved but payment is due at hotel
    } else {
      // For card/bank payments, check if payment is already completed
      const existingPayment = await Payment.findOne({
        bookingId: booking._id,
        status: 'completed'
      });

      if (existingPayment) {
        booking.status = 'Confirmed'; // Payment completed, booking confirmed
      } else {
        booking.status = 'Approved - Payment Processing'; // Payment was initiated but not completed
      }
    }

    booking.confirmedAt = new Date();
    booking.confirmedBy = adminId;
    booking.approvalNotes = approvalNotes;
    booking.reviewedBy = adminId;
    booking.reviewedAt = new Date();
    booking.requiresReview = false;

    await booking.save();

    // ✅ Update invoice status to reflect the new booking status
    try {
      const InvoiceService = (await import("../../services/payment/invoiceService.js")).default;
      await InvoiceService.updateInvoiceStatusFromBooking(booking._id);
      console.log(`✅ Invoice status synchronized with booking status: ${booking.status}`);
    } catch (invoiceError) {
      console.error('❌ Failed to update invoice status after approval:', invoiceError);
      // Don't fail the approval if invoice update fails
    }

    // Create pre-check-in record for confirmed bookings
    try {
      await createPreCheckInRecord(booking._id);
      console.log('✅ Pre-check-in record created for approved booking:', booking._id);
    } catch (preCheckInError) {
      console.error('❌ Failed to create pre-check-in record:', preCheckInError);
      // Don't fail the approval if pre-check-in creation fails
    }

    sendSuccess(res, {
      bookingId: booking._id,
      status: booking.status,
      approvedAt: booking.confirmedAt
    }, "Booking approved successfully");

  } catch (error) {
    console.error('Approve booking error:', error);
    handleError(res, error, "Failed to approve booking");
  }
};

// Reject booking
export const rejectBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;
    const adminId = req.user._id;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    let booking = await Booking.findById(bookingId)
      .populate('userId')
      .populate('roomId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status !== 'On Hold' && booking.status !== 'Pending Approval') {
      return res.status(400).json({
        success: false,
        message: `Booking status is ${booking.status}, not on hold for approval`,
      });
    }

    // Update booking status to rejected
    booking.status = 'Rejected';
    booking.rejectedAt = new Date();
    booking.rejectedBy = adminId;
    booking.rejectedReason = reason;
    booking.reviewedBy = adminId;
    booking.reviewedAt = new Date();
    await booking.save();

    // ✅ Update invoice status to cancelled/rejected
    try {
      const InvoiceService = (await import("../../services/payment/invoiceService.js")).default;
      await InvoiceService.updateInvoiceStatusFromBooking(booking._id);
      console.log(`✅ Invoice status updated to reflect rejection`);
    } catch (invoiceError) {
      console.error('❌ Failed to update invoice status after rejection:', invoiceError);
      // Don't fail the rejection if invoice update fails
    }

    // Create refund request automatically
    try {
      const refundRequest = await RefundService.createRefundRequest(booking, reason, adminId);
      if (refundRequest) {
        console.log(`✅ Refund request created for rejected booking ${booking.bookingNumber}`);
      }
    } catch (refundError) {
      console.error('❌ Failed to create refund request:', refundError);
      // Don't fail the rejection if refund creation fails
    }

    // Send notification to guest
    try {
      await NotificationService.sendNotification({
        userId: booking.userId._id,
        userType: booking.userId.role,
        type: 'booking_rejection',
        title: 'Booking Rejected',
        message: `Your booking for ${booking.roomId.title} has been rejected. Reason: ${reason}`,
        channel: 'email',
        metadata: {
          bookingId: booking._id,
          bookingNumber: booking.bookingNumber,
          roomName: booking.roomId.title,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          rejectionReason: reason
        }
      });
    } catch (notificationError) {
      console.error('❌ Failed to send rejection notification:', notificationError);
      // Don't fail the rejection if notification fails
    }

    sendSuccess(res, {
      bookingId: booking._id,
      status: booking.status,
      rejectedAt: booking.rejectedAt
    }, "Booking rejected successfully");

  } catch (error) {
    handleError(res, error, "Failed to reject booking");
  }
};

// Put booking on hold
export const putOnHold = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { holdUntil, reason } = req.body;
    const adminId = req.user._id;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    if (!holdUntil) {
      return res.status(400).json({
        success: false,
        message: "Hold until date is required",
      });
    }

    let booking = await Booking.findById(bookingId)
      .populate('userId')
      .populate('roomId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status !== 'Pending Approval') {
      return res.status(400).json({
        success: false,
        message: `Cannot put booking on hold - status is ${booking.status}`,
      });
    }

    // Update booking status
    booking.status = 'On Hold';
    booking.holdUntil = new Date(holdUntil);
    booking.approvalNotes = reason;
    booking.reviewedBy = adminId;
    booking.reviewedAt = new Date();
    booking.lastStatusChange = new Date();
    await booking.save();

    // Send notification to guest
    await NotificationService.sendNotification({
      userId: booking.userId._id,
      userType: booking.userId.role,
      type: 'booking_on_hold',
      title: 'Booking On Hold',
      message: `Your booking for ${booking.roomId.title} has been put on hold until ${new Date(holdUntil).toLocaleDateString()}.`,
      channel: 'email',
      metadata: {
        bookingId: booking._id,
        bookingNumber: booking.bookingNumber,
        roomName: booking.roomId.title,
        holdUntil: booking.holdUntil
      }
    });

    sendSuccess(res, {
      bookingId: booking._id,
      status: booking.status,
      holdUntil: booking.holdUntil
    }, "Booking put on hold successfully");

  } catch (error) {
    handleError(res, error, "Failed to put booking on hold");
  }
};

// Get booking statistics
export const getBookingStats = async (req, res) => {
  try {
    const { period = 'all' } = req.query; // 'all' for all time, or number of days
    let matchStage = {};

    if (period !== 'all') {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));
      matchStage = {
        createdAt: { $gte: startDate }
      };
    }

    const stats = await Booking.aggregate([
      {
        $match: matchStage
      },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          pendingApprovals: {
            $sum: { $cond: [{ $eq: ["$status", "Pending Approval"] }, 1, 0] }
          },
          confirmed: {
            $sum: { $cond: [{ $in: ["$status", ["Confirmed", "Approved - Payment Pending", "Approved - Payment Processing"]] }, 1, 0] }
          },
          onHold: {
            $sum: { $cond: [{ $eq: ["$status", "On Hold"] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] }
          },
          totalRevenue: { $sum: "$costBreakdown.total" } // Use costBreakdown.total instead of totalPrice
        }
      }
    ]);

    const result = stats[0] || {
      totalBookings: 0,
      pendingApprovals: 0,
      confirmed: 0,
      onHold: 0,
      rejected: 0,
      cancelled: 0,
      totalRevenue: 0
    };

    sendSuccess(res, result);

  } catch (error) {
    handleError(res, error, "Failed to get booking statistics");
  }
};

// Bulk approve bookings
export const bulkApproveBookings = async (req, res) => {
  try {
    console.log('🔄 Bulk approve bookings called with:', req.body);
    const { bookingIds, approvalNotes } = req.body;
    const adminId = req.user._id;

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Booking IDs array is required",
      });
    }

    const results = {
      successful: [],
      failed: [],
      alreadyProcessed: []
    };

    for (const bookingId of bookingIds) {
      try {
        console.log(`🔄 Processing booking ${bookingId} for approval`);
        let booking = await Booking.findById(bookingId)
          .populate('userId')
          .populate('roomId');

        if (!booking) {
          results.failed.push({ bookingId, reason: 'Booking not found' });
          continue;
        }

        if (booking.status !== 'On Hold' && booking.status !== 'Pending Approval') {
          return res.status(400).json({
            success: false,
            message: `Booking status is ${booking.status}, not on hold for approval`,
          });
        }

        // Create invoice for cash payments BEFORE updating booking status
        if (booking.paymentMethod === 'cash') {
          try {
            const InvoiceService = (await import("../../services/payment/invoiceService.js")).default;
            const invoice = await InvoiceService.createInvoiceFromBooking(booking._id);
            booking.invoiceId = invoice._id;
            console.log(`✅ Invoice created for cash booking ${booking.bookingNumber}`);
          } catch (invoiceError) {
            console.error('❌ Failed to create invoice for booking:', invoiceError.message);
            // For cash payments, if invoice already exists, that's okay - just log it
            if (!invoiceError.message.includes('Invoice already exists')) {
              console.error('❌ Unexpected invoice creation error:', invoiceError);
            }
            // Don't fail the approval if invoice creation fails
          }
        }

        // Update booking status based on payment method
        if (booking.paymentMethod === 'cash') {
          booking.status = 'Approved - Payment Pending'; // Cash bookings are approved but payment is due at hotel
        } else {
          // For card/bank payments, check if payment is already completed
          const existingPayment = await Payment.findOne({
            bookingId: booking._id,
            status: 'completed'
          });

          if (existingPayment) {
            booking.status = 'Confirmed'; // Payment completed, booking confirmed
          } else {
            booking.status = 'Approved - Payment Processing'; // Payment was initiated but not completed
          }
        }

        booking.confirmedAt = new Date();
        booking.confirmedBy = adminId;
        booking.approvalNotes = approvalNotes;
        booking.reviewedBy = adminId;
        booking.reviewedAt = new Date();
        booking.requiresReview = false;

        await booking.save();
        console.log(` Booking ${booking.bookingNumber} (${booking._id}) status updated to Accepted`);

        // Create pre-check-in record for confirmed bookings
        try {
          await createPreCheckInRecord(booking._id);
          console.log(' Pre-check-in record created for bulk approved booking:', booking._id);
        } catch (preCheckInError) {
          console.error(' Failed to create pre-check-in record for bulk approval:', preCheckInError);
          // Don't fail the approval if pre-check-in creation fails
        }

        // Send notification to guest
        try {
          await NotificationService.sendNotification({
            userId: booking.userId._id,
            userType: booking.userId.role,
            type: 'booking_approval',
            title: 'Booking Approved',
            message: `Your booking for ${booking.roomId.title} has been approved!`,
            channel: 'email',
            metadata: {
              bookingId: booking._id,
              bookingNumber: booking.bookingNumber,
              roomName: booking.roomId.title,
              checkIn: booking.checkIn,
              checkOut: booking.checkOut,
              totalAmount: booking.totalPrice
            }
          });
        } catch (notificationError) {
          console.error('❌ Failed to send bulk approval notification:', notificationError);
          // Don't fail the approval if notification fails
        }

        results.successful.push({
          bookingId: booking._id,
          bookingNumber: booking.bookingNumber
        });

      } catch (error) {
        results.failed.push({
          bookingId,
          reason: error.message
        });
      }
    }

    sendSuccess(res, {
      message: `Bulk approval completed. ${results.successful.length} approved, ${results.failed.length} failed, ${results.alreadyProcessed.length} already processed`,
      results
    });

  } catch (error) {
    handleError(res, error, "Failed to bulk approve bookings");
  }
};

// Bulk reject bookings
export const bulkRejectBookings = async (req, res) => {
  try {
    console.log('❌ Bulk reject bookings called with:', req.body);
    const { bookingIds, reason } = req.body;
    const adminId = req.user._id;

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Booking IDs array is required",
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const results = {
      successful: [],
      failed: [],
      alreadyProcessed: []
    };

    for (const bookingId of bookingIds) {
      try {
        let booking = await Booking.findById(bookingId)
          .populate('userId')
          .populate('roomId');

        if (!booking) {
          results.failed.push({ bookingId, reason: 'Booking not found' });
          continue;
        }

        if (booking.status !== 'On Hold' && booking.status !== 'Pending Approval') {
          results.alreadyProcessed.push({
            bookingId,
            reason: `Booking status is ${booking.status}, not on hold for approval`
          });
          continue;
        }

        // Update booking status to rejected
        booking.status = 'Rejected';
        booking.rejectedAt = new Date();
        booking.rejectedBy = adminId;
        booking.rejectedReason = reason;
        booking.reviewedBy = adminId;
        booking.reviewedAt = new Date();
        await booking.save();
        console.log(`❌ Booking ${booking.bookingNumber} (${booking._id}) status updated to Rejected`);

        // Create refund request automatically
        try {
          const refundRequest = await RefundService.createRefundRequest(booking, reason, adminId);
          if (refundRequest) {
            console.log(`✅ Refund request created for rejected booking ${booking.bookingNumber}`);
          }
        } catch (refundError) {
          console.error('❌ Failed to create refund request:', refundError);
          // Don't fail the rejection if refund creation fails
        }

        // Send notification to guest
        try {
          await NotificationService.sendNotification({
            userId: booking.userId._id,
            userType: booking.userId.role,
            type: 'booking_rejection',
            title: 'Booking Rejected',
            message: `Your booking for ${booking.roomId.title} has been rejected. Reason: ${reason}`,
            channel: 'email',
            metadata: {
              bookingId: booking._id,
              bookingNumber: booking.bookingNumber,
              roomName: booking.roomId.title,
              checkIn: booking.checkIn,
              checkOut: booking.checkOut,
              rejectionReason: reason
            }
          });
        } catch (notificationError) {
          console.error('❌ Failed to send bulk rejection notification:', notificationError);
          // Don't fail the rejection if notification fails
        }

        results.successful.push({
          bookingId: booking._id,
          bookingNumber: booking.bookingNumber
        });

      } catch (error) {
        results.failed.push({
          bookingId,
          reason: error.message
        });
      }
    }

    sendSuccess(res, {
      message: `Bulk rejection completed. ${results.successful.length} rejected, ${results.failed.length} failed, ${results.alreadyProcessed.length} already processed`,
      results
    });

  } catch (error) {
    handleError(res, error, "Failed to bulk reject bookings");
  }
};

// Bulk put bookings on hold
export const bulkHoldBookings = async (req, res) => {
  try {
    console.log('⏸️ Bulk hold bookings called with:', req.body);
    const { bookingIds, holdUntil, reason } = req.body;
    const adminId = req.user._id;

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Booking IDs array is required",
      });
    }

    if (!holdUntil) {
      return res.status(400).json({
        success: false,
        message: "Hold until date is required",
      });
    }

    const results = {
      successful: [],
      failed: [],
      alreadyProcessed: []
    };

    for (const bookingId of bookingIds) {
      try {
        console.log(`⏸️ Processing booking ${bookingId}`);
        let booking = await Booking.findById(bookingId)
          .populate('userId')
          .populate('roomId');

        if (!booking) {
          console.log(`❌ Booking ${bookingId} not found`);
          results.failed.push({ bookingId, reason: 'Booking not found' });
          continue;
        }

        console.log(`📋 Found booking ${booking.bookingNumber} with status ${booking.status}`);

        if (booking.status !== 'Pending Approval') {
          console.log(`⚠️ Booking ${booking.bookingNumber} status is ${booking.status}, not pending approval`);
          results.alreadyProcessed.push({
            bookingId,
            reason: `Cannot put booking on hold - status is ${booking.status}`
          });
          continue;
        }

        // Update booking status
        booking.status = 'On Hold';
        booking.holdUntil = new Date(holdUntil);
        booking.approvalNotes = reason;
        booking.reviewedBy = adminId;
        booking.reviewedAt = new Date();
        booking.lastStatusChange = new Date();
        await booking.save();
        console.log(`⏸️ Booking ${booking.bookingNumber} (${booking._id}) status updated to On Hold`);

        // Send notification to guest
        await NotificationService.sendNotification({
          userId: booking.userId._id,
          userType: booking.userId.role,
          type: 'booking_on_hold',
          title: 'Booking On Hold',
          message: `Your booking for ${booking.roomId.title} has been put on hold until ${new Date(holdUntil).toLocaleDateString()}.`,
          channel: 'email',
          metadata: {
            bookingId: booking._id,
            bookingNumber: booking.bookingNumber,
            roomName: booking.roomId.title,
            holdUntil: booking.holdUntil
          }
        });

        results.successful.push({
          bookingId: booking._id,
          bookingNumber: booking.bookingNumber
        });

      } catch (error) {
        console.error(`❌ Error processing booking ${bookingId}:`, error);
        results.failed.push({
          bookingId,
          reason: error.message
        });
      }
    }

    sendSuccess(res, {
      message: `Bulk hold completed. ${results.successful.length} put on hold, ${results.failed.length} failed, ${results.alreadyProcessed.length} already processed`,
      results
    });

  } catch (error) {
    handleError(res, error, "Failed to bulk hold bookings");
  }
};

// Process booking payment
export const processBookingPayment = async (req, res) => {
  try {
    const { bookingNumber } = req.params;
    const { paymentMethod } = req.body;
    const userId = req.user._id;

    if (!bookingNumber) {
      return res.status(400).json({
        success: false,
        message: "Booking number is required",
      });
    }

    // Find the booking by booking number (not ObjectId)
    const booking = await Booking.findOne({
      bookingNumber: bookingNumber,
      userId: userId
    }).populate('roomId', 'title roomNumber type');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if booking is already accepted (has successful payment)
    if (booking.status === 'Confirmed' || booking.status === 'Approved - Payment Processing' || booking.status === 'Approved - Payment Pending') {
      // Check if there's already a successful payment for card/bank bookings
      if (booking.paymentMethod !== 'cash') {
        const existingPayment = await Payment.findOne({
          bookingId: booking._id,
          status: 'completed'
        });

        if (existingPayment) {
          return res.status(400).json({
            success: false,
            message: "Payment has already been completed for this booking",
            existingPayment: existingPayment._id
          });
        }

        // If no successful payment exists, allow re-processing
        console.log('Booking is confirmed but no successful payment found, allowing re-processing');
      } else {
        // For cash bookings that are already confirmed, don't allow re-processing
        return res.status(400).json({
          success: false,
          message: "Cash payment booking is already confirmed",
        });
      }
    }

    // Check if booking is cancelled or rejected
    if (booking.status === 'Cancelled' || booking.status === 'Rejected') {
      return res.status(400).json({
        success: false,
        message: `Cannot process payment for ${booking.status.toLowerCase()} booking`,
      });
    }

    // Debug logging
    console.log('Payment method received:', paymentMethod);
    console.log('Request body:', req.body);
    console.log('Request params:', req.params);
    console.log('Request user:', req.user);

    // Validate payment method
    if (!paymentMethod) {
      console.error('Payment method is missing from request body');
      return res.status(400).json({
        success: false,
        message: "Payment method is required",
        debug: {
          requestBody: req.body,
          requestParams: req.params,
          requestUser: req.user ? req.user._id : null
        }
      });
    }

    const validPaymentMethods = ['card', 'cash', 'bank', 'paypal'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment method: ${paymentMethod}. Must be one of: ${validPaymentMethods.join(', ')}`,
      });
    }

    // For card and PayPal payments, initiate PayHere payment
    if (paymentMethod === 'card' || paymentMethod === 'paypal') {
      // Check room availability before processing payment
      const availability = await RoomService.checkRoomAvailability(booking.roomId, booking.checkIn, booking.checkOut);
      if (!availability.available) {
        return res.status(400).json({
          success: false,
          message: availability.reason,
          conflicts: availability.conflicts,
          operationalHours: availability.operationalHours
        });
      }

      // Create invoice for the booking when payment begins (optional)
      try {
        const InvoiceService = (await import("../../services/payment/invoiceService.js")).default;
        const invoice = await InvoiceService.createInvoiceFromBooking(booking._id);
        booking.invoiceId = invoice._id;
        await booking.save();
        console.log(`✅ Invoice created for booking ${booking.bookingNumber}`);
      } catch (invoiceError) {
        console.warn('⚠️ Failed to create invoice for payment (continuing anyway):', invoiceError.message);
        // Continue with payment processing even if invoice creation fails
      }

      const paymentSession = await payHereService.createPaymentSession({
        orderId: booking.bookingNumber,
        amount: booking.totalPrice,
        currency: 'LKR',
        customerName: req.user.name,
        customerEmail: req.user.email,
        customerPhone: req.user.phone,
        items: [{
          name: `Room ${booking.roomId.roomNumber} - ${booking.roomId.title}`,
          quantity: 1,
          price: booking.totalPrice
        }],
        custom1: userId,
        custom2: bookingNumber,
      });

      // Save payment record
      const payment = new Payment({
        orderId: booking.bookingNumber,
        userId,
        bookingId: booking._id, // Use MongoDB ObjectId, not booking number
        amount: booking.totalPrice,
        currency: 'LKR',
        provider: paymentMethod === 'paypal' ? 'paypal' : 'payhere',
        status: 'pending',
        paymentData: paymentSession,
      });

      await payment.save();

      // Update booking status to On Hold for admin approval
      booking.status = 'On Hold';
      booking.holdUntil = new Date(Date.now() + 60 * 60 * 1000); // 1 hour hold for admin approval
      booking.lastStatusChange = new Date();
      await booking.save();

      sendSuccess(res, {
        paymentId: payment._id,
        paymentSession,
        bookingId: booking._id,
        bookingNumber: booking.bookingNumber,
        amount: booking.totalPrice
      }, "Payment initiated successfully");

    } else if (paymentMethod === 'cash' || paymentMethod === 'bank') {
      // For cash and bank payments
      const originalPaymentMethod = booking.paymentMethod;

      // If changing from card/paypal to cash/bank, reset status to Pending Approval
      if ((originalPaymentMethod === 'card' || originalPaymentMethod === 'paypal') &&
          (paymentMethod === 'cash' || paymentMethod === 'bank') &&
          booking.status === 'Confirmed') {
        console.log(`🔄 Payment method changed from ${originalPaymentMethod} to ${paymentMethod}, resetting status to Pending Approval`);
        booking.status = 'Pending Approval';
        booking.invoiceId = undefined; // Remove invoice reference since status changed
        // TODO: Maybe cancel the existing invoice or mark it as void
      }
      // If changing from cash/bank to card/paypal, set to On Hold for admin approval
      else if ((originalPaymentMethod === 'cash' || originalPaymentMethod === 'bank') &&
               (paymentMethod === 'card' || paymentMethod === 'paypal') &&
               booking.status === 'Pending Approval') {
        console.log(`🔄 Payment method changed from ${originalPaymentMethod} to ${paymentMethod}, setting status to On Hold for admin approval`);
        booking.status = 'On Hold';
        booking.holdUntil = new Date(Date.now() + 60 * 60 * 1000); // 1 hour hold for admin approval
      }
      // If changing from cash/bank to cash/bank, keep existing status
      // If booking is already confirmed, keep it confirmed

      booking.paymentMethod = paymentMethod;
      booking.lastStatusChange = new Date();
      await booking.save();

      // ✅ Sync linked invoice payment method and status
      try {
        const Invoice = (await import("../../models/Invoice.js")).default;
        let invoice = await Invoice.findOne({ bookingId: booking._id });
        if (!invoice) {
          // Create invoice if it doesn't exist yet
          const InvoiceService = (await import("../../services/payment/invoiceService.js")).default;
          invoice = await InvoiceService.createInvoiceFromBooking(booking._id);
        }
        if (invoice) {
          // Update payment method to reflect user's choice
          // Map to enum via service mapping by reusing create/update logic
          const mapped = ((pm) => {
            switch ((pm || '').toLowerCase()) {
              case 'cash': return 'Cash';
              case 'card': return 'Credit Card';
              case 'paypal': return 'Online';
              case 'bank': return 'Online';
              default: return 'Online';
            }
          })(paymentMethod);
          invoice.paymentMethod = mapped;
          await invoice.save();

          // Also align invoice status with booking status
          const InvoiceService = (await import("../../services/payment/invoiceService.js")).default;
          await InvoiceService.updateInvoiceStatusFromBooking(booking._id);
        }
      } catch (syncErr) {
        console.error('⚠️ Failed to sync invoice after payment method change:', syncErr.message);
      }

      sendSuccess(res, {
        bookingId: booking._id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        paymentMethod: booking.paymentMethod,
        requiresApproval: booking.status !== 'Confirmed',
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guests: booking.guests,
        totalAmount: booking.totalPrice,
        roomTitle: booking.roomId?.title,
        roomNumber: booking.roomId?.roomNumber,
        specialRequests: booking.specialRequests,
        foodPlan: booking.foodPlan
      }, "Payment method updated successfully");
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

  } catch (error) {
    handleError(res, error, "Failed to process booking payment");
  }
};

// Get existing bookings for a specific room (for calendar display)
export const getRoomBookings = async (req, res) => {
  try {
    const { roomId } = req.params;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: "Room ID is required"
      });
    }

    // Get all active bookings for this room (excluding cancelled and rejected)
    const bookings = await Booking.find({
      roomId: roomId,
      status: { 
        $nin: ['Cancelled', 'Rejected'] 
      }
    })
    .select('checkIn checkOut status')
    .sort({ checkIn: 1 });

    // Format the bookings to include date ranges
    const bookedDates = bookings.map(booking => ({
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      status: booking.status
    }));

    res.status(200).json({
      success: true,
      data: bookedDates,
      message: "Room bookings fetched successfully"
    });

  } catch (error) {
    handleError(res, error, "Failed to fetch room bookings");
  }
};