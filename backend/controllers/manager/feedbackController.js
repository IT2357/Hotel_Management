import TaskFeedback from "../../models/TaskFeedback.js";
import Task from "../../models/Task.js";
import { User } from "../../models/User.js";

/**
 * Feedback Controller for Hotel Task Management System
 * Handles all feedback-related operations
 */

// @desc    Create new feedback
// @route   POST /api/feedback
// @access  All authenticated users
export const createFeedback = async (req, res) => {
  try {
    const {
      taskId,
      feedbackType,
      toUser,
      subject,
      message,
      rating,
      priority = 'medium',
      attachments = []
    } = req.body;

    // Validate required fields
    if (!taskId || !feedbackType || !toUser || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Verify task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    // Verify recipient exists
    const recipient = await User.findById(toUser);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient not found"
      });
    }

    // Validate feedback type and user roles
    const fromUserRole = req.user.role;
    const toUserRole = recipient.role;
    
    const validFeedbackTypes = [
      "manager-to-staff", 
      "staff-to-manager", 
      "guest-to-staff", 
      "staff-to-guest", 
      "manager-to-guest"
    ];

    if (!validFeedbackTypes.includes(feedbackType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback type"
      });
    }

    // Create feedback
    const feedback = new TaskFeedback({
      taskId,
      feedbackType,
      fromUser: req.user.id,
      fromUserRole,
      toUser,
      toUserRole,
      subject,
      message,
      rating,
      priority,
      attachments
    });

    const savedFeedback = await feedback.save();
    
    // Populate the saved feedback
    const populatedFeedback = await TaskFeedback.findById(savedFeedback._id)
      .populate('taskId', 'title type status')
      .populate('fromUser', 'name email role')
      .populate('toUser', 'name email role');

    // If this is guest feedback on task completion, update the task
    if (feedbackType === 'guest-to-staff' && rating) {
      await Task.findByIdAndUpdate(taskId, {
        guestRating: rating,
        guestFeedback: message
      });
    }

    res.status(201).json({
      success: true,
      message: "Feedback created successfully",
      data: populatedFeedback
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating feedback",
      error: error.message
    });
  }
};

// @desc    Get all feedback for a task
// @route   GET /api/feedback/task/:taskId
// @access  Manager, Admin, or users involved in the task
export const getFeedbackForTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Verify task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    // Check permissions
    const userRole = req.user.role;
    const userId = req.user.id;

    if (userRole !== 'manager' && userRole !== 'admin' && 
        task.guestId.toString() !== userId && 
        task.assignedTo?.toString() !== userId &&
        task.assignedBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    const feedback = await TaskFeedback.getFeedbackForTask(taskId);

    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching feedback",
      error: error.message
    });
  }
};

// @desc    Get feedback for current user
// @route   GET /api/feedback/my-feedback
// @access  All authenticated users
export const getMyFeedback = async (req, res) => {
  try {
    const { type = 'received', page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let feedback;
    let totalCount;

    if (type === 'received') {
      feedback = await TaskFeedback.find({ 
        toUser: userId, 
        isActive: true 
      })
        .populate('taskId', 'title type status')
        .populate('fromUser', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      totalCount = await TaskFeedback.countDocuments({ 
        toUser: userId, 
        isActive: true 
      });
    } else {
      feedback = await TaskFeedback.find({ 
        fromUser: userId, 
        isActive: true 
      })
        .populate('taskId', 'title type status')
        .populate('toUser', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      totalCount = await TaskFeedback.countDocuments({ 
        fromUser: userId, 
        isActive: true 
      });
    }

    res.status(200).json({
      success: true,
      data: {
        feedback,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(totalCount / parseInt(limit)),
          total: totalCount,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching feedback",
      error: error.message
    });
  }
};

// @desc    Mark feedback as read
// @route   PUT /api/feedback/:id/read
// @access  Recipient of the feedback
export const markFeedbackAsRead = async (req, res) => {
  try {
    const feedback = await TaskFeedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found"
      });
    }

    // Check if user is the recipient
    if (feedback.toUser.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only mark your own feedback as read"
      });
    }

    await feedback.markAsRead();

    res.status(200).json({
      success: true,
      message: "Feedback marked as read"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error marking feedback as read",
      error: error.message
    });
  }
};

// @desc    Get unread feedback count
// @route   GET /api/feedback/unread-count
// @access  All authenticated users
export const getUnreadCount = async (req, res) => {
  try {
    const count = await TaskFeedback.getUnreadCount(req.user.id);

    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching unread count",
      error: error.message
    });
  }
};

// @desc    Reply to feedback
// @route   POST /api/feedback/:id/reply
// @access  All authenticated users
export const replyToFeedback = async (req, res) => {
  try {
    const { subject, message, priority = 'medium', attachments = [] } = req.body;
    const parentFeedbackId = req.params.id;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Subject and message are required"
      });
    }

    // Get parent feedback
    const parentFeedback = await TaskFeedback.findById(parentFeedbackId);
    if (!parentFeedback) {
      return res.status(404).json({
        success: false,
        message: "Original feedback not found"
      });
    }

    // Create reply feedback
    const replyFeedback = new TaskFeedback({
      taskId: parentFeedback.taskId,
      feedbackType: `${req.user.role}-to-${parentFeedback.fromUserRole}`,
      fromUser: req.user.id,
      fromUserRole: req.user.role,
      toUser: parentFeedback.fromUser,
      toUserRole: parentFeedback.fromUserRole,
      subject,
      message,
      priority,
      attachments,
      parentFeedbackId
    });

    const savedReply = await replyFeedback.save();
    
    // Update parent feedback to indicate it has a response
    parentFeedback.hasResponse = true;
    parentFeedback.responseId = savedReply._id;
    await parentFeedback.save();

    // Populate the saved reply
    const populatedReply = await TaskFeedback.findById(savedReply._id)
      .populate('taskId', 'title type status')
      .populate('fromUser', 'name email role')
      .populate('toUser', 'name email role');

    res.status(201).json({
      success: true,
      message: "Reply sent successfully",
      data: populatedReply
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error sending reply",
      error: error.message
    });
  }
};

// @desc    Delete feedback
// @route   DELETE /api/feedback/:id
// @access  Author of feedback or Manager/Admin
export const deleteFeedback = async (req, res) => {
  try {
    const feedback = await TaskFeedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found"
      });
    }

    // Check permissions
    const userRole = req.user.role;
    const userId = req.user.id;

    if (userRole !== 'manager' && userRole !== 'admin' && 
        feedback.fromUser.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own feedback"
      });
    }

    // Soft delete
    feedback.isActive = false;
    await feedback.save();

    res.status(200).json({
      success: true,
      message: "Feedback deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting feedback",
      error: error.message
    });
  }
};

// @desc    Get feedback statistics
// @route   GET /api/feedback/stats
// @access  Manager, Admin
export const getFeedbackStats = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;
    
    // Build match stage for aggregation
    let matchStage = { isActive: true };
    
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    // If department filter is provided, we need to join with tasks
    let pipeline = [];
    
    if (department) {
      pipeline.push(
        {
          $lookup: {
            from: 'tasks',
            localField: 'taskId',
            foreignField: '_id',
            as: 'task'
          }
        },
        {
          $match: {
            ...matchStage,
            'task.department': department
          }
        }
      );
    } else {
      pipeline.push({ $match: matchStage });
    }

    // Add aggregation stages
    pipeline.push(
      {
        $group: {
          _id: null,
          totalFeedback: { $sum: 1 },
          averageRating: { $avg: "$rating" },
          ratedFeedback: {
            $sum: { $cond: [{ $ne: ["$rating", null] }, 1, 0] }
          },
          unreadFeedback: {
            $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] }
          },
          feedbackByType: {
            $push: "$feedbackType"
          }
        }
      }
    );

    const stats = await TaskFeedback.aggregate(pipeline);

    // Get feedback type breakdown
    const typeBreakdown = await TaskFeedback.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$feedbackType",
          count: { $sum: 1 },
          avgRating: { $avg: "$rating" }
        }
      }
    ]);

    // Get priority breakdown
    const priorityBreakdown = await TaskFeedback.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || {
          totalFeedback: 0,
          averageRating: 0,
          ratedFeedback: 0,
          unreadFeedback: 0
        },
        typeBreakdown,
        priorityBreakdown
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching feedback statistics",
      error: error.message
    });
  }
};