import GuestFeedback from '../../models/GuestFeedback.js';
import { buildFeedbackQuery, buildFeedbackSort } from '../../services/manager/feedbackQueryBuilder.js';
import { getAllFeedbackStats } from '../../services/manager/feedbackStatsService.js';

// Get all guest feedback with filters
export const getAllFeedback = async (req, res) => {
  try {
    const { status, rating, search, sortBy = 'recent' } = req.query;

    // Build query and sort using helper functions
    const query = buildFeedbackQuery({ status, rating, search });
    const sort = buildFeedbackSort(sortBy);

    const feedback = await GuestFeedback.find(query).sort(sort);

    res.json({
      success: true,
      count: feedback.length,
      data: feedback,
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message,
    });
  }
};

// Get feedback statistics
export const getFeedbackStats = async (req, res) => {
  try {
    const stats = await getAllFeedbackStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback statistics',
      error: error.message,
    });
  }
};

// Respond to feedback
export const respondToFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Response message is required',
      });
    }

    const feedback = await GuestFeedback.findById(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    feedback.response = {
      hasResponse: true,
      message: message.trim(),
      respondedAt: new Date(),
      respondedBy: req.user?.name || req.user?.fullName || 'Manager',
    };

    feedback.status = 'published';

    await feedback.save();

    res.json({
      success: true,
      message: 'Response sent successfully',
      data: feedback,
    });
  } catch (error) {
    console.error('Error responding to feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send response',
      error: error.message,
    });
  }
};

// Mark feedback as helpful
export const markHelpful = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await GuestFeedback.findByIdAndUpdate(
      id,
      { $inc: { helpful: 1 } },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    res.json({
      success: true,
      message: 'Marked as helpful',
      data: feedback,
    });
  } catch (error) {
    console.error('Error marking feedback as helpful:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark as helpful',
      error: error.message,
    });
  }
};

// Publish feedback
export const publishFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await GuestFeedback.findByIdAndUpdate(
      id,
      { status: 'published' },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    res.json({
      success: true,
      message: 'Feedback published successfully',
      data: feedback,
    });
  } catch (error) {
    console.error('Error publishing feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish feedback',
      error: error.message,
    });
  }
};

// Archive feedback
export const archiveFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await GuestFeedback.findByIdAndUpdate(
      id,
      { status: 'archived' },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    res.json({
      success: true,
      message: 'Feedback archived successfully',
      data: feedback,
    });
  } catch (error) {
    console.error('Error archiving feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive feedback',
      error: error.message,
    });
  }
};
