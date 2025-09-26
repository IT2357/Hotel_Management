// 📁 backend/controllers/orders/orderController.js
import Order from "../../models/Order.js";
import MenuItem from "../../models/MenuItem.js";
import { validationResult } from "express-validator";

// @desc    Create new order
// @route   POST /api/orders
// @access  Public
export const createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Verify all menu items exist and calculate totals
    const { items } = req.body;
    let calculatedSubtotal = 0;

    for (const orderItem of items) {
      const menuItem = await MenuItem.findById(orderItem.menuItem);
      if (!menuItem) {
        return res.status(400).json({
          success: false,
          message: `Menu item not found: ${orderItem.name}`
        });
      }

      if (!menuItem.isActive || !menuItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Menu item is not available: ${orderItem.name}`
        });
      }

      calculatedSubtotal += orderItem.itemTotal;
    }

    // Validate calculated totals
    const { subtotal, tax, serviceCharge, total } = req.body;
    const expectedTax = subtotal * 0.1;
    const expectedServiceCharge = subtotal * 0.05;
    const expectedTotal = subtotal + expectedTax + expectedServiceCharge;

    if (Math.abs(calculatedSubtotal - subtotal) > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Subtotal calculation mismatch'
      });
    }

    if (Math.abs(expectedTotal - total) > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Total calculation mismatch'
      });
    }

    const order = await Order.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Public
export const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.menuItem', 'name images category');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};

// @desc    Get order by order number
// @route   GET /api/orders/number/:orderNumber
// @access  Public
export const getOrderByNumber = async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber })
      .populate('items.menuItem', 'name images category');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order by number error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private (Staff/Admin)
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Completed', 'Cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update status and timestamps
    order.status = status;
    
    switch (status) {
      case 'Confirmed':
        order.confirmedAt = new Date();
        break;
      case 'Ready':
        order.readyAt = new Date();
        break;
      case 'Completed':
        order.completedAt = new Date();
        break;
      case 'Cancelled':
        order.cancelledAt = new Date();
        if (req.body.cancellationReason) {
          order.cancellationReason = req.body.cancellationReason;
        }
        break;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};
