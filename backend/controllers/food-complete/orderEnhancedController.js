/**
 * 🍽️ Enhanced Order Controller (2025 Production)
 * US-FO-005: Modify/Cancel orders with refund logic
 * US-FO-006: Review system with orderType-specific ratings
 */

import mongoose from 'mongoose';
import FoodOrder from '../../models/FoodOrder.js';
import MenuItem from '../../models/MenuItem.js';
import Review from '../../models/Review.js';
import { createReviewSchema } from '../../validations/food-complete/menuValidation.js';

/**
 * @route   PATCH /api/food-complete/orders/:id/modify
 * @desc    Modify order before kitchen preparation (US-FO-005)
 * @access  Private/Guest
 */
export const modifyOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { items, specialInstructions } = req.body;

    // Find order
    const order = await FoodOrder.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check ownership
    if (order.guestId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to modify this order'
      });
    }

    // Check if order can be modified (only before kitchen starts)
    const modifiableStatuses = ['pending', 'confirmed'];
    if (!modifiableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot modify order in ${order.status} status. Only pending/confirmed orders can be modified.`
      });
    }

    // Calculate new total
    let newSubtotal = 0;
    const updatedItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem || !menuItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Menu item ${item.menuItemId} not available`
        });
      }

      const itemTotal = menuItem.price * item.quantity;
      newSubtotal += itemTotal;

      updatedItems.push({
        menuItemId: item.menuItemId,
        name: menuItem.name || menuItem.name_english,
        quantity: item.quantity,
        price: menuItem.price,
        subtotal: itemTotal,
        customizations: item.customizations || []
      });
    }

    // Apply Jaffna discount (-5%)
    const jaffnaDiscount = newSubtotal * 0.05;
    const newTotal = newSubtotal - jaffnaDiscount;

    // Update order
    order.items = updatedItems;
    order.subtotal = newSubtotal;
    order.discount = jaffnaDiscount;
    order.total = newTotal;
    order.specialInstructions = specialInstructions || order.specialInstructions;
    order.modifiedAt = new Date();

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order modified successfully',
      data: order
    });

  } catch (error) {
    console.error('❌ Modify order error:', error);
    next(error);
  }
};

/**
 * @route   POST /api/food-complete/orders/:id/cancel
 * @desc    Cancel order with refund calculation (US-FO-005)
 * @access  Private/Guest
 */
export const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Find order
    const order = await FoodOrder.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check ownership
    if (order.guestId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['pending', 'confirmed', 'preparing'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order in ${order.status} status`
      });
    }

    // Calculate refund based on status
    let refundAmount = 0;
    let refundPercentage = 0;

    switch (order.status) {
      case 'pending':
      case 'confirmed':
        // Full refund if not yet preparing
        refundAmount = order.total;
        refundPercentage = 100;
        break;
      case 'preparing':
        // 50% refund if already preparing
        refundAmount = order.total * 0.5;
        refundPercentage = 50;
        break;
      default:
        refundAmount = 0;
        refundPercentage = 0;
    }

    // Update order
    order.status = 'cancelled';
    order.cancellationReason = reason;
    order.cancelledAt = new Date();
    order.cancelledBy = req.user.userId;
    order.refundAmount = refundAmount;
    order.refundPercentage = refundPercentage;
    order.refundStatus = refundAmount > 0 ? 'pending' : 'not_applicable';

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        orderId: order._id,
        status: 'cancelled',
        refundAmount,
        refundPercentage,
        refundStatus: order.refundStatus,
        message: refundAmount > 0 
          ? `Refund of LKR ${refundAmount.toFixed(2)} (${refundPercentage}%) will be processed within 3-5 business days`
          : 'No refund applicable for this cancellation'
      }
    });

  } catch (error) {
    console.error('❌ Cancel order error:', error);
    next(error);
  }
};

/**
 * @route   POST /api/food-complete/reviews
 * @desc    Create review for menu item after order completion (US-FO-006)
 * @access  Private/Guest
 */
export const createReview = async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = createReviewSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }))
      });
    }

    const { orderId, menuItemId, foodRating, serviceRating, comment, orderType, tags } = value;

    // Verify order exists and belongs to user
    const order = await FoodOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.guestId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to review this order'
      });
    }

    // Only allow reviews for completed orders
    if (order.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed orders'
      });
    }

    // Verify menu item was in the order
    const orderItem = order.items.find(item => 
      item.menuItemId.toString() === menuItemId
    );
    if (!orderItem) {
      return res.status(400).json({
        success: false,
        message: 'Menu item not found in this order'
      });
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({
      orderId,
      menuItemId,
      guestId: req.user.userId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this item'
      });
    }

    // Create review (assuming Review model exists)
    const Review = mongoose.model('Review', new mongoose.Schema({
      orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodOrder', required: true },
      menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
      guestId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      foodRating: { type: Number, min: 1, max: 5, required: true },
      serviceRating: { type: Number, min: 1, max: 5, required: true },
      averageRating: { type: Number },
      comment: { type: String, trim: true },
      orderType: { type: String, enum: ['dine-in', 'takeaway'], required: true },
      tags: [{ type: String }],
      isVerified: { type: Boolean, default: true },
      createdAt: { type: Date, default: Date.now }
    }));

    const averageRating = (foodRating + serviceRating) / 2;

    const review = await Review.create({
      orderId,
      menuItemId,
      guestId: req.user.userId,
      foodRating,
      serviceRating,
      averageRating,
      comment,
      orderType,
      tags,
      isVerified: true
    });

    // Update menu item aggregate ratings
    await updateMenuItemRatings(menuItemId);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });

  } catch (error) {
    console.error('❌ Create review error:', error);
    next(error);
  }
};

/**
 * @route   GET /api/food-complete/reviews/menu/:menuItemId
 * @desc    Get reviews for a menu item
 * @access  Public
 */
export const getMenuItemReviews = async (req, res, next) => {
  try {
    const { menuItemId } = req.params;
    const { page = 1, limit = 10, orderType } = req.query;

    const query = { menuItemId };
    if (orderType) {
      query.orderType = orderType;
    }

    const skip = (page - 1) * limit;

    const Review = mongoose.model('Review');
    const [reviews, total, aggregateStats] = await Promise.all([
      Review.find(query)
        .populate('guestId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Review.countDocuments(query),
      Review.aggregate([
        { $match: { menuItemId: mongoose.Types.ObjectId(menuItemId) } },
        {
          $group: {
            _id: null,
            avgFoodRating: { $avg: '$foodRating' },
            avgServiceRating: { $avg: '$serviceRating' },
            avgOverallRating: { $avg: '$averageRating' },
            totalReviews: { $sum: 1 },
            dineInCount: {
              $sum: { $cond: [{ $eq: ['$orderType', 'dine-in'] }, 1, 0] }
            },
            takeawayCount: {
              $sum: { $cond: [{ $eq: ['$orderType', 'takeaway'] }, 1, 0] }
            }
          }
        }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        },
        stats: aggregateStats[0] || {
          avgFoodRating: 0,
          avgServiceRating: 0,
          avgOverallRating: 0,
          totalReviews: 0,
          dineInCount: 0,
          takeawayCount: 0
        }
      }
    });

  } catch (error) {
    console.error('❌ Get reviews error:', error);
    next(error);
  }
};

/**
 * Helper: Update menu item aggregate ratings
 */
async function updateMenuItemRatings(menuItemId) {
  try {
    const Review = mongoose.model('Review');
    const stats = await Review.aggregate([
      { $match: { menuItemId: mongoose.Types.ObjectId(menuItemId) } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$averageRating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      await MenuItem.findByIdAndUpdate(menuItemId, {
        averageRating: stats[0].avgRating,
        totalReviews: stats[0].totalReviews
      });
    }
  } catch (error) {
    console.error('❌ Update ratings error:', error);
  }
}

export default {
  modifyOrder,
  cancelOrder,
  createReview,
  getMenuItemReviews
};
