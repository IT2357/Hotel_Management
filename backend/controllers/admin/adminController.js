// 📁 backend/controllers/admin/adminController.js
import AdminService from "../../services/admin/adminService.js";
import NotificationService from "../../services/notification/notificationService.js";
import RefundService from "../../services/payment/refundService.js";
import RefundRequest from "../../models/RefundRequest.js";

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

// Create privileged user
export const createPrivilegedUser = async (req, res) => {
  try {
    const { name, email, password, phone, role, permissions } = req.body;

    // Input validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, and role are required",
      });
    }

    const result = await AdminService.createPrivilegedUser({
      name,
      email,
      password,
      phone,
      role,
      permissions,
      requestingAdminId: req.user._id,
    });

    sendSuccess(res, result, result.message, 201);
  } catch (error) {
    handleError(res, error, "Failed to create user");
  }
};

// Approve pending user
export const approveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, permissions } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const result = await AdminService.approveUser(
      userId,
      { role, permissions },
      req.user._id
    );

    sendSuccess(res, result, result.message);
  } catch (error) {
    handleError(res, error, "Failed to approve user");
  }
};

// Create invitation
export const createInvitation = async (req, res) => {
  try {
    const { email, role, department, position, permissions, expiresInHours = 24 } = req.body;

    // Input validation
    if (!email || !role) {
      return res.status(400).json({
        success: false,
        message: "Email and role are required",
      });
    }

    // Additional validation for staff role
    if (role === "staff" && (!department || !position)) {
      return res.status(400).json({
        success: false,
        message: "Department and position are required for staff invites",
      });
    }

    const result = await AdminService.createInvitation({
      email,
      role,
      department,
      position,
      permissions,
      expiresInHours,
      createdBy: req.user._id,
    });

    sendSuccess(res, result, result.message, 201);
  } catch (error) {
    handleError(res, error, "Failed to create invitation");
  }
};

// Get invitations
export const getInvitations = async (req, res) => {
  try {
    const { status, email } = req.query;
    const invitations = await AdminService.getInvitations({ status, email });
    sendSuccess(res, invitations);
  } catch (error) {
    handleError(res, error, "Failed to get invitations");
  }
};

// Update invitation
export const updateInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invitation ID is required",
      });
    }

    const invitation = await AdminService.updateInvitation(id, updates);
    sendSuccess(res, invitation, "Invitation updated successfully");
  } catch (error) {
    handleError(res, error, "Failed to update invitation");
  }
};

// Delete invitation
export const deleteInvitation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invitation ID is required",
      });
    }

    const result = await AdminService.deleteInvitation(id);
    res.status(204).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    handleError(res, error, "Failed to delete invitation");
  }
};

// Get pending approvals
export const getPendingApprovals = async (req, res) => {
  try {
    const pendingUsers = await AdminService.getPendingApprovals();
    sendSuccess(res, pendingUsers);
  } catch (error) {
    handleError(res, error, "Failed to get pending approvals");
  }
};

// Get all users with filtering and pagination
export const getUsers = async (req, res) => {
  try {
    const { page, limit, role, isApproved, search } = req.query;

    // Convert isApproved to boolean only if it's "true" or "false"
    let approvalFilter;
    if (isApproved === "true") approvalFilter = true;
    else if (isApproved === "false") approvalFilter = false;
    // Otherwise leave undefined to show all users

    const result = await AdminService.getUsers({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      role,
      isApproved: approvalFilter,
      search,
      requestingAdminId: req.user._id,
    });

    sendSuccess(res, result);
  } catch (error) {
    handleError(res, error, "Failed to get users");
  }
};

// Get user statistics
export const getUserStats = async (req, res) => {
  try {
    const { User } = await import("../../models/User.js");

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const staffUsers = await User.countDocuments({ role: 'staff' });
    const managerUsers = await User.countDocuments({ role: 'manager' });
    const guestUsers = await User.countDocuments({ role: 'guest' });

    sendSuccess(res, {
      totalUsers,
      activeUsers,
      adminUsers,
      staffUsers,
      managerUsers,
      guestUsers
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch user stats");
  }
};

// Update user role
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, permissions } = req.body;

    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        message: "User ID and role are required",
      });
    }

    const result = await AdminService.updateUserRole(
      userId,
      role,
      permissions,
      req.user._id
    );

    sendSuccess(res, result, result.message);
  } catch (error) {
    handleError(res, error, "Failed to update user role");
  }
};

// Deactivate user
export const deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const result = await AdminService.deactivateUser(userId, reason);
    sendSuccess(res, result, result.message);
  } catch (error) {
    handleError(res, error, "Failed to deactivate user");
  }
};

// Reactivate user
export const reactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const result = await AdminService.reactivateUser(userId);
    sendSuccess(res, result, result.message);
  } catch (error) {
    handleError(res, error, "Failed to reactivate user");
  }
};

// Delete user account (with strong confirmation)
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { confirmationText, reason } = req.body;
    console.log("Raw body:", req.body);
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (confirmationText !== "DELETE") {
      return res.status(400).json({
        success: false,
        message: "Confirmation text must be exactly 'DELETE'",
      });
    }

    const result = await AdminService.deleteUser(userId, reason, req.user._id);
    sendSuccess(res, result, result.message);
  } catch (error) {
    handleError(res, error, "Failed to delete user");
  }
};

// Get user details with profile
export const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const result = await AdminService.getUserDetails(userId);
    sendSuccess(res, result);
  } catch (error) {
    handleError(res, error, "Failed to get user details");
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const result = await AdminService.updateUserProfile(
      userId,
      updates,
      req.user._id
    );
    sendSuccess(res, result, result.message);
  } catch (error) {
    handleError(res, error, "Failed to update user profile");
  }
};

// Get user activity logs
export const getUserActivityLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page, limit } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const result = await AdminService.getUserActivityLogs(userId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    sendSuccess(res, result);
  } catch (error) {
    handleError(res, error, "Failed to get user activity logs");
  }
};

// Reset user password (admin action)
export const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { temporaryPassword, requirePasswordChange = true } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const result = await AdminService.resetUserPassword(
      userId,
      temporaryPassword,
      requirePasswordChange,
      req.user._id
    );
    sendSuccess(res, result, result.message);
  } catch (error) {
    handleError(res, error, "Failed to reset user password");
  }
};

export const updateUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;
    if (!userId || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "User ID and new password are required",
      });
    }
    // Verify user is updating their own password
    if (userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this user’s password",
      });
    }
    const result = await AdminService.updateUserPassword(userId, newPassword);
    sendSuccess(res, result, result.message);
  } catch (error) {
    handleError(res, error, "Failed to update user password");
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const stats = await AdminService.getDashboardStats();
    sendSuccess(res, stats);
  } catch (error) {
    handleError(res, error, "Failed to get dashboard statistics");
  }
};

// ===== NOTIFICATION MANAGEMENT METHODS =====

// Send bulk admin notifications
export const sendAdminNotification = async (req, res) => {
  try {
    const {
      userIds,
      title,
      message,
      channel = "inApp",
      priority = "medium",
    } = req.body;

    // Input validation
    if (!userIds || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "userIds, title, and message are required",
      });
    }

    const result = await NotificationService.sendBulkNotifications({
      userIds,
      title,
      message,
      channel,
      priority,
      sentBy: req.user._id,
    });

    sendSuccess(res, result, `Sent ${result.sent} notifications`);
  } catch (error) {
    handleError(res, error, "Failed to send notifications");
  }
};

// Get all notifications (admin view)
export const getAllNotifications = async (req, res) => {
  try {
    const { page, limit, userType, channel, priority } = req.query;

    const result = await NotificationService.getAdminNotifications({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      userType,
      channel,
      priority,
    });

    sendSuccess(res, result);
  } catch (error) {
    handleError(res, error, "Failed to get notifications");
  }
};

// Get notification statistics
export const getNotificationStats = async (req, res) => {
  try {
    const stats = await NotificationService.getNotificationStatistics();
    sendSuccess(res, stats);
  } catch (error) {
    handleError(res, error, "Failed to get notification stats");
  }
};

// Get notification templates
export const getNotificationTemplates = async (req, res) => {
  try {
    const templates = await NotificationService.getNotificationTemplates();
    sendSuccess(res, templates);
  } catch (error) {
    handleError(res, error, "Failed to get templates");
  }
};

// Create notification template
export const createNotificationTemplate = async (req, res) => {
  try {
    const templateData = req.body;

    if (!templateData.type || !templateData.channel) {
      return res.status(400).json({
        success: false,
        message: "Template type and channel are required",
      });
    }

    const template = await NotificationService.createNotificationTemplate(
      templateData
    );
    sendSuccess(res, template, "Template created successfully", 201);
  } catch (error) {
    handleError(res, error, "Failed to create template");
  }
};

// Update notification template
export const updateNotificationTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Template ID is required",
      });
    }

    const template = await NotificationService.updateNotificationTemplate(
      id,
      updates
    );
    sendSuccess(res, template, "Template updated successfully");
  } catch (error) {
    handleError(res, error, "Failed to update template");
  }
};

// Delete notification template
export const deleteNotificationTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Template ID is required",
      });
    }

    const result = await NotificationService.deleteNotificationTemplate(id);
    res.status(204).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    handleError(res, error, "Failed to delete template");
  }
};

// Get all pending refund requests
export const getPendingRefunds = async (req, res) => {
  try {
    const refundRequests = await RefundService.getRefundRequests({ status: 'pending' });
    sendSuccess(res, refundRequests);
  } catch (error) {
    handleError(res, error, "Failed to get pending refunds");
  }
};

// Get all refunds with optional filtering
export const getRefunds = async (req, res) => {
  try {
    const { status, dateFrom, dateTo, search, page = 1, limit = 20 } = req.query;
    const refundRequests = await RefundService.getRefundRequests({
      status,
      dateFrom,
      dateTo,
      search
    });

    console.log('📋 Refund requests found:', refundRequests.length);
    console.log('📋 First few refunds:', refundRequests.slice(0, 3).map(r => ({
      id: r._id,
      status: r.status,
      amount: r.amount,
      hasApprovedBy: !!r.approvedBy,
      hasDeniedBy: !!r.deniedBy,
      createdAt: r.createdAt
    })));

    // Manual pagination since RefundService doesn't handle it yet
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRefunds = refundRequests.slice(startIndex, endIndex);

    console.log('📋 Paginated refunds:', paginatedRefunds.length);

    sendSuccess(res, {
      refunds: paginatedRefunds,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(refundRequests.length / limit),
        totalRefunds: refundRequests.length,
        hasNext: endIndex < refundRequests.length,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    handleError(res, error, "Failed to get refunds");
  }
};

// Get specific refund details
export const getRefundDetails = async (req, res) => {
  try {
    const { id: refundId } = req.params; // Change from refundId to id to match route parameter

    console.log('📋 getRefundDetails called with:', { refundId, params: req.params });

    if (!refundId) {
      console.log('📋 No refundId provided in params:', req.params);
      return res.status(400).json({
        success: false,
        message: "Refund ID is required",
      });
    }

    const refund = await RefundRequest.findById(refundId)
      .populate('bookingId', 'bookingNumber checkIn checkOut totalPrice')
      .populate('guestId', 'name email')
      .populate('approvedBy', 'name')
      .populate('deniedBy', 'name');

    if (!refund) {
      console.log('📋 Refund not found:', refundId);
      return res.status(404).json({
        success: false,
        message: "Refund request not found",
      });
    }

    console.log('📋 Refund found:', { id: refund._id, status: refund.status });
    sendSuccess(res, refund);
  } catch (error) {
    console.error('📋 Error in getRefundDetails:', error);
    handleError(res, error, "Failed to get refund details");
  }
};

// Approve refund
export const approveRefund = async (req, res) => {
  try {
    const { id: refundId } = req.params; // Change from refundId to id to match route parameter
    const adminId = req.user._id;

    console.log('📋 approveRefund called with:', { refundId, adminId, params: req.params, user: req.user });

    if (!refundId) {
      console.log('📋 No refundId provided in params:', req.params);
      return res.status(400).json({
        success: false,
        message: "Refund ID is required",
      });
    }

    const refund = await RefundService.approveRefund(refundId, adminId);
    console.log('📋 Refund approved successfully:', refund._id);
    sendSuccess(res, refund, "Refund approved successfully");
  } catch (error) {
    console.error('📋 Error in approveRefund:', error);
    handleError(res, error, "Failed to approve refund");
  }
};

// Deny refund with reason
export const denyRefund = async (req, res) => {
  try {
    const { id: refundId } = req.params;
    const { reason } = req.body;
    const adminId = req.user._id;

    console.log('📋 denyRefund called with:', { refundId, reason, adminId, params: req.params });

    if (!refundId || !reason) {
      console.log('📋 Missing parameters:', { refundId, reason });
      return res.status(400).json({
        success: false,
        message: "Refund ID and reason are required",
      });
    }

    const refund = await RefundService.denyRefund(refundId, adminId, reason);
    console.log('📋 Refund denied successfully:', refund._id);
    sendSuccess(res, refund, "Refund denied successfully");
  } catch (error) {
    console.error('📋 Error in denyRefund:', error);
    handleError(res, error, "Failed to deny refund");
  }
};

// Request more information
export const requestMoreInfo = async (req, res) => {
  try {
    const { id: refundId } = req.params;
    const { infoRequested } = req.body;
    const adminId = req.user._id;

    console.log('📋 requestMoreInfo called with:', { refundId, infoRequested, adminId, params: req.params });

    if (!refundId || !infoRequested) {
      console.log('📋 Missing parameters:', { refundId, infoRequested });
      console.log('📋 Request body:', req.body);
      console.log('📋 Request headers:', req.headers['content-type']);
      return res.status(400).json({
        success: false,
        message: "Refund ID and information request details are required",
      });
    }

    const refund = await RefundRequest.findById(refundId);
    if (!refund) {
      console.log('📋 Refund not found:', refundId);
      return res.status(404).json({
        success: false,
        message: "Refund request not found",
      });
    }

    if (refund.status !== 'pending') {
      console.log('📋 Refund status check failed:', { refundId, currentStatus: refund.status });
      return res.status(400).json({
        success: false,
        message: `Refund is already ${refund.status}`,
      });
    }

    refund.status = 'info_requested';
    refund.infoRequested = infoRequested;
    refund.infoRequestedBy = adminId;
    refund.infoRequestedAt = new Date();
    await refund.save();

    console.log('📋 Information request sent successfully:', refund._id);
    sendSuccess(res, refund, "Information request sent successfully");
  } catch (error) {
    console.error('📋 Error in requestMoreInfo:', error);
    handleError(res, error, "Failed to request more information");
  }
};

// Process refund
export const processRefund = async (req, res) => {
  try {
    const { id: refundId } = req.params;
    const { gatewayResponse } = req.body;

    console.log('📋 processRefund called with:', { refundId, gatewayResponse, params: req.params });

    if (!refundId) {
      console.log('📋 No refundId provided in params:', req.params);
      return res.status(400).json({
        success: false,
        message: "Refund ID is required",
      });
    }

    const refund = await RefundRequest.findById(refundId);
    if (!refund) {
      console.log('📋 Refund not found:', refundId);
      return res.status(404).json({
        success: false,
        message: "Refund request not found",
      });
    }

    if (refund.status !== 'approved') {
      console.log('📋 Refund status check failed:', { refundId, currentStatus: refund.status });
      return res.status(400).json({
        success: false,
        message: `Refund must be approved before processing. Current status: ${refund.status}`,
      });
    }

    refund.status = 'processed';
    refund.processedAt = new Date();
    refund.gatewayResponse = gatewayResponse;
    await refund.save();

    console.log('📋 Refund processed successfully:', refund._id);
    sendSuccess(res, refund, "Refund processed successfully");
  } catch (error) {
    console.error('📋 Error in processRefund:', error);
    handleError(res, error, "Failed to process refund");
  }
};

// Check refund status
export const checkRefundStatus = async (req, res) => {
  try {
    const { id: refundId } = req.params;

    console.log('📋 checkRefundStatus called with:', { refundId, params: req.params });

    if (!refundId) {
      console.log('📋 No refundId provided in params:', req.params);
      return res.status(400).json({
        success: false,
        message: "Refund ID is required",
      });
    }

    const refund = await RefundRequest.findById(refundId)
      .populate('bookingId', 'bookingNumber')
      .populate('guestId', 'name email');

    if (!refund) {
      console.log('📋 Refund not found:', refundId);
      return res.status(404).json({
        success: false,
        message: "Refund request not found",
      });
    }

    console.log('📋 Refund status retrieved successfully:', { id: refund._id, status: refund.status });
    sendSuccess(res, refund, "Refund status retrieved successfully");
  } catch (error) {
    console.error('📋 Error in checkRefundStatus:', error);
    handleError(res, error, "Failed to check refund status");
  }
};

// ===== BOOKING MANAGEMENT METHODS =====

// Get all bookings with filtering and pagination
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

    // Import Booking model dynamically
    const Booking = (await import("../../models/Booking.js")).default;
    const { User } = await import("../../models/User.js");

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
export const getPendingBookingApprovals = async (req, res) => {
  try {
    const Booking = (await import("../../models/Booking.js")).default;

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

    const Booking = (await import("../../models/Booking.js")).default;

    const booking = await Booking.findById(bookingId)
      .populate('userId')
      .populate('roomId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status !== 'On Hold') {
      return res.status(400).json({
        success: false,
        message: `Booking status is ${booking.status}, not on hold for approval`,
      });
    }

    // Update booking status
    booking.status = 'Accepted';
    booking.confirmedAt = new Date();
    booking.confirmedBy = adminId;
    booking.approvalNotes = approvalNotes;
    booking.reviewedBy = adminId;
    booking.reviewedAt = new Date();
    booking.requiresReview = false;
    await booking.save();

    // Create invoice for cash payments when booking is approved
    if (booking.paymentMethod === 'cash') {
      try {
        const InvoiceService = (await import("../../services/payment/invoiceService.js")).default;
        const invoice = await InvoiceService.createInvoiceFromBooking(booking._id);
        booking.invoiceId = invoice._id;
        await booking.save();
        console.log(`✅ Invoice created for approved cash booking ${booking.bookingNumber}`);
      } catch (invoiceError) {
        console.error('❌ Failed to create invoice for approved booking:', invoiceError);
        // Don't fail the approval if invoice creation fails
      }
    }

    // Send notification to guest
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

    sendSuccess(res, {
      bookingId: booking._id,
      status: booking.status,
      approvedAt: booking.confirmedAt
    }, "Booking approved successfully");

  } catch (error) {
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

    const Booking = (await import("../../models/Booking.js")).default;

    const booking = await Booking.findById(bookingId)
      .populate('userId')
      .populate('roomId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status !== 'On Hold') {
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

    const Booking = (await import("../../models/Booking.js")).default;

    const booking = await Booking.findById(bookingId)
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
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const Booking = (await import("../../models/Booking.js")).default;

    const stats = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          pendingApprovals: {
            $sum: { $cond: [{ $eq: ["$status", "Pending Approval"] }, 1, 0] }
          },
          confirmed: {
            $sum: { $cond: [{ $eq: ["$status", "Accepted"] }, 1, 0] }
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
          totalRevenue: { $sum: "$totalPrice" }
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

export default {
  createPrivilegedUser,
  approveUser,
  createInvitation,
  getInvitations,
  updateInvitation,
  deleteInvitation,
  getPendingApprovals,
  getUsers,
  updateUserRole,
  deactivateUser,
  reactivateUser,
  deleteUser,
  getUserDetails,
  updateUserProfile,
  getUserActivityLogs,
  resetUserPassword,
  getDashboardStats,
  sendAdminNotification,
  getAllNotifications,
  getNotificationStats,
  getNotificationTemplates,
  createNotificationTemplate,
  updateNotificationTemplate,
  deleteNotificationTemplate,
  getPendingRefunds,
  getRefunds,
  getRefundDetails,
  approveRefund,
  denyRefund,
  requestMoreInfo,
  processRefund,
  checkRefundStatus,
  // Booking management
  getAllBookings,
  getPendingBookingApprovals,
  approveBooking,
  rejectBooking,
  putOnHold,
  getBookingStats,
};
