// 📁 backend/controllers/notification/notificationController.js
import NotificationService from "../services/notification/notificationService.js";

// Helper for consistent error responses
const handleError = (res, error, defaultMessage = "Operation failed") => {
  console.error(`${defaultMessage}:`, error);

  const statusCode = error.message.includes("not found")
    ? 404
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

// ==============================================
// NOTIFICATION OPERATIONS
// ==============================================

export const sendNotification = async (req, res) => {
  try {
    const notificationData = req.body;

    if (
      !notificationData.userId ||
      !notificationData.type ||
      !notificationData.title ||
      !notificationData.message
    ) {
      return res.status(400).json({
        success: false,
        message: "userId, type, title, and message are required",
      });
    }

    const notification = await NotificationService.sendNotification(
      notificationData
    );

    if (!notification) {
      return res.status(200).json({
        success: true,
        message: "Notification not sent due to user preferences",
        data: null,
      });
    }

    sendSuccess(res, notification, "Notification sent successfully", 201);
  } catch (error) {
    handleError(res, error, "Failed to send notification");
  }
};

export const sendBulkNotifications = async (req, res) => {
  try {
    if (!req.body.userIds || !Array.isArray(req.body.userIds)) {
      return res.status(400).json({
        success: false,
        message: "userIds array is required",
      });
    }

    if (!req.body.title || !req.body.message) {
      return res.status(400).json({
        success: false,
        message: "title and message are required",
      });
    }

    const result = await NotificationService.sendBulkNotifications({
      ...req.body,
      sentBy: req.user._id,
    });

    sendSuccess(res, result, "Bulk notifications sent");
  } catch (error) {
    handleError(res, error, "Failed to send bulk notifications");
  }
};

export const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      read: req.query.read,
      channel: req.query.channel,
      priority: req.query.priority,
      type: req.query.type,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const result = await NotificationService.getUserNotifications(
      userId,
      options
    );
    sendSuccess(res, result);
  } catch (error) {
    handleError(res, error, "Failed to get notifications");
  }
};

export const getAdminNotifications = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can access this endpoint",
      });
    }

    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      userType: req.query.userType,
      channel: req.query.channel,
      priority: req.query.priority,
      status: req.query.status,
      type: req.query.type,
      search: req.query.search,
    };

    const result = await NotificationService.getAdminNotifications(options);
    sendSuccess(res, result);
  } catch (error) {
    handleError(res, error, "Failed to get admin notifications");
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Notification ID is required",
      });
    }

    const notification = await NotificationService.markAsRead(id, req.user._id);
    sendSuccess(res, notification, "Notification marked as read");
  } catch (error) {
    handleError(res, error, "Failed to mark notification as read");
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const result = await NotificationService.markAllAsRead(req.user._id);
    sendSuccess(res, result, result.message);
  } catch (error) {
    handleError(res, error, "Failed to mark all notifications as read");
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await NotificationService.getUnreadCount(req.user._id);
    sendSuccess(res, { count });
  } catch (error) {
    handleError(res, error, "Failed to get unread count");
  }
};

// ==============================================
// PREFERENCE OPERATIONS
// ==============================================

export const getPreferences = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const preferences = await NotificationService.getUserPreferences(userId);
    sendSuccess(res, preferences);
  } catch (error) {
    handleError(res, error, "Failed to get preferences");
  }
};

export const updatePreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Preference updates are required",
      });
    }

    const preferences = await NotificationService.updateUserPreferences(
      userId,
      updates
    );
    sendSuccess(res, preferences, "Preferences updated successfully");
  } catch (error) {
    handleError(res, error, "Failed to update preferences");
  }
};

// ==============================================
// TEMPLATE OPERATIONS (ADMIN ONLY)
// ==============================================

export const getTemplates = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can access templates",
      });
    }

    const templates = await NotificationService.getNotificationTemplates({
      isActive: req.query.active,
      type: req.query.type,
      channel: req.query.channel,
    });
    sendSuccess(res, templates);
  } catch (error) {
    handleError(res, error, "Failed to get templates");
  }
};

export const createTemplate = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can create templates",
      });
    }

    if (
      !req.body.type ||
      !req.body.channel ||
      !req.body.subject ||
      !req.body.body
    ) {
      return res.status(400).json({
        success: false,
        message: "type, channel, subject and body are required",
      });
    }

    const template = await NotificationService.createNotificationTemplate(
      req.body
    );
    sendSuccess(res, template, "Template created", 201);
  } catch (error) {
    handleError(res, error, "Failed to create template");
  }
};

export const updateTemplate = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can update templates",
      });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Template ID is required",
      });
    }

    const template = await NotificationService.updateNotificationTemplate(
      id,
      req.body
    );
    sendSuccess(res, template, "Template updated successfully");
  } catch (error) {
    handleError(res, error, "Failed to update template");
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can delete templates",
      });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Template ID is required",
      });
    }

    await NotificationService.deleteNotificationTemplate(id);
    sendSuccess(res, null, "Template deleted successfully");
  } catch (error) {
    handleError(res, error, "Failed to delete template");
  }
};

// ==============================================
// DELETION OPERATIONS
// ==============================================

export const deleteMyNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await NotificationService.softDeleteNotification(
      id,
      req.user._id
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found or not owned by user",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification moved to trash",
      data: null,
    });
  } catch (error) {
    handleError(res, error, "Failed to delete notification");
  }
};

export const adminDeleteNotification = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can permanently delete notifications",
      });
    }

    const { id } = req.params;

    const result = await NotificationService.hardDeleteNotification(
      id,
      req.user._id
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(204).end();
  } catch (error) {
    handleError(res, error, "Failed to permanently delete notification");
  }
};

// ==============================================
// STATISTICS OPERATIONS (ADMIN ONLY)
// ==============================================

export const getNotificationStats = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can access notification statistics",
      });
    }

    const stats = await NotificationService.getNotificationStatistics();
    sendSuccess(res, stats);
  } catch (error) {
    handleError(res, error, "Failed to get notification statistics");
  }
};

// ==============================================
// USER CONVENIENCE METHODS
// ==============================================

export const getMyNotifications = async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      read: req.query.read,
      channel: req.query.channel,
      priority: req.query.priority,
      type: req.query.type,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const result = await NotificationService.getUserNotifications(
      req.user._id,
      options
    );
    sendSuccess(res, result);
  } catch (error) {
    handleError(res, error, "Failed to get your notifications");
  }
};

export const getMyPreferences = async (req, res) => {
  try {
    const preferences = await NotificationService.getUserPreferences(
      req.user._id
    );
    sendSuccess(res, preferences);
  } catch (error) {
    handleError(res, error, "Failed to get your preferences");
  }
};

export const updateMyPreferences = async (req, res) => {
  try {
    const updates = req.body;

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Preference updates are required",
      });
    }

    const preferences = await NotificationService.updateUserPreferences(
      req.user._id,
      updates
    );
    sendSuccess(res, preferences, "Your preferences updated successfully");
  } catch (error) {
    handleError(res, error, "Failed to update your preferences");
  }
};

export default {
  sendNotification,
  sendBulkNotifications,
  getUserNotifications,
  getAdminNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  getPreferences,
  updatePreferences,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  deleteMyNotification,
  adminDeleteNotification,
  getNotificationStats,
  getMyNotifications,
  getMyPreferences,
  updateMyPreferences,
};
