import HotelReview from '../models/HotelReview.js';
import Booking from '../models/Booking.js';
import mongoose from 'mongoose';

// @desc    Get user's reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
export const getUserReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const userId = req.user._id;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    if (status) {
      options.status = status;
    }

    const reviews = await HotelReview.getUserReviews(userId, options);
    
    const total = await HotelReview.countDocuments({ 
      user: userId,
      ...(status && { status })
    });

    res.json({
      success: true,
      data: reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReviews: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    });
  }
};

// @desc    Create a new review
// @route   POST /api/reviews/create
// @access  Private
export const createReview = async (req, res) => {
  try {
    const { bookingId, rating, title, comment, pros, cons, isAnonymous } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!bookingId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID, rating, and comment are required'
      });
    }

    // Verify booking exists and belongs to user - only completed bookings can be reviewed
    const booking = await Booking.findOne({
      _id: bookingId,
      userId: userId,
      status: 'Completed'
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not completed yet. Only completed stays can be reviewed.'
      });
    }

    // Check if review already exists
    const existingReview = await HotelReview.findOne({
      booking: bookingId,
      user: userId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this booking'
      });
    }

    // Create review
    const review = new HotelReview({
      booking: bookingId,
      user: userId,
      rating,
      title: title || `Review for ${booking.roomTitle}`,
      comment,
      pros: pros || [],
      cons: cons || [],
      isAnonymous: isAnonymous || false
    });

    await review.save();

    // Update booking to mark as reviewed
    await Booking.findByIdAndUpdate(bookingId, {
      hasReview: true,
      reviewId: review._id
    });

    // Populate the review before sending response
    await review.populate('booking', 'roomTitle roomNumber checkIn checkOut status bookingNumber');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review
    });
  } catch (error) {
    console.error('Error creating review:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // Handle duplicate review error
    if (error.message.includes('already reviewed')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create review',
      error: error.message
    });
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:reviewId
// @access  Private
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment, pros, cons, isAnonymous } = req.body;
    const userId = req.user._id;

    const review = await HotelReview.findOne({
      _id: reviewId,
      user: userId
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Update fields
    if (rating !== undefined) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (comment !== undefined) review.comment = comment;
    if (pros !== undefined) review.pros = pros;
    if (cons !== undefined) review.cons = cons;
    if (isAnonymous !== undefined) review.isAnonymous = isAnonymous;

    await review.save();
    await review.populate('booking', 'roomTitle roomNumber checkIn checkOut status bookingNumber');

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: error.message
    });
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:reviewId
// @access  Private
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    const review = await HotelReview.findOne({
      _id: reviewId,
      user: userId
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await HotelReview.findByIdAndDelete(reviewId);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message
    });
  }
};

// @desc    Get a specific review
// @route   GET /api/reviews/:reviewId
// @access  Private
export const getReviewById = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    const review = await HotelReview.findOne({
      _id: reviewId,
      user: userId
    }).populate('booking', 'roomTitle roomNumber checkIn checkOut status bookingNumber');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review',
      error: error.message
    });
  }
};

// @desc    Mark review as helpful
// @route   POST /api/reviews/:reviewId/helpful
// @access  Private
export const markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await HotelReview.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await review.markHelpful();

    res.json({
      success: true,
      message: 'Review marked as helpful',
      data: { helpful: review.helpful }
    });
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark review as helpful',
      error: error.message
    });
  }
};

// @desc    Publish a draft review
// @route   PUT /api/reviews/:reviewId/publish
// @access  Private
export const publishReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    const review = await HotelReview.findOne({
      _id: reviewId,
      user: userId
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.status = 'published';
    await review.save();

    res.json({
      success: true,
      message: 'Review published successfully',
      data: review
    });
  } catch (error) {
    console.error('Error publishing review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish review',
      error: error.message
    });
  }
};

// @desc    Get reviews for a specific booking
// @route   GET /api/reviews/booking/:bookingId
// @access  Private
export const getBookingReviews = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const reviews = await HotelReview.getBookingReviews(bookingId);

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error('Error fetching booking reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking reviews',
      error: error.message
    });
  }
};

// @desc    Get hotel reviews (public)
// @route   GET /api/reviews/hotel
// @access  Public
export const getHotelReviews = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      rating, 
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const query = { status: 'published' };

    if (rating) {
      query.rating = rating;
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj = { [sortBy]: sortOrder };

    const reviews = await HotelReview.find(query)
      .populate('booking', 'roomTitle roomNumber')
      .populate('user', 'firstName lastName', null, { isAnonymous: false })
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await HotelReview.countDocuments(query);

    res.json({
      success: true,
      data: reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReviews: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching hotel reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hotel reviews',
      error: error.message
    });
  }
};

// @desc    Get user review statistics
// @route   GET /api/reviews/my-stats
// @access  Private
export const getUserReviewStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await HotelReview.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          totalHelpful: { $sum: '$helpful' },
          statusBreakdown: {
            $push: '$status'
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalReviews: 0,
      averageRating: 0,
      totalHelpful: 0,
      statusBreakdown: []
    };

    // Count status breakdown
    const statusCounts = result.statusBreakdown.reduce((acc, status) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        totalReviews: result.totalReviews,
        averageRating: Math.round(result.averageRating * 10) / 10,
        totalHelpful: result.totalHelpful,
        published: statusCounts.published || 0,
        draft: statusCounts.draft || 0,
        pending: statusCounts.pending || 0
      }
    });
  } catch (error) {
    console.error('Error fetching user review stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review statistics',
      error: error.message
    });
  }
};