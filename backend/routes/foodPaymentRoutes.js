import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/roleAuth.js";
import payHereService from "../services/payHereService.js";
import FoodOrder from "../models/FoodOrder.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import logger from "../utils/logger.js";

const router = express.Router();

// PayHere webhook notification handler
router.post("/notify", catchAsync(async (req, res) => {
  const notificationData = req.body;
  
  logger.info('PayHere notification received', notificationData);
  
  // Verify the notification signature
  const isValid = payHereService.verifyPaymentNotification(notificationData);
  
  if (!isValid) {
    logger.error('Invalid PayHere notification signature', notificationData);
    return res.status(400).json({ success: false, message: 'Invalid signature' });
  }
  
  const { order_id, status_code, payhere_amount, payhere_currency } = notificationData;
  
  // Find the order
  const order = await FoodOrder.findOne({ 
    $or: [
      { _id: order_id },
      { paymentId: order_id }
    ]
  });
  
  if (!order) {
    logger.error('Order not found for PayHere notification', { order_id });
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  
  // Update order status based on payment result
  if (status_code === "2") {
    // Payment successful
    order.paymentStatus = "Paid";
    order.status = "Confirmed";
    order.paymentId = notificationData.payment_id || order.paymentId;
    
    logger.info('Payment successful for order', { 
      orderId: order._id, 
      paymentId: notificationData.payment_id 
    });
  } else if (status_code === "0") {
    // Payment cancelled
    order.paymentStatus = "Cancelled";
    order.status = "Cancelled";
    
    logger.info('Payment cancelled for order', { orderId: order._id });
  } else {
    // Payment failed
    order.paymentStatus = "Failed";
    order.status = "Cancelled";
    
    logger.info('Payment failed for order', { orderId: order._id });
  }
  
  await order.save();
  
  res.status(200).json({ success: true, message: 'Notification processed' });
}));

// Verify payment status
router.post("/verify", catchAsync(async (req, res) => {
  const { orderId } = req.body;
  
  if (!orderId) {
    throw new AppError('Order ID is required', 400);
  }
  
  const order = await FoodOrder.findOne({ 
    $or: [
      { _id: orderId },
      { paymentId: orderId }
    ]
  });
  
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  
  res.status(200).json({
    success: true,
    data: {
      orderId: order._id,
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
      paymentId: order.paymentId
    }
  });
}));

// Get payment status
router.get("/status/:orderId", catchAsync(async (req, res) => {
  const { orderId } = req.params;
  
  const order = await FoodOrder.findOne({ 
    $or: [
      { _id: orderId },
      { paymentId: orderId }
    ]
  });
  
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  
  res.status(200).json({
    success: true,
    data: {
      orderId: order._id,
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
      paymentId: order.paymentId,
      totalPrice: order.totalPrice,
      currency: order.currency
    }
  });
}));

// Initialize payment (for frontend)
router.post("/initialize", catchAsync(async (req, res) => {
  const { orderId, amount, customerDetails } = req.body;
  
  if (!orderId || !amount || !customerDetails) {
    throw new AppError('Order ID, amount, and customer details are required', 400);
  }
  
  // Generate PayHere payment data
  const payHereData = payHereService.generatePaymentData({
    orderId,
    amount,
    currency: "LKR",
    customerName: customerDetails.customerName,
    customerEmail: customerDetails.customerEmail,
    customerPhone: customerDetails.customerPhone,
    items: [{ name: 'Food Order', quantity: 1, price: amount }],
    custom1: req.user ? req.user.id : null,
    custom2: orderId
  });

  const hash = payHereService.generateHash(payHereData);
  
  res.status(200).json({
    success: true,
    data: {
      ...payHereData,
      hash: hash
    }
  });
}));

export default router;
