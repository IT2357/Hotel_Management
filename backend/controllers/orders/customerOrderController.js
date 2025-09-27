// 📁 backend/controllers/orders/customerOrderController.js
import Order from "../../models/Order.js";
import Food from "../../models/Food.js";
import { validationResult } from "express-validator";

// @desc    Get customer orders (for guest users)
// @route   GET /api/orders/customer/:customerEmail
// @access  Public
export const getCustomerOrders = async (req, res) => {
  try {
    const { customerEmail } = req.params;
    const { status, limit = 20, page = 1 } = req.query;

    let query = { 'customerInfo.email': customerEmail };
    
    if (status && status !== 'all') {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('items.menuItem', 'name images category basePrice displayPrice')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: orders
    });
  } catch (error) {
    console.error('Get customer orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer orders',
      error: error.message
    });
  }
};

// @desc    Create new customer order
// @route   POST /api/orders/customer
// @access  Public
export const createCustomerOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { items, customerInfo, orderType, tableNumber, specialInstructions } = req.body;
    
    // Verify all menu items exist and calculate totals
    let calculatedSubtotal = 0;
    const processedItems = [];

    for (const orderItem of items) {
      const foodItem = await Food.findById(orderItem.menuItemId);
      if (!foodItem) {
        return res.status(400).json({
          success: false,
          message: `Food item not found: ${orderItem.name}`
        });
      }

      if (!foodItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Food item is not available: ${orderItem.name}`
        });
      }

      // Use the price from the order item or fallback to food item price
      let itemPrice = orderItem.price || foodItem.basePrice || foodItem.displayPrice || 0;

      const itemTotal = itemPrice * orderItem.quantity;
      calculatedSubtotal += itemTotal;

      processedItems.push({
        menuItem: foodItem._id,
        name: foodItem.name,
        quantity: orderItem.quantity,
        price: itemPrice,
        itemTotal: itemTotal,
        selectedPortion: orderItem.selectedPortion || null,
        specialInstructions: orderItem.specialInstructions || null
      });
    }

    // Calculate taxes and charges
    const tax = Math.round(calculatedSubtotal * 0.125 * 100) / 100; // 12.5% tax
    const serviceCharge = Math.round(calculatedSubtotal * 0.10 * 100) / 100; // 10% service charge
    const total = Math.round((calculatedSubtotal + tax + serviceCharge) * 100) / 100;

    // Create order
    const orderData = {
      items: processedItems,
      customerInfo,
      orderType: orderType || 'dine-in',
      tableNumber: orderType === 'dine-in' ? tableNumber : null,
      specialInstructions,
      subtotal: calculatedSubtotal,
      tax,
      serviceCharge,
      total,
      status: 'Confirmed',
      confirmedAt: new Date()
    };

    const order = await Order.create(orderData);

    // Populate the created order for response
    const populatedOrder = await Order.findById(order._id)
      .populate('items.menuItem', 'name images category');

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: populatedOrder
    });
  } catch (error) {
    console.error('Create customer order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

// @desc    Get order status for customer
// @route   GET /api/orders/customer/status/:orderNumber
// @access  Public
export const getOrderStatus = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    const order = await Order.findOne({ orderNumber })
      .select('orderNumber status createdAt confirmedAt readyAt completedAt estimatedReadyTime')
      .populate('items.menuItem', 'name');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Calculate estimated time based on status
    let estimatedTime = null;
    if (order.status === 'Confirmed' || order.status === 'Preparing') {
      const now = new Date();
      const orderTime = order.confirmedAt || order.createdAt;
      const elapsedMinutes = Math.floor((now - orderTime) / (1000 * 60));
      const remainingTime = Math.max(0, 25 - elapsedMinutes); // Assume 25 min prep time
      estimatedTime = remainingTime > 0 ? `${remainingTime} minutes` : 'Ready soon';
    } else if (order.status === 'Ready') {
      estimatedTime = 'Ready for pickup/serving';
    } else if (order.status === 'Completed') {
      estimatedTime = 'Completed';
    }

    res.status(200).json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        estimatedTime,
        itemCount: order.items.length,
        createdAt: order.createdAt,
        confirmedAt: order.confirmedAt,
        readyAt: order.readyAt,
        completedAt: order.completedAt
      }
    });
  } catch (error) {
    console.error('Get order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order status',
      error: error.message
    });
  }
};
