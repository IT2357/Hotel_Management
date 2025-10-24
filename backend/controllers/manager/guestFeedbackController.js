import GuestFeedback from '../../models/GuestFeedback.js';

// Get all guest feedback with filters
export const getAllFeedback = async (req, res) => {
  try {
    const {
      status,
      rating,
      search,
      sortBy = 'recent',
    } = req.query;

    // Build filter query
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (rating) {
      query.rating = parseInt(rating);
    }

    if (search) {
      query.$or = [
        { guestName: { $regex: search, $options: 'i' } },
        { roomTitle: { $regex: search, $options: 'i' } },
        { roomNumber: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { comment: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort query
    let sort = {};
    switch (sortBy) {
      case 'recent':
        sort = { stayDate: -1 };
        break;
      case 'rating-high':
        sort = { rating: -1 };
        break;
      case 'rating-low':
        sort = { rating: 1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

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
    const totalFeedback = await GuestFeedback.countDocuments();
    const pendingCount = await GuestFeedback.countDocuments({ status: 'pending' });
    const publishedCount = await GuestFeedback.countDocuments({ status: 'published' });
    const respondedCount = await GuestFeedback.countDocuments({ 'response.hasResponse': true });

    // Calculate average rating
    const avgRatingResult = await GuestFeedback.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' } } },
    ]);
    const averageRating = avgRatingResult[0]?.avgRating || 0;

    // Get rating distribution
    const ratingDist = await GuestFeedback.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]);

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratingDist.forEach(item => {
      ratingDistribution[item._id] = item.count;
    });

    // Get sentiment distribution
    const sentimentDist = await GuestFeedback.aggregate([
      { $group: { _id: '$sentiment', count: { $sum: 1 } } },
    ]);

    const sentimentStats = { positive: 0, neutral: 0, negative: 0 };
    sentimentDist.forEach(item => {
      sentimentStats[item._id] = item.count;
    });

    // Calculate trend (compare this month to last month)
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    const thisMonthAvg = await GuestFeedback.aggregate([
      { $match: { createdAt: { $gte: startOfThisMonth } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } },
    ]);
    
    const lastMonthAvg = await GuestFeedback.aggregate([
      { $match: { 
        createdAt: { 
          $gte: startOfLastMonth, 
          $lt: startOfThisMonth 
        } 
      }},
      { $group: { _id: null, avgRating: { $avg: '$rating' } } },
    ]);

    const thisMonthRating = thisMonthAvg[0]?.avgRating || 0;
    const lastMonthRating = lastMonthAvg[0]?.avgRating || 0;
    
    let trend = 0;
    if (lastMonthRating > 0) {
      trend = ((thisMonthRating - lastMonthRating) / lastMonthRating) * 100;
    }

    res.json({
      success: true,
      data: {
        totalFeedback,
        pendingCount,
        publishedCount,
        respondedCount,
        averageRating: parseFloat(averageRating.toFixed(1)),
        ratingDistribution,
        sentimentStats,
        trend: parseFloat(trend.toFixed(1)),
      },
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
