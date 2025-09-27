// 📁 backend/controllers/food/foodOrderController.js
import FoodOrder from '../../models/FoodOrder.js';

// Create food order
export const createFoodOrder = async (req, res) => {
  try {
    const orderData = req.body;
    const newOrder = new FoodOrder(orderData);
    await newOrder.save();
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      orderId: newOrder._id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
};

// Get customer orders
export const getCustomerOrders = async (req, res) => {
  try {
    const { customerEmail } = req.params;
    const orders = await FoodOrder.find({ customerEmail }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// Get all food orders (admin)
export const getAllFoodOrders = async (req, res) => {
  try {
    const orders = await FoodOrder.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// Get food order by ID
export const getFoodOrder = async (req, res) => {
  try {
    const order = await FoodOrder.findById(req.params.id);
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
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await FoodOrder.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Order status updated',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
};

// Get order stats
export const getOrderStats = async (req, res) => {
  try {
    const stats = await FoodOrder.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order stats',
      error: error.message
    });
  }
};
