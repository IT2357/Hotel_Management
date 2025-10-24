import {
  createNewFeedback,
  getFeedbackByTask,
  getFeedbackByUser,
  deleteFeedbackById
} from '../../services/feedback/feedbackService.js';
import {
  getFeedbackStatistics,
  getUnreadFeedbackCount
} from '../../services/feedback/feedbackStatsService.js';
import {
  markAsRead,
  addReplyToFeedback
} from '../../services/feedback/feedbackInteractionService.js';

// Create new feedback
const createFeedback = async (req, res) => {
  const { taskId, rating, comment } = req.body;
  try {
    const feedback = await createNewFeedback(taskId, req.user._id, rating, comment);
    res.status(201).json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get feedback for a specific task
const getFeedbackForTask = async (req, res) => {
  const { taskId } = req.params;
  try {
    const feedback = await getFeedbackByTask(taskId);
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get feedback submitted by the current user
const getMyFeedback = async (req, res) => {
  try {
    const feedback = await getFeedbackByUser(req.user._id);
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark feedback as read
const markFeedbackAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    const feedback = await markAsRead(id);
    res.json(feedback);
  } catch (err) {
    const statusCode = err.message === 'Feedback not found' ? 404 : 500;
    res.status(statusCode).json({ message: err.message });
  }
};

// Get count of unread feedback
const getUnreadCount = async (req, res) => {
  try {
    const count = await getUnreadFeedbackCount();
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
    const feedback = await addReplyToFeedback(id, req.user._id, message);
    res.json(feedback);
  } catch (err) {
    const statusCode = err.message === 'Feedback not found' ? 404 : 500;
    res.status(statusCode).json({ message: err.message });
  }
};

// Delete feedback
const deleteFeedback = async (req, res) => {
  const { id } = req.params;
  try {
    await deleteFeedbackById(id);
    res.json({ message: 'Feedback deleted successfully' });
  } catch (err) {
    const statusCode = err.message === 'Feedback not found' ? 404 : 500;
    res.status(statusCode).json({ message: err.message });
  }
};

// Get feedback statistics
const getFeedbackStats = async (req, res) => {
  try {
    const stats = await getFeedbackStatistics();
    res.json(stats);
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