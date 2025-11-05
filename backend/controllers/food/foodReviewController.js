import Review from '../../models/Review.js';
import Menu from '../../models/Menu.js';
import { validationResult } from 'express-validator';

// Get reviews for a menu item
export const getMenuItemReviews = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      sort = 'recent', 
      rating, 
      helpful 
    } = req.query;

    // Check if menu item exists
    const menuItem = await Menu.findById(menuItemId);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Build query
    let query = { menuItem: menuItemId };
    
    if (rating) {
      query.rating = parseInt(rating);
    }

    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case 'recent':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'highest':
        sortOptions = { rating: -1, createdAt: -1 };
        break;
      case 'lowest':
        sortOptions = { rating: 1, createdAt: -1 };
        break;
      case 'most_helpful':
        sortOptions = { helpfulVotes: -1, createdAt: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find(query)
      .populate('customer', 'firstName lastName email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const totalReviews = await Review.countDocuments(query);

    res.json({
      success: true,
      data: reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReviews / parseInt(limit)),
        totalReviews,
        hasNext: skip + reviews.length < totalReviews,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    });
  }
};

// Get all reviews (for admin panel)
export const getAllReviews = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = 'recent', 
      rating, 
      flagged = 'all',
      search
    } = req.query;

    // Build query
    let query = {};
    
    if (rating) {
      query.rating = parseInt(rating);
    }

    if (flagged !== 'all') {
      if (flagged === 'flagged') {
        query['reports.0'] = { $exists: true };
      } else if (flagged === 'unflagged') {
        query['reports.0'] = { $exists: false };
      }
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { comment: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case 'recent':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'highest':
        sortOptions = { rating: -1, createdAt: -1 };
        break;
      case 'lowest':
        sortOptions = { rating: 1, createdAt: -1 };
        break;
      case 'most_helpful':
        sortOptions = { helpfulVotes: -1, createdAt: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find(query)
      .populate('customer', 'firstName lastName email')
      .populate('menuItem', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const totalReviews = await Review.countDocuments(query);

    res.json({
      success: true,
      data: reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReviews / parseInt(limit)),
        totalReviews,
        hasNext: skip + reviews.length < totalReviews,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    });
  }
};

// Submit a review
export const submitReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { menuItemId } = req.params;
    const { rating, title, comment, isAnonymous, helpful } = req.body;
    const customerId = req.user.id;

    // Check if menu item exists
    const menuItem = await Menu.findById(menuItemId);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Check if user has already reviewed this item
    const existingReview = await Review.findOne({
      menuItem: menuItemId,
      customer: customerId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this item'
      });
    }

    const review = new Review({
      menuItem: menuItemId,
      customer: customerId,
      rating: parseInt(rating),
      title: title.trim(),
      comment: comment.trim(),
      isAnonymous: isAnonymous || false,
      helpful: helpful !== false,
      helpfulVotes: 0,
      notHelpfulVotes: 0
    });

    await review.save();

    // Populate customer info for response
    await review.populate('customer', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review',
      error: error.message
    });
  }
};

// Vote on a review (helpful/not helpful)
export const voteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { isHelpful } = req.body;
    const customerId = req.user.id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user has already voted
    const existingVote = await Review.findOne({
      _id: reviewId,
      voters: customerId
    });

    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted on this review'
      });
    }

    // Update vote counts
    if (isHelpful) {
      review.helpfulVotes += 1;
    } else {
      review.notHelpfulVotes += 1;
    }

    review.voters.push(customerId);
    await review.save();

    res.json({
      success: true,
      message: 'Vote recorded successfully',
      data: {
        helpfulVotes: review.helpfulVotes,
        notHelpfulVotes: review.notHelpfulVotes
      }
    });
  } catch (error) {
    console.error('Error voting on review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record vote',
      error: error.message
    });
  }
};

// Report a review
export const reportReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason, description } = req.body;
    const reporterId = req.user.id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user has already reported this review
    if (review.reports.some(report => report.reporter.toString() === reporterId)) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this review'
      });
    }

    review.reports.push({
      reporter: reporterId,
      reason: reason || 'Inappropriate content',
      description: description || '',
      reportedAt: new Date()
    });

    await review.save();

    res.json({
      success: true,
      message: 'Review reported successfully'
    });
  } catch (error) {
    console.error('Error reporting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report review',
      error: error.message
    });
  }
};

// Get review statistics for a menu item
export const getReviewStats = async (req, res) => {
  try {
    const { menuItemId } = req.params;

    const stats = await Review.aggregate([
      { $match: { menuItem: menuItemId } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalReviews: 1,
          averageRating: { $round: ['$averageRating', 1] },
          ratingDistribution: {
            $reduce: {
              input: '$ratingDistribution',
              initialValue: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
              in: {
                $cond: {
                  if: { $eq: ['$$this', 5] },
                  then: { $mergeObjects: ['$$value', { 5: { $add: [{ $ifNull: ['$$value.5', 0] }, 1] } }] },
                  else: {
                    $cond: {
                      if: { $eq: ['$$this', 4] },
                      then: { $mergeObjects: ['$$value', { 4: { $add: [{ $ifNull: ['$$value.4', 0] }, 1] } }] },
                      else: {
                        $cond: {
                          if: { $eq: ['$$this', 3] },
                          then: { $mergeObjects: ['$$value', { 3: { $add: [{ $ifNull: ['$$value.3', 0] }, 1] } }] },
                          else: {
                            $cond: {
                              if: { $eq: ['$$this', 2] },
                              then: { $mergeObjects: ['$$value', { 2: { $add: [{ $ifNull: ['$$value.2', 0] }, 1] } }] },
                              else: { $mergeObjects: ['$$value', { 1: { $add: [{ $ifNull: ['$$value.1', 0] }, 1] } }] }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review statistics',
      error: error.message
    });
  }
};

// Get overall review statistics (for admin panel)
export const getAllReviewStats = async (req, res) => {
  try {
    const stats = await Review.aggregate([
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          totalHelpfulVotes: { $sum: '$helpfulVotes' },
          totalNotHelpfulVotes: { $sum: '$notHelpfulVotes' },
          ratingDistribution: {
            $push: '$rating'
          },
          flaggedReviews: {
            $sum: {
              $cond: [{ $gt: [{ $size: { $ifNull: ['$reports', []] } }, 0] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalReviews: 1,
          averageRating: { $round: ['$averageRating', 1] },
          totalHelpfulVotes: 1,
          totalNotHelpfulVotes: 1,
          flaggedReviews: 1,
          ratingDistribution: {
            $reduce: {
              input: '$ratingDistribution',
              initialValue: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
              in: {
                $cond: {
                  if: { $eq: ['$$this', 5] },
                  then: { $mergeObjects: ['$$value', { 5: { $add: [{ $ifNull: ['$$value.5', 0] }, 1] } }] },
                  else: {
                    $cond: {
                      if: { $eq: ['$$this', 4] },
                      then: { $mergeObjects: ['$$value', { 4: { $add: [{ $ifNull: ['$$value.4', 0] }, 1] } }] },
                      else: {
                        $cond: {
                          if: { $eq: ['$$this', 3] },
                          then: { $mergeObjects: ['$$value', { 3: { $add: [{ $ifNull: ['$$value.3', 0] }, 1] } }] },
                          else: {
                            $cond: {
                              if: { $eq: ['$$this', 2] },
                              then: { $mergeObjects: ['$$value', { 2: { $add: [{ $ifNull: ['$$value.2', 0] }, 1] } }] },
                              else: { $mergeObjects: ['$$value', { 1: { $add: [{ $ifNull: ['$$value.1', 0] }, 1] } }] }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalReviews: 0,
      averageRating: 0,
      totalHelpfulVotes: 0,
      totalNotHelpfulVotes: 0,
      flaggedReviews: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching all review stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review statistics',
      error: error.message
    });
  }
};
