// 📁 backend/controllers/staff/notificationController.js
import StaffNotification from "../../models/StaffNotification.js";
import StaffProfile from "../../models/profiles/StaffProfile.js";
import { User } from "../../models/User.js";
import { formatResponse } from "../../utils/responseFormatter.js";
import logger from "../../utils/logger.js";

// Get notifications for current user
export const getMyNotifications = async (req, res) => {
  try {
    const { userId } = req.user;
    const { 
      type, 
      priority, 
      read, 
      page = 1, 
      limit = 20,
      department 
    } = req.query;

    const filter = {
      "recipients.userId": userId,
      isActive: true
    };

    // Apply filters
    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    if (department && department !== "all") filter.department = department;
    
    // Filter by read status
    if (read === "true") {
      filter["recipients.readAt"] = { $exists: true };
    } else if (read === "false") {
      filter["recipients.readAt"] = { $exists: false };
    }

    const skip = (page - 1) * limit;

    const notifications = await StaffNotification.find(filter)
      .populate("sender", "name email")
      .populate("relatedTask", "title status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await StaffNotification.countDocuments(filter);

    // Get unread count
    const unreadCount = await StaffNotification.countDocuments({
      "recipients.userId": userId,
      "recipients.readAt": { $exists: false },
      isActive: true
    });

    res.json(formatResponse(true, "Notifications retrieved successfully", {
      notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }));
  } catch (error) {
    logger.error("Error getting notifications:", error);
    res.status(500).json(formatResponse(false, "Failed to get notifications", null, error.message));
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.user;

    const notification = await StaffNotification.findById(notificationId);
    if (!notification) {
      return res.status(404).json(formatResponse(false, "Notification not found"));
    }

    // Find the recipient and mark as read
    const recipientIndex = notification.recipients.findIndex(
      recipient => recipient.userId.toString() === userId
    );

    if (recipientIndex === -1) {
      return res.status(403).json(formatResponse(false, "Not authorized to read this notification"));
    }

    notification.recipients[recipientIndex].readAt = new Date();
    await notification.save();

    res.json(formatResponse(true, "Notification marked as read"));
  } catch (error) {
    logger.error("Error marking notification as read:", error);
    res.status(500).json(formatResponse(false, "Failed to mark notification as read", null, error.message));
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { userId } = req.user;
    const { department } = req.query;

    const filter = {
      "recipients.userId": userId,
      "recipients.readAt": { $exists: false },
      isActive: true
    };

    if (department && department !== "all") {
      filter.department = department;
    }

    await StaffNotification.updateMany(filter, {
      $set: { "recipients.$.readAt": new Date() }
    });

    res.json(formatResponse(true, "All notifications marked as read"));
  } catch (error) {
    logger.error("Error marking all notifications as read:", error);
    res.status(500).json(formatResponse(false, "Failed to mark all notifications as read", null, error.message));
  }
};

// Acknowledge notification (for action required notifications)
export const acknowledgeNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.user;

    const notification = await StaffNotification.findById(notificationId);
    if (!notification) {
      return res.status(404).json(formatResponse(false, "Notification not found"));
    }

    const recipientIndex = notification.recipients.findIndex(
      recipient => recipient.userId.toString() === userId
    );

    if (recipientIndex === -1) {
      return res.status(403).json(formatResponse(false, "Not authorized to acknowledge this notification"));
    }

    notification.recipients[recipientIndex].acknowledgedAt = new Date();
    await notification.save();

    res.json(formatResponse(true, "Notification acknowledged"));
  } catch (error) {
    logger.error("Error acknowledging notification:", error);
    res.status(500).json(formatResponse(false, "Failed to acknowledge notification", null, error.message));
  }
};

// Create system announcement
export const createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      message,
      department,
      priority,
      recipients,
      expiresAt
    } = req.body;

    const notificationData = {
      title,
      message,
      type: "system_announcement",
      priority: priority || "medium",
      department: department || "all",
      sender: req.user.userId,
      actionRequired: false,
      isActive: true
    };

    if (expiresAt) {
      notificationData.expiresAt = new Date(expiresAt);
    }

    // Set recipients
    if (recipients && recipients.length > 0) {
      notificationData.recipients = recipients.map(userId => ({ userId }));
    } else {
      // If no specific recipients, send to all staff in the department
      const staffFilter = { isActive: true };
      if (department && department !== "all") {
        staffFilter.department = department;
      }
      
      const departmentStaff = await StaffProfile.find(staffFilter).select("userId");
      notificationData.recipients = departmentStaff.map(staff => ({ userId: staff.userId }));
    }

    const notification = new StaffNotification(notificationData);
    await notification.save();

    const populatedNotification = await StaffNotification.findById(notification._id)
      .populate("sender", "name email");

    res.status(201).json(formatResponse(true, "Announcement created successfully", populatedNotification));
  } catch (error) {
    logger.error("Error creating announcement:", error);
    res.status(500).json(formatResponse(false, "Failed to create announcement", null, error.message));
  }
};

// Get notification statistics
export const getNotificationStats = async (req, res) => {
  try {
    const { userId } = req.user;
    const { timeRange = "week" } = req.query;

    const now = new Date();
    let startDate;
    switch (timeRange) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const filter = {
      "recipients.userId": userId,
      createdAt: { $gte: startDate },
      isActive: true
    };

    const stats = await StaffNotification.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          urgentCount: {
            $sum: { $cond: [{ $eq: ["$priority", "urgent"] }, 1, 0] }
          }
        }
      }
    ]);

    const totalNotifications = await StaffNotification.countDocuments(filter);
    const unreadNotifications = await StaffNotification.countDocuments({
      ...filter,
      "recipients.readAt": { $exists: false }
    });

    const urgentNotifications = await StaffNotification.countDocuments({
      ...filter,
      priority: "urgent"
    });

    const result = {
      total: totalNotifications,
      unread: unreadNotifications,
      urgent: urgentNotifications,
      byType: stats.reduce((acc, stat) => {
        acc[stat._id] = { count: stat.count, urgentCount: stat.urgentCount };
        return acc;
      }, {}),
      timeRange
    };

    res.json(formatResponse(true, "Notification statistics retrieved successfully", result));
  } catch (error) {
    logger.error("Error getting notification stats:", error);
    res.status(500).json(formatResponse(false, "Failed to get notification statistics", null, error.message));
  }
};

// Delete notification (for user)
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.user;

    const notification = await StaffNotification.findById(notificationId);
    if (!notification) {
      return res.status(404).json(formatResponse(false, "Notification not found"));
    }

    // Remove user from recipients instead of deleting the entire notification
    notification.recipients = notification.recipients.filter(
      recipient => recipient.userId.toString() !== userId
    );

    await notification.save();

    res.json(formatResponse(true, "Notification removed"));
  } catch (error) {
    logger.error("Error deleting notification:", error);
    res.status(500).json(formatResponse(false, "Failed to delete notification", null, error.message));
  }
};

// Get urgent alerts for dashboard
export const getUrgentAlerts = async (req, res) => {
  try {
    const { userId } = req.user;
    const { department } = req.query;

    const filter = {
      "recipients.userId": userId,
      priority: "urgent",
      "recipients.readAt": { $exists: false },
      isActive: true
    };

    if (department && department !== "all") {
      filter.department = department;
    }

    const urgentAlerts = await StaffNotification.find(filter)
      .populate("sender", "name email")
      .populate("relatedTask", "title status")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(formatResponse(true, "Urgent alerts retrieved successfully", urgentAlerts));
  } catch (error) {
    logger.error("Error getting urgent alerts:", error);
    res.status(500).json(formatResponse(false, "Failed to get urgent alerts", null, error.message));
  }
}; 