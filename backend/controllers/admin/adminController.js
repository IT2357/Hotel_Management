// 📁 backend/controllers/admin/adminController.js
import AdminService from "../../services/admin/adminService.js";
import NotificationService from "../../services/notification/notificationService.js";

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
    const { email, role, expiresInHours = 24 } = req.body;

    // Input validation
    if (!email || !role) {
      return res.status(400).json({
        success: false,
        message: "Email and role are required",
      });
    }

    const result = await AdminService.createInvitation({
      email,
      role,
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

    const result = await AdminService.getUsers({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      role,
      isApproved: isApproved !== undefined ? isApproved === "true" : undefined,
      search,
    });

    sendSuccess(res, result);
  } catch (error) {
    handleError(res, error, "Failed to get users");
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
};
