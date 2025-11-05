import Offer from '../models/Offer.js';
import FoodOrder from '../models/FoodOrder.js';
import { offerSchema, updateOfferSchema } from '../validations/offerValidation.js';
import mongoose from 'mongoose';

// Generate a unique code for offers
const generateOfferCode = () => {
  return `OFFER-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
};

// Create a new offer
export const createOffer = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = offerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        error: error.details[0].message 
      });
    }

    // Generate code if not provided
    if (!value.code) {
      value.code = generateOfferCode();
    }

    // Add createdBy from authenticated user
    const offerData = {
      ...value,
      createdBy: req.user.id
    };

    const offer = new Offer(offerData);
    await offer.save();

    res.status(201).json({
      success: true,
      message: 'Offer created successfully',
      data: offer
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Offer code already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating offer',
      error: error.message
    });
  }
};

// Get active offers (public - no auth required)
export const getActiveOffers = async (req, res) => {
  try {
    const currentDate = new Date();
    
    // Get all currently active offers
    const activeOffers = await Offer.find({
      isActive: true,
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate }
    })
    .sort({ createdAt: -1 })
    .select('-__v'); // Exclude version field

    res.status(200).json({
      success: true,
      data: activeOffers,
      message: 'Active offers retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching active offers',
      error: error.message
    });
  }
};

// Get all offers (admin)
export const getAllOffers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const offers = await Offer.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Offer.countDocuments();

    res.status(200).json({
      success: true,
      data: offers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching offers',
      error: error.message
    });
  }
};

// Get offer by ID
export const getOfferById = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: offer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching offer',
      error: error.message
    });
  }
};

// Update offer
export const updateOffer = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = updateOfferSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        error: error.details[0].message 
      });
    }

    const offer = await Offer.findByIdAndUpdate(
      req.params.id,
      value,
      { new: true, runValidators: true }
    );

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Offer updated successfully',
      data: offer
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Offer code already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating offer',
      error: error.message
    });
  }
};

// Delete offer
export const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Offer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting offer',
      error: error.message
    });
  }
};

// Get personalized offers for a user
export const getPersonalizedOffers = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();

    // Get user's order history
    const orderHistory = await FoodOrder.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          count: { $sum: '$items.quantity' },
          category: { $first: '$items.category' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get all active offers
    const activeOffers = await Offer.find({
      isActive: true,
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate }
    });

    // Filter offers based on user history
    const eligibleOffers = activeOffers.filter(offer => {
      // Check if user meets minimum order requirements
      if (offer.target && offer.target.minOrders) {
        const matchingItem = orderHistory.find(
          item => item.count >= offer.target.minOrders
        );
        
        if (!matchingItem) {
          return false;
        }
      }

      // Check if user has ordered specific Jaffna items
      if (offer.jaffnaItems && offer.jaffnaItems.length > 0) {
        const hasOrderedJaffnaItem = orderHistory.some(item => {
          const itemName = item._id ? item._id.toLowerCase() : '';
          return offer.jaffnaItems.some(jaffnaItem => 
            itemName.includes(jaffnaItem.toLowerCase())
          );
        });
        
        if (!hasOrderedJaffnaItem) {
          return false;
        }
      }

      // Check redemption limits
      if (offer.maxRedemptions && offer.redemptions >= offer.maxRedemptions) {
        return false;
      }

      return true;
    });

    res.status(200).json({
      success: true,
      data: eligibleOffers,
      message: 'Personalized offers retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching personalized offers',
      error: error.message
    });
  }
};

// Apply offer to order
export const applyOffer = async (req, res) => {
  try {
    const { offerCode, orderId } = req.body;
    const userId = req.user.id;

    // Verify offer exists and is valid
    const offer = await Offer.findOne({ code: offerCode });
    if (!offer || !offer.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or inactive offer'
      });
    }

    const currentDate = new Date();
    if (currentDate < offer.startDate || currentDate > offer.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Offer is not currently active'
      });
    }

    // Verify order belongs to user
    const order = await FoodOrder.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if offer has been applied to this order already
    const alreadyApplied = order.appliedOffers.some(applied => 
      applied.offerId.toString() === offer._id.toString()
    );
    
    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        message: 'Offer already applied to this order'
      });
    }

    // Calculate discount
    let discountAmount = 0;
    switch (offer.type) {
      case 'percentage':
        discountAmount = (order.totalPrice * offer.discountValue) / 100;
        break;
      case 'fixed_amount':
        discountAmount = Math.min(offer.discountValue, order.totalPrice);
        break;
      case 'free_item':
        // For free item offers, we might need additional logic
        discountAmount = 0;
        break;
    }

    // Update order with applied offer
    order.appliedOffers.push({
      offerId: offer._id,
      code: offer.code,
      title: offer.title,
      description: offer.description,
      type: offer.type,
      discountValue: offer.discountValue,
      discountAmount: discountAmount
    });

    order.totalPrice = order.totalPrice - discountAmount;
    await order.save();

    // Update offer redemption count
    offer.redemptions += 1;
    await offer.save();

    res.status(200).json({
      success: true,
      message: 'Offer applied successfully',
      data: {
        order,
        discountAmount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error applying offer',
      error: error.message
    });
  }
};

// Get user order history with counts
export const getUserOrderHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's order history with aggregation
    const history = await FoodOrder.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          count: { $sum: '$items.quantity' },
          category: { $first: '$items.category' },
          totalPrice: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: history,
      message: 'Order history retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order history',
      error: error.message
    });
  }
};