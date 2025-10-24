// services/feedback/feedbackService.js
import Feedback from '../../models/Feedback.js';
import Task from '../../models/Task.js';
import { updatePerformanceScore } from '../manager/autoAssignService.js';

/**
 * Create new feedback for a task
 * @param {String} taskId - Task ID
 * @param {String} guestId - Guest user ID
 * @param {Number} rating - Rating (1-5)
 * @param {String} comment - Feedback comment
 * @returns {Object} Created feedback object
 */
export const createNewFeedback = async (taskId, guestId, rating, comment) => {
  const feedback = new Feedback({
    taskId,
    guestId,
    rating,
    comment,
  });
  await feedback.save();

  // Update staff performance score
  const task = await Task.findById(taskId);
  if (task && task.assignedStaff) {
    await updatePerformanceScore(task.assignedStaff, rating);
  }

  return feedback;
};

/**
 * Get feedback for a specific task
 * @param {String} taskId - Task ID
 * @returns {Array} Array of feedback for the task
 */
export const getFeedbackByTask = async (taskId) => {
  return await Feedback.find({ taskId })
    .populate('guestId', 'name email')
    .sort({ createdAt: -1 });
};

/**
 * Get feedback submitted by a specific user
 * @param {String} userId - User ID
 * @returns {Array} Array of user's feedback
 */
export const getFeedbackByUser = async (userId) => {
  return await Feedback.find({ guestId: userId })
    .populate('taskId', 'description status')
    .sort({ createdAt: -1 });
};

/**
 * Delete feedback by ID
 * @param {String} feedbackId - Feedback ID
 * @returns {Object} Deleted feedback object
 */
export const deleteFeedbackById = async (feedbackId) => {
  const feedback = await Feedback.findByIdAndDelete(feedbackId);
  if (!feedback) {
    throw new Error('Feedback not found');
  }
  return feedback;
};
