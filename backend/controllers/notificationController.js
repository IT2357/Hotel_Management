// 📁 backend/controllers/notification/notificationController.js
import NotificationService from "../services/notification/notificationService.js";
import { getDefaultPreferences } from "../models/NotificationPreferences.js";
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

export const getNotificationMetadata = (req, res) => {
  const roles = ["guest", "staff", "manager", "admin"];
  const typeSet = new Set();

  roles.forEach((role) => {
    const prefs = getDefaultPreferences(role);
    Object.keys(prefs).forEach((type) => typeSet.add(type));
  });

  const channels = ["email", "inApp", "sms", "push"];

  res.json({
    success: true,
    types: Array.from(typeSet).sort(),
    channels,
  });
};
// ==============================================
// NOTIFICATION OPERATIONS
// ==============================================

export const sendNotification = async (req, res) => {
  try {
    console.log("Send notification request body:", req.body); // Debug log

    const { userId, userType, type, title, message, channel, priority } =
      req.body;

    // Enhanced validation
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    if (!userType) {
      return res.status(400).json({
        success: false,
        message: "userType is required",
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "type is required",
      });
    }

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "title and message are required",
      });
    }

    // Validate userType enum
    const validUserTypes = ["guest", "staff", "manager", "admin"];
    if (!validUserTypes.includes(userType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid userType. Must be one of: ${validUserTypes.join(
          ", "
        )}`,
      });
    }

    const notification = await NotificationService.sendNotification({
      userId,
      userType,
      type,
      title,
      message,
      channel: channel || "inApp",
      priority: priority || "medium",
    });

    res.status(201).json({
      success: true,
      message: "Notification sent successfully",
      data: notification,
    });
  } catch (error) {
    console.error("Send notification error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send notification",
    });
  }
};

export const sendBulkNotifications = async (req, res) => {
  try {
    console.log("Bulk send request body:", req.body); // Debug log

    const { userIds, title, message, type, channel, priority } = req.body;

    // Enhanced validation

    console.log(`Sending bulk notification to ${userIds.length} users`); // Debug log

    const result = await NotificationService.sendBulkNotifications({
      userIds,
      title,
      message,
      type: type || "admin_message",
      channel: channel || "inApp",
      priority: priority || "medium",
      sentBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "Bulk notifications sent successfully",
      data: result,
    });
  } catch (error) {
    console.error("Bulk send error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send bulk notifications",
    });
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
    console.log("Create template request body:", req.body); // Debug log

    const { name, subject, body, type, channel, isActive, variables } =
      req.body;

    // Enhanced validation
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Template name is required and must be a non-empty string",
      });
    }

    if (!subject || typeof subject !== "string" || !subject.trim()) {
      return res.status(400).json({
        success: false,
        message: "Template subject is required and must be a non-empty string",
      });
    }

    if (!body || typeof body !== "string" || !body.trim()) {
      return res.status(400).json({
        success: false,
        message: "Template body is required and must be a non-empty string",
      });
    }

    if (!type || !channel) {
      return res.status(400).json({
        success: false,
        message: "Template type and channel are required",
      });
    }

    const templateData = {
      name: name.trim(),
      subject: subject.trim(),
      body: body.trim(),
      type,
      channel,
      isActive: isActive !== undefined ? isActive : true,
      variables: Array.isArray(variables) ? variables : [],
    };

    console.log("Creating template with data:", templateData); // Debug log

    const template = await NotificationService.createNotificationTemplate(
      templateData
    );

    res.status(201).json({
      success: true,
      message: "Template created successfully",
      data: template,
    });
  } catch (error) {
    console.error("Template creation error:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "A template with this type and channel combination already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to create template",
    });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    console.log("Update template request body:", req.body); // Debug log

    const { id } = req.params;
    const { name, subject, body, type, channel, isActive, variables } =
      req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Template ID is required",
      });
    }

    // Build update object with only provided fields
    const updateData = {};

    if (name !== undefined)
      updateData.name = typeof name === "string" ? name.trim() : name;
    if (subject !== undefined)
      updateData.subject =
        typeof subject === "string" ? subject.trim() : subject;
    if (body !== undefined)
      updateData.body = typeof body === "string" ? body.trim() : body;
    if (type !== undefined) updateData.type = type;
    if (channel !== undefined) updateData.channel = channel;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (variables !== undefined)
      updateData.variables = Array.isArray(variables) ? variables : [];

    console.log("Updating template with data:", updateData); // Debug log

    const template = await NotificationService.updateNotificationTemplate(
      id,
      updateData
    );

    res.status(200).json({
      success: true,
      message: "Template updated successfully",
      data: template,
    });
  } catch (error) {
    console.error("Template update error:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to update template",
    });
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
    console.error("Delete error:", error.stack || error);
    res.status(500).json({
      success: false,
      message: "Failed to permanently delete notification",
      error: error.message,
    });
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

    // Use different service methods based on user role
    let result;
    if (req.user.role === "staff") {
      result = await NotificationService.getStaffNotifications(
        req.user._id,
        options
      );
    } else {
      result = await NotificationService.getUserNotifications(
        req.user._id,
        options
      );
    }

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
