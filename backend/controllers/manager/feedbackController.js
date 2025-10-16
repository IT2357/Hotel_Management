import Feedback from '../../models/Feedback.js';
import Task from '../../models/Task.js';
import { User } from '../../models/User.js';
import { updatePerformanceScore } from '../../services/manager/autoAssignService.js';

// Create new feedback
const createFeedback = async (req, res) => {
  const { taskId, rating, comment } = req.body;
  try {
    const feedback = new Feedback({
      taskId,
      guestId: req.user._id,
      rating,
      comment,
    });
    await feedback.save();

    // Update staff performance score
    const task = await Task.findById(taskId);
    if (task && task.assignedStaff) {
      await updatePerformanceScore(task.assignedStaff, rating);
    }

    res.status(201).json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get feedback for a specific task
const getFeedbackForTask = async (req, res) => {
  const { taskId } = req.params;
  try {
    const feedback = await Feedback.find({ taskId }).populate('guestId', 'name email').sort({ createdAt: -1 });
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get feedback submitted by the current user
const getMyFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ guestId: req.user._id }).populate('taskId', 'description status').sort({ createdAt: -1 });
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark feedback as read
const markFeedbackAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    const feedback = await Feedback.findByIdAndUpdate(id, { isRead: true }, { new: true });
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get count of unread feedback
const getUnreadCount = async (req, res) => {
  try {
    const count = await Feedback.countDocuments({ isRead: false });
    res.json({ unreadCount: count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Reply to feedback
const replyToFeedback = async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  try {
    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    feedback.replies.push({
      userId: req.user._id,
      message
    });

    await feedback.save();
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete feedback
const deleteFeedback = async (req, res) => {
  const { id } = req.params;
  try {
    const feedback = await Feedback.findByIdAndDelete(id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    res.json({ message: 'Feedback deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get feedback statistics
const getFeedbackStats = async (req, res) => {
  try {
    const totalFeedback = await Feedback.countDocuments();
    const averageRating = await Feedback.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const ratingDistribution = await Feedback.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } }
    ]);

    res.json({
      totalFeedback,
      averageRating: averageRating[0]?.avgRating || 0,
      ratingDistribution
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export {
  createFeedback,
  getFeedbackForTask,
  getMyFeedback,
  markFeedbackAsRead,
  getUnreadCount,
  replyToFeedback,
  deleteFeedback,
  getFeedbackStats
};