// 📁 backend/services/notification/notificationService.js
import Notification from "../../models/Notification.js";
import NotificationPreferences from "../../models/NotificationPreferences.js";
import NotificationTemplate from "../../models/NotificationTemplate.js";
import { User } from "../../models/User.js";
import EmailService from "./emailService.js";
import { sendSMS } from "./smsService.js";

class NotificationService {
  constructor() {
    this.emailEnabled = process.env.EMAIL_ENABLED === "true";
    this.smsEnabled = process.env.SMS_ENABLED === "true";

    // Validate configuration
    if (this.emailEnabled && !process.env.SMTP_HOST) {
      console.warn("⚠️ Email enabled but SMTP configuration missing");
    }
    if (this.smsEnabled && !process.env.SMS_PROVIDER) {
      console.warn("⚠️ SMS enabled but SMS configuration missing");
    }
  }

  // Send single notification
  async sendNotification({
    userId,
    userType,
    type,
    title,
    message,
    channel = "inApp",
    priority = "medium",
    metadata = {},
    actionUrl,
    expiryDate,
  }) {
    try {
      // Get user preferences
      const preferences = await NotificationPreferences.getOrCreate(
        userId,
        userType
      );

      // Check if notification type is enabled for this channel
      const typePreferences = preferences.preferences.get(type);
      if (!typePreferences || !typePreferences[channel]) {
        console.log(
          `Notification ${type} not enabled for user ${userId} on channel ${channel}`
        );
        return null;
      }

      // Create notification record
      const notification = new Notification({
        userId,
        userType,
        type,
        title,
        message,
        channel,
        priority,
        metadata,
        actionUrl,
        expiryDate,
        status: "pending",
      });

      await notification.save();

      // Send via appropriate channel
      switch (channel) {
        case "email":
          if (this.emailEnabled) {
            await this.sendEmailNotification(notification);
          } else {
            notification.status = "failed";
            notification.error = "Email service is disabled";
            await notification.save();
          }
          break;
        case "sms":
          if (this.smsEnabled) {
            await this.sendSmsNotification(notification);
          } else {
            notification.status = "failed";
            notification.error = "SMS service is disabled";
            await notification.save();
          }
          break;
        case "inApp":
          // In-app notifications are stored in DB only
          notification.status = "sent";
          await notification.save();
          break;
        default:
          notification.status = "failed";
          notification.error = "Invalid channel";
          await notification.save();
          break;
      }

      return notification;
    } catch (error) {
      console.error("Error sending notification:", error);
      throw error;
    }
  }

  // Send bulk notifications (for admin use)
  async sendBulkNotifications({
    userIds,
    title,
    message,
    channel = "inApp",
    priority = "medium",
    sentBy,
  }) {
    if (!Array.isArray(userIds)) {
      throw new Error("userIds must be an array");
    }

    const notifications = await Promise.all(
      userIds.map(async (userId) => {
        try {
          return await this.sendNotification({
            userId,
            type: "admin_message",
            title,
            message,
            channel,
            priority,
            metadata: { sentBy, isAdminMessage: true },
          });
        } catch (error) {
          console.error(
            `Failed to send notification to user ${userId}:`,
            error
          );
          return null;
        }
      })
    );

    // Filter out null results (failed notifications)
    const successfulNotifications = notifications.filter(Boolean);

    return {
      total: userIds.length,
      sent: successfulNotifications.length,
      failed: userIds.length - successfulNotifications.length,
      notifications: successfulNotifications,
    };
  }

  // Soft delete for regular users
  static async softDeleteNotification(notificationId, userId) {
    return Notification.findOneAndUpdate(
      {
        _id: notificationId,
        userId, // Users can only delete their own notifications
      },
      {
        $set: {
          deleted: true,
          deletedAt: new Date(),
          deletedBy: userId,
        },
      },
      { new: true }
    );
  }

  // Hard delete for admins
  static async hardDeleteNotification(notificationId, adminId) {
    // Admins can delete any notification
    return Notification.findOneAndDelete({
      _id: notificationId,
    });
  }

  // Get user notifications with filtering and pagination
  async getUserNotifications(userId, options = {}) {
    const {
      limit = 20,
      page = 1,
      read,
      channel,
      priority,
      type,
      startDate,
      endDate,
    } = options;

    const query = { userId };

    // Apply filters
    if (read !== undefined) query.isRead = read === "true";
    if (channel) query.channel = channel;
    if (priority) query.priority = priority;
    if (type) query.type = type;
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      query.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.createdAt = { $lte: new Date(endDate) };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Notification.countDocuments(query);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get admin notifications (all notifications with admin filters)
  async getAdminNotifications({
    page = 1,
    limit = 50,
    userType,
    channel,
    priority,
    status,
    type,
    search,
  }) {
    const query = {};

    // Apply filters
    if (userType) query.userType = userType;
    if (channel) query.channel = channel;
    if (priority) query.priority = priority;
    if (status) query.status = status;
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("userId", "name email role");

    const total = await Notification.countDocuments(query);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      throw new Error("Notification not found");
    }

    return notification;
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return {
      modifiedCount: result.modifiedCount,
      message: `Marked ${result.modifiedCount} notifications as read`,
    };
  }

  // Get unread notification count
  async getUnreadCount(userId) {
    return await Notification.countDocuments({ userId, isRead: false });
  }

  // Get notification statistics for admin dashboard
  async getNotificationStatistics() {
    const [total, read, failed, byType, byChannel, recent] = await Promise.all([
      Notification.countDocuments(),
      Notification.countDocuments({ isRead: true }),
      Notification.countDocuments({ status: "failed" }),
      Notification.aggregate([
        { $group: { _id: "$type", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Notification.aggregate([
        { $group: { _id: "$channel", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Notification.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("userId", "name email role"),
    ]);

    return {
      total,
      read,
      unread: total - read,
      failed,
      readPercentage: total > 0 ? Math.round((read / total) * 100) : 0,
      byType: byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byChannel: byChannel.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentNotifications: recent,
    };
  }

  // User preference management
  async getUserPreferences(userId) {
    let preferences = await NotificationPreferences.findOne({ userId });

    if (!preferences) {
      // Create default preferences if they don't exist
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      preferences = await NotificationPreferences.getOrCreate(
        userId,
        user.role
      );
    }

    return preferences;
  }

  async updateUserPreferences(userId, updates) {
    // Validate preferences structure
    if (!updates || typeof updates !== "object") {
      throw new Error("Invalid preferences format");
    }

    const preferences = await NotificationPreferences.findOneAndUpdate(
      { userId },
      { $set: { preferences: updates } },
      { new: true, upsert: true }
    );

    return preferences;
  }

  // Template management
  async getNotificationTemplates({ isActive, type, channel } = {}) {
    const query = {};

    if (isActive !== undefined) query.isActive = isActive;
    if (type) query.type = type;
    if (channel) query.channel = channel;

    return await NotificationTemplate.find(query).sort({
      type: 1,
      channel: 1,
    });
  }

  async createNotificationTemplate(templateData) {
    // Validate required fields
    if (
      !templateData.type ||
      !templateData.channel ||
      !templateData.subject ||
      !templateData.body
    ) {
      throw new Error("Missing required template fields");
    }

    const template = new NotificationTemplate(templateData);
    await template.save();
    return template;
  }

  async updateNotificationTemplate(templateId, updates) {
    const template = await NotificationTemplate.findByIdAndUpdate(
      templateId,
      updates,
      { new: true }
    );

    if (!template) {
      throw new Error("Template not found");
    }

    return template;
  }

  async deleteNotificationTemplate(templateId) {
    const deleted = await NotificationTemplate.findByIdAndDelete(templateId);
    if (!deleted) {
      throw new Error("Template not found");
    }

    return { message: "Template deleted successfully" };
  }

  // Private methods for sending notifications
  async sendEmailNotification(notification) {
    try {
      if (!this.emailEnabled) {
        notification.status = "failed";
        notification.error = "Email service is disabled";
        await notification.save();
        return;
      }

      const user = await User.findById(notification.userId);
      if (!user?.email) {
        throw new Error("User or user email not found");
      }

      const template = await NotificationTemplate.findOne({
        type: notification.type,
        channel: "email",
        isActive: true,
      });

      if (!template) {
        throw new Error(
          `Email template not found for type ${notification.type}`
        );
      }

      // Enhanced metadata with user info
      const metadata = {
        ...notification.metadata,
        user: {
          name: user.name,
          email: user.email,
          role: user.role,
        },
        currentDate: new Date().toLocaleDateString(),
        notification: {
          title: notification.title,
          message: notification.message,
          actionUrl: notification.actionUrl,
        },
      };

      const subject = this.renderTemplate(template.subject, metadata);
      const body = this.renderTemplate(template.body, metadata);

      await EmailService.sendEmail({ to: user.email, subject, html: body });

      notification.status = "sent";
      await notification.save();
    } catch (error) {
      console.error("Error sending email notification:", error);
      notification.status = "failed";
      notification.error = error.message.substring(0, 500); // Limit error length
      await notification.save();
      throw error;
    }
  }

  async sendSmsNotification(notification) {
    try {
      if (!this.smsEnabled) {
        notification.status = "failed";
        notification.error = "SMS service is disabled";
        await notification.save();
        return;
      }

      const user = await User.findById(notification.userId);
      if (!user?.phone) {
        throw new Error("User or user phone not found");
      }

      const template = await NotificationTemplate.findOne({
        type: notification.type,
        channel: "sms",
        isActive: true,
      });

      if (!template) {
        throw new Error(`SMS template not found for type ${notification.type}`);
      }

      const metadata = {
        ...notification.metadata,
        user: {
          name: user.name,
          phone: user.phone,
        },
        notification: {
          title: notification.title,
          message: notification.message,
        },
      };

      const message = this.renderTemplate(template.body, metadata);
      await sendSMS({ to: user.phone, message });

      notification.status = "sent";
      await notification.save();
    } catch (error) {
      console.error("Error sending SMS notification:", error);
      notification.status = "failed";
      notification.error = error.message.substring(0, 500); // Limit error length
      await notification.save();
      throw error;
    }
  }

  // Enhanced template rendering utility
  renderTemplate(template, data = {}) {
    if (!template || typeof template !== "string") return "";

    // Handle nested objects and default values
    return template.replace(
      /\{\{([\w.]+)(?:\|\|(.*?))?\}\}/g,
      (_, key, defaultValue) => {
        const value = key
          .split(".")
          .reduce(
            (obj, k) => (obj && obj[k] !== undefined ? obj[k] : undefined),
            data
          );
        return value !== undefined ? value : defaultValue || `{{${key}}}`;
      }
    );
  }
}

export default new NotificationService();
