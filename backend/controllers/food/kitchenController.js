import FoodOrder from '../../models/FoodOrder.js';
import { User } from '../../models/User.js';
import { validationResult } from 'express-validator';

// Get kitchen statistics
export const getKitchenStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats = await FoodOrder.aggregate([
      {
        $match: {
          createdAt: {
            $gte: today,
            $lt: tomorrow
          }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Initialize stats object
    const result = {
      pending: 0,
      preparing: 0,
      ready: 0,
      completed: 0,
      totalToday: 0
    };

    // Populate stats from aggregation
    stats.forEach(stat => {
      result[stat._id] = stat.count;
      result.totalToday += stat.count;
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching kitchen stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch kitchen statistics',
      error: error.message
    });
  }
};

// Get kitchen orders
export const getKitchenOrders = async (req, res) => {
  try {
    const { 
      status, 
      search, 
      page = 1, 
      limit = 20, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    // Build query - ✅ Show active kitchen orders by default
    let query = {};
    
    if (status && status !== 'all') {
      // Support both status and kitchenStatus filtering
      query.$or = [
        { status: status },
        { kitchenStatus: status }
      ];
    } else {
      // Default: show orders that need kitchen attention (exclude delivered/cancelled)
      query.status = { $nin: ['delivered', 'cancelled'] };
    }

    // ✅ Include scheduled meal plan orders that are due today or overdue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Expand query to include scheduled orders for today
    query.$or = query.$or || [];
    query.$or.push(
      // Regular active orders
      { 
        status: { $nin: ['delivered', 'cancelled'] },
        $or: [
          { scheduledDate: { $exists: false } },
          { scheduledDate: { $lte: today } }
        ]
      },
      // Scheduled meal plan orders for today
      { 
        isPartOfMealPlan: true,
        scheduledDate: { 
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        },
        status: { $in: ['scheduled', 'pending'] }
      }
    );

    if (search) {
      const searchQuery = {
        $or: [
          { 'customerDetails.name': { $regex: search, $options: 'i' } },
          { 'customerDetails.email': { $regex: search, $options: 'i' } },
          { 'customerDetails.phone': { $regex: search, $options: 'i' } },
          { roomNumber: { $regex: search, $options: 'i' } }
        ]
      };
      // Combine search with existing query
      query = { $and: [query, searchQuery] };
    }

    // Build sort options - prioritize urgent orders
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // ✅ Fix populate fields to match FoodOrder model schema
    const orders = await FoodOrder.find(query)
      .populate('assignedTo', 'name email') // Fixed: was assignedStaff
      .populate('userId', 'name email')
      .populate('items.foodId', 'name price imageUrl') // Fixed: was items.menuItem
      .populate('bookingId', 'bookingNumber roomTitle')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const totalOrders = await FoodOrder.countDocuments(query);

    console.log(`🍳 Kitchen orders fetched: ${orders.length} orders (total: ${totalOrders})`);

    res.json({
      success: true,
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / parseInt(limit)),
        totalOrders,
        hasNext: skip + orders.length < totalOrders,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching kitchen orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch kitchen orders',
      error: error.message
    });
  }
};

// Get order details
export const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await FoodOrder.findById(orderId)
      .populate('assignedTo', 'name email phone') // Fixed: was assignedStaff
      .populate('userId', 'name email phone')
      .populate('items.foodId', 'name description price imageUrl') // Fixed: was items.menuItem and image
      .populate('bookingId', 'bookingNumber roomTitle checkIn checkOut')
      .select('-__v');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
      error: error.message
    });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { orderId } = req.params;
    const { status, notes } = req.body;
    const staffId = req.user.id;

    const order = await FoodOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Validate status transition
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['ready', 'cancelled'],
      'ready': ['delivered', 'cancelled'],
      'delivered': [],
      'cancelled': []
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${order.status} to ${status}`
      });
    }

    // Update order
    order.status = status;
    order.updatedBy = staffId;
    
    if (notes) {
      order.statusHistory.push({
        status,
        updatedBy: staffId,
        updatedAt: new Date(),
        notes
      });
    } else {
      order.statusHistory.push({
        status,
        updatedBy: staffId,
        updatedAt: new Date()
      });
    }

    await order.save();

    // Populate updated order
    await order.populate('assignedStaff', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

// Assign order to staff
export const assignOrderToStaff = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { orderId } = req.params;
    const { staffId } = req.body;

    const order = await FoodOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if staff exists and has kitchen role
    const staff = await User.findById(staffId);
    if (!staff || !['staff', 'manager', 'admin'].includes(staff.role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff member'
      });
    }

    // Update order
    order.assignedStaff = staffId;
    order.assignedAt = new Date();
    order.assignedBy = req.user.id;

    order.statusHistory.push({
      status: order.status,
      updatedBy: req.user.id,
      updatedAt: new Date(),
      notes: `Assigned to ${staff.firstName} ${staff.lastName}`
    });

    await order.save();

    // Populate updated order
    await order.populate('assignedStaff', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Order assigned successfully',
      data: order
    });
  } catch (error) {
    console.error('Error assigning order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign order',
      error: error.message
    });
  }
};

// Get orders assigned to specific staff
export const getStaffOrders = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { 
      status, 
      page = 1, 
      limit = 20, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    // Build query
    let query = { assignedStaff: staffId };
    
    if (status && status !== 'all') {
      query.status = status;
    }

    // Build sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await FoodOrder.find(query)
      .populate('assignedStaff', 'firstName lastName email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const totalOrders = await FoodOrder.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / parseInt(limit)),
        totalOrders,
        hasNext: skip + orders.length < totalOrders,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching staff orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff orders',
      error: error.message
    });
  }
};
