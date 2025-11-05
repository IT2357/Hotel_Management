const express = require('express');
const router = express.Router();
const auth = require('../../../middleware/auth');
const FoodReview = require('../models/FoodReview');
const FoodOrder = require('../../../models/FoodOrder');
const MenuItem = require('../../../models/MenuItem');
const { check, validationResult } = require('express-validator');

// @route   POST /food-reviews/submit
// @desc    Submit a food review
// @access  Private
router.post('/submit', 
  auth,
  [
    check('orderId', 'Order ID is required').notEmpty(),
    check('orderType', 'Order type is required').isIn(['dine-in', 'takeaway', 'room-service']),
    check('ratings.overall', 'Overall rating is required').isInt({ min: 1, max: 5 }),
    check('ratings.food.taste', 'Food taste rating is required').isInt({ min: 1, max: 5 }),
    check('feedback', 'Feedback is too long').optional().isLength({ max: 500 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { orderId, orderType, ratings, feedback, isAnonymous, photos, bookingId } = req.body;
      
      // Check if order exists and belongs to user
      const order = await FoodOrder.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, msg: 'Order not found' });
      }
      
      if (order.user.toString() !== req.user.id) {
        return res.status(401).json({ success: false, msg: 'User not authorized' });
      }
      
      // Check if review already exists for this order
      const existingReview = await FoodReview.findOne({ orderId });
      if (existingReview) {
        return res.status(400).json({ success: false, msg: 'Review already submitted for this order' });
      }
      
      // Create review object
      const reviewFields = {
        orderId,
        userId: req.user.id,
        orderType,
        ratings,
        isAnonymous: isAnonymous || false
      };
      
      if (feedback) reviewFields.feedback = feedback;
      if (photos) reviewFields.photos = photos;
      if (bookingId) reviewFields.bookingId = bookingId;
      
      const review = new FoodReview(reviewFields);
      await review.save();
      
      // Update menu item ratings
      await updateMenuItemRatings(order);
      
      // Check for low ratings and notify admin if needed
      const avgRating = ratings.overall;
      if (avgRating < 3) {
        // In a real implementation, we would call the existing notify API
        console.log(`Low rating alert for order ${orderId}: ${avgRating} stars`);
      }
      
      res.json({ success: true, data: review });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ success: false, msg: 'Server Error' });
    }
  }
);

// @route   GET /food-reviews/fetch/:orderId
// @desc    Get review for a specific order
// @access  Private
router.get('/fetch/:orderId', auth, async (req, res) => {
  try {
    const review = await FoodReview.findOne({ orderId: req.params.orderId });
    
    if (!review) {
      return res.status(404).json({ success: false, msg: 'Review not found' });
    }
    
    // Check if user is authorized to view this review
    if (review.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, msg: 'User not authorized' });
    }
    
    res.json({ success: true, data: review });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ success: false, msg: 'Review not found' });
    }
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
});

// @route   GET /food-reviews/analytics
// @desc    Get review analytics
// @access  Admin
router.get('/analytics', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(401).json({ success: false, msg: 'User not authorized' });
    }
    
    // Aggregate review data
    const analytics = await FoodReview.aggregate([
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          avgOverallRating: { $avg: '$ratings.overall' },
          avgFoodTaste: { $avg: '$ratings.food.taste' },
          avgFoodFreshness: { $avg: '$ratings.food.freshness' },
          avgFoodPresentation: { $avg: '$ratings.food.presentation' },
          avgServiceStaff: { $avg: '$ratings.service.staff' },
          avgServiceSpeed: { $avg: '$ratings.service.speed' },
          avgServiceAmbiance: { $avg: '$ratings.service.ambiance' },
          ratingsDistribution: {
            $push: '$ratings.overall'
          }
        }
      }
    ]);
    
    // Calculate distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (analytics.length > 0) {
      analytics[0].ratingsDistribution.forEach(rating => {
        distribution[rating]++;
      });
      delete analytics[0].ratingsDistribution;
    }
    
    res.json({ success: true, data: analytics[0] || {}, distribution });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
});

// Helper function to update menu item ratings
async function updateMenuItemRatings(order) {
  try {
    // For each item in the order, update its rating
    for (const item of order.items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (menuItem) {
        // Calculate new average
        const newTotalReviews = menuItem.totalReviews + 1;
        const currentRatingSum = menuItem.avgRating * menuItem.totalReviews;
        const newRatingSum = currentRatingSum + item.rating; // Assuming item.rating is passed
        const newAvgRating = newRatingSum / newTotalReviews;
        
        // Update menu item
        await MenuItem.findByIdAndUpdate(item.menuItem, {
          $set: {
            avgRating: newAvgRating
          },
          $inc: {
            totalReviews: 1
          }
        });
      }
    }
  } catch (err) {
    console.error('Error updating menu item ratings:', err.message);
  }
}

module.exports = router;