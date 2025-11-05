// services/feedback/feedbackInteractionService.js
import Feedback from '../../models/Feedback.js';

/**
 * Mark feedback as read
 * @param {String} feedbackId - Feedback ID
 * @returns {Object} Updated feedback object
 */
export const markAsRead = async (feedbackId) => {
  const feedback = await Feedback.findByIdAndUpdate(
    feedbackId, 
    { isRead: true }, 
    { new: true }
  );
  
  if (!feedback) {
    throw new Error('Feedback not found');
  }
  
  return feedback;
};

/**
 * Add a reply to feedback
 * @param {String} feedbackId - Feedback ID
 * @param {String} userId - User ID who is replying
 * @param {String} message - Reply message
 * @returns {Object} Updated feedback object with new reply
 */
export const addReplyToFeedback = async (feedbackId, userId, message) => {
  const feedback = await Feedback.findById(feedbackId);
  
  if (!feedback) {
    throw new Error('Feedback not found');
  }

  feedback.replies.push({
    userId,
    message
  });

  await feedback.save();
  return feedback;
};
