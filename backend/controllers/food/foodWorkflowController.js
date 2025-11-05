// 📁 backend/controllers/food/foodWorkflowController.js
// Enhanced Food Order Workflow Controller
// Real-world hospitality workflow: Order → Payment → Kitchen → Prep → Delivery → Review
import FoodOrder from '../../models/FoodOrder.js';
import FoodTaskQueue from '../../models/FoodTaskQueue.js';
import MenuItem from '../../models/MenuItem.js';
import FoodReview from '../../models/FoodReview.js';
import { User } from '../../models/User.js';
import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/appError.js';
import logger from '../../utils/logger.js';
import { getIO } from '../../utils/socket.js';

// ==================== ORDER CONFIRMATION (Post-Payment) ====================
// Step 2: Payment & Confirmation
// Triggered after successful PayHere payment, emits Socket.io event to kitchen
export const confirmFoodOrder = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const { paymentId, transactionId } = req.body;

  const order = await FoodOrder.findById(orderId).populate('items.foodId', 'name preparationTimeMinutes');
  
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Update payment info
  if (paymentId) order.paymentId = paymentId;
  if (transactionId) order.transactionId = transactionId;
  order.paymentStatus = 'Paid';
  
  // Check if order is room service (room-linked via orderType or special flag)
  const isRoomService = order.orderType === 'room-service' || 
                        (order.deliveryLocation && /room/i.test(order.deliveryLocation));
  
  // Set priority for room orders
  if (isRoomService) {
    order.status = 'pending'; // Will be handled with high priority
  }

  // Create initial task queue entry for kitchen prep
  const prepTask = await FoodTaskQueue.create({
    orderId: order._id,
    taskType: 'prep',
    status: 'queued',
    priority: isRoomService ? 'urgent' : 'normal',
    isRoomService,
    estimatedCompletionTime: new Date(Date.now() + 5 * 60 * 1000) // 5 min for prep
  });

  // Add timeline entry
  if (!order.taskHistory) order.taskHistory = [];
  order.taskHistory.push({
    status: 'Confirmed',
    updatedAt: new Date(),
    note: 'Payment confirmed, order queued for kitchen'
  });

  await order.save();

  // Emit Socket.io event to manager/kitchen room
  const io = getIO();
  io.to('food-manager').emit('newFoodOrder', {
    orderId: order._id,
    totalPrice: order.totalPrice,
    items: order.items.length,
    priority: isRoomService ? 'urgent' : 'normal',
    timestamp: new Date(),
    isRoomService
  });

  // Also emit to kitchen staff room
  io.to('food-kitchen').emit('newFoodTask', {
    taskId: prepTask._id,
    orderId: order._id,
    taskType: 'prep',
    priority: prepTask.priority
  });

  logger.info('Food order confirmed', {
    orderId: order._id,
    paymentId,
    isRoomService,
    taskId: prepTask._id
  });

  res.status(200).json({
    success: true,
    data: order,
    task: prepTask,
    message: 'Order confirmed successfully'
  });
});

// ==================== STAFF ASSIGNMENT ====================
// Step 4: Staff Assignment & Prep
// Manager assigns order to kitchen staff via existing staff API integration
export const assignFoodOrderToStaff = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const { staffId, taskType = 'prep' } = req.body;

  if (!staffId) {
    throw new AppError('Staff ID is required', 400);
  }

  // Verify staff exists and has appropriate role
  const staff = await User.findById(staffId);
  if (!staff || !['staff', 'manager'].includes(staff.role)) {
    throw new AppError('Invalid staff member', 400);
  }

  const order = await FoodOrder.findById(orderId).populate('items.foodId', 'name preparationTimeMinutes ingredients allergens');
  
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (['Delivered', 'Cancelled'].includes(order.status)) {
    throw new AppError('Cannot assign delivered or cancelled orders', 400);
  }

  // Update order
  order.assignedTo = staffId;
  order.kitchenStatus = 'assigned';
  order.status = 'Assigned';
  
  if (!order.taskHistory) order.taskHistory = [];
  order.taskHistory.push({
    status: 'Assigned',
    updatedBy: req.user.id,
    updatedAt: new Date(),
    note: `Assigned to ${staff.name} for ${taskType}`
  });

  // Update or create task queue entry
  let task = await FoodTaskQueue.findOne({ orderId: order._id, taskType, status: 'queued' });
  
  if (!task) {
    task = new FoodTaskQueue({
      orderId: order._id,
      taskType,
      status: 'assigned',
      priority: order.orderType === 'room-service' ? 'urgent' : 'normal',
      isRoomService: order.orderType === 'room-service'
    });
  } else {
    task.status = 'assigned';
  }
  
  task.assignedTo = staffId;
  task.assignedAt = new Date();
  
  // Calculate ETA based on food items
  task.estimatedCompletionTime = task.calculateETA(order.items);
  
  // Check allergens and dietary tags
  const hasAllergens = order.items.some(item => 
    item.foodId && item.foodId.allergens && item.foodId.allergens.length > 0
  );
  
  if (hasAllergens) {
    task.allergyChecked = false; // Staff must verify
  }

  await task.save();
  await order.save();

  // Emit Socket.io to assigned staff
  const io = getIO();
  io.to(`staff-${staffId}`).emit('foodTaskAssigned', {
    taskId: task._id,
    orderId: order._id,
    taskType,
    estimatedTime: task.estimatedCompletionTime,
    allergens: hasAllergens,
    items: order.items
  });

  // Notify guest of assignment
  if (order.userId) {
    io.to(`user-${order.userId}`).emit('foodStatusUpdate', {
      orderId: order._id,
      status: 'Assigned',
      message: 'Your order has been assigned to our kitchen staff',
      eta: task.estimatedCompletionTime
    });
  }

  logger.info('Food order assigned', {
    orderId: order._id,
    staffId,
    taskId: task._id,
    taskType
  });

  res.status(200).json({
    success: true,
    data: order,
    task,
    message: 'Order assigned successfully'
  });
});

// ==================== STATUS UPDATES ====================
// Step 5: Preparation & Status Tracking
// Kitchen staff updates status in real-time
export const updateFoodOrderStatus = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const { status, kitchenStatus, notes, qualityChecks } = req.body;

  const validStatuses = ['Pending', 'Assigned', 'Preparing', 'Ready', 'Delivered', 'Cancelled'];
  
  if (status && !validStatuses.includes(status)) {
    throw new AppError('Invalid status', 400);
  }

  const order = await FoodOrder.findById(orderId);
  
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Update order status
  if (status) order.status = status;
  if (kitchenStatus) order.kitchenStatus = kitchenStatus;
  if (notes) order.notes = notes;

  // Add to timeline
  if (!order.taskHistory) order.taskHistory = [];
  order.taskHistory.push({
    status: status || kitchenStatus,
    updatedBy: req.user.id,
    updatedAt: new Date(),
    note: notes || `Status updated to ${status || kitchenStatus}`
  });

  // Update corresponding task queue
  if (kitchenStatus) {
    const taskStatusMap = {
      'assigned': 'assigned',
      'preparing': 'in-progress',
      'ready': 'completed',
      'delivered': 'completed',
      'cancelled': 'cancelled'
    };

    const task = await FoodTaskQueue.findOne({ 
      orderId: order._id, 
      status: { $in: ['queued', 'assigned', 'in-progress'] }
    }).sort({ createdAt: -1 });

    if (task) {
      task.status = taskStatusMap[kitchenStatus] || task.status;
      
      if (kitchenStatus === 'preparing' && !task.startedAt) {
        task.startedAt = new Date();
      }
      
      if (kitchenStatus === 'ready' || kitchenStatus === 'delivered') {
        task.completedAt = new Date();
        task.actualCompletionTime = new Date();
      }

      if (qualityChecks) {
        task.qualityChecks = { ...task.qualityChecks, ...qualityChecks };
      }

      await task.save();
    }

    // Create next task if moving to next stage
    if (kitchenStatus === 'ready' && status === 'Ready') {
      await FoodTaskQueue.create({
        orderId: order._id,
        taskType: 'delivery',
        status: 'queued',
        priority: order.orderType === 'room-service' ? 'urgent' : 'normal',
        isRoomService: order.orderType === 'room-service',
        estimatedCompletionTime: new Date(Date.now() + 10 * 60 * 1000) // 10 min for delivery
      });
    }
  }

  await order.save();

  // Broadcast status update via Socket.io
  const io = getIO();
  
  // To guest
  if (order.userId) {
    io.to(`user-${order.userId}`).emit('foodStatusUpdate', {
      orderId: order._id,
      status: status || kitchenStatus,
      timeline: order.taskHistory,
      timestamp: new Date()
    });
    
    // Emit review prompt when order is delivered
    if (status === 'Delivered' || kitchenStatus === 'delivered') {
      io.to(`user-${order.userId}`).emit('showReview', {
        orderId: order._id,
        orderType: order.orderType,
        items: order.items,
        timestamp: new Date()
      });
    }
  }

  // To kitchen dashboard
  io.to('food-kitchen').emit('orderStatusChanged', {
    orderId: order._id,
    status: kitchenStatus || status
  });

  logger.info('Food order status updated', {
    orderId: order._id,
    status,
    kitchenStatus,
    updatedBy: req.user.id
  });

  res.status(200).json({
    success: true,
    data: order,
    message: 'Order status updated successfully'
  });
});

// ==================== ORDER TIMELINE ====================
// Get detailed timeline for guest tracking
export const getFoodOrderTimeline = catchAsync(async (req, res) => {
  const { orderId } = req.params;

  const order = await FoodOrder.findById(orderId)
    .populate('assignedTo', 'name')
    .populate('items.foodId', 'name imageUrl preparationTimeMinutes');

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Verify ownership (guests can only see their own orders)
  if (req.user.role === 'guest' && String(order.userId) !== String(req.user.id)) {
    throw new AppError('Unauthorized', 403);
  }

  // Get all tasks for this order
  const tasks = await FoodTaskQueue.find({ orderId: order._id })
    .populate('assignedTo', 'name')
    .sort({ createdAt: 1 });

  // Calculate current ETA
  const activeTask = tasks.find(t => ['queued', 'assigned', 'in-progress'].includes(t.status));
  const eta = activeTask ? activeTask.estimatedCompletionTime : null;

  res.status(200).json({
    success: true,
    data: {
      order,
      timeline: order.taskHistory || [],
      tasks,
      currentETA: eta,
      status: order.status,
      kitchenStatus: order.kitchenStatus
    }
  });
});

// ==================== ENHANCED MODIFICATION ====================
// Step 8: Modifications/Cancels
// Enhanced modification with kitchen notification
export const modifyFoodOrderEnhanced = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const { items, notes, specialInstructions } = req.body;
  const userId = req.user.id;

  const order = await FoodOrder.findById(orderId);
  
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  
  if (String(order.userId) !== String(userId)) {
    throw new AppError('Unauthorized', 403);
  }
  
  if (['Delivered', 'Cancelled'].includes(order.status)) {
    throw new AppError('Cannot modify delivered or cancelled orders', 400);
  }

  // Only allow modification before preparation starts
  if (order.kitchenStatus === 'preparing' || order.kitchenStatus === 'ready') {
    throw new AppError('Order is already being prepared. Please contact staff for changes.', 400);
  }

  const changes = {};
  
  // Update items if provided
  if (items && Array.isArray(items)) {
    // Recalculate pricing
    let newSubtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.foodId);
      if (!menuItem) {
        throw new AppError(`Menu item ${item.foodId} not found`, 404);
      }
      
      const quantity = item.quantity || 1;
      newSubtotal += menuItem.price * quantity;
      
      validatedItems.push({
        foodId: menuItem._id,
        quantity,
        price: menuItem.price,
        name: menuItem.name
      });
    }

    order.items = validatedItems;
    order.subtotal = newSubtotal;
    order.tax = newSubtotal * 0.10;
    order.totalPrice = order.subtotal + order.tax + (order.deliveryFee || 0);
    
    changes.items = validatedItems;
    changes.totalPrice = order.totalPrice;
  }

  if (notes) {
    order.notes = notes;
    changes.notes = notes;
  }

  if (specialInstructions) {
    if (!order.customerDetails) order.customerDetails = {};
    order.customerDetails.specialInstructions = specialInstructions;
    changes.specialInstructions = specialInstructions;
  }

  order.status = 'Modified';
  
  if (!order.modificationHistory) order.modificationHistory = [];
  order.modificationHistory.push({ 
    timestamp: new Date(), 
    changes 
  });

  await order.save();

  // Notify assigned staff if order was already assigned
  if (order.assignedTo) {
    const io = getIO();
    io.to(`staff-${order.assignedTo}`).emit('orderModified', {
      orderId: order._id,
      changes,
      message: 'Customer has modified this order'
    });
  }

  logger.info('Food order modified', {
    orderId: order._id,
    userId,
    changes
  });

  res.status(200).json({
    success: true,
    data: order,
    message: 'Order modified successfully'
  });
});

// ==================== ENHANCED CANCELLATION ====================
export const cancelFoodOrderEnhanced = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;

  const order = await FoodOrder.findById(orderId);
  
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  
  if (String(order.userId) !== String(userId)) {
    throw new AppError('Unauthorized', 403);
  }
  
  if (['Delivered', 'Cancelled'].includes(order.status)) {
    throw new AppError('Cannot cancel delivered or already cancelled orders', 400);
  }

  let refundResult = null;

  // Process refund if payment was made
  if (order.paymentStatus === 'Paid' && order.paymentMethod !== 'CASH') {
    try {
      // TODO: Integrate with actual PayHere refund API
      // For now, simulate refund
      refundResult = {
        success: true,
        refundId: `REFUND_${Date.now()}`,
        amount: order.totalPrice,
        status: 'pending'
      };
      
      order.paymentStatus = 'Refunded';
    } catch (err) {
      logger.error('Refund failed', { orderId, error: err.message });
      throw new AppError('Refund processing failed. Please contact support.', 500);
    }
  }

  order.status = 'Cancelled';
  order.kitchenStatus = 'cancelled';
  
  if (!order.modificationHistory) order.modificationHistory = [];
  order.modificationHistory.push({ 
    timestamp: new Date(), 
    changes: { 
      cancelled: true, 
      reason,
      refund: refundResult 
    } 
  });

  await order.save();

  // Cancel all associated tasks
  await FoodTaskQueue.updateMany(
    { orderId: order._id, status: { $in: ['queued', 'assigned', 'in-progress'] } },
    { $set: { status: 'cancelled' } }
  );

  // Notify assigned staff
  if (order.assignedTo) {
    const io = getIO();
    io.to(`staff-${order.assignedTo}`).emit('orderCancelled', {
      orderId: order._id,
      reason
    });
  }

  logger.info('Food order cancelled', {
    orderId: order._id,
    userId,
    reason,
    refund: refundResult
  });

  res.status(200).json({
    success: true,
    data: order,
    refund: refundResult,
    message: 'Order cancelled successfully'
  });
});

// ==================== POST-DELIVERY REVIEW ====================
// Step 7: Completion & Feedback
export const submitFoodReview = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.id;

  if (!rating || rating < 1 || rating > 5) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }

  const order = await FoodOrder.findById(orderId).populate('items.foodId');
  
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  
  if (String(order.userId) !== String(userId)) {
    throw new AppError('Unauthorized', 403);
  }
  
  if (order.status !== 'Delivered') {
    throw new AppError('Can only review delivered orders', 400);
  }

  if (order.review) {
    throw new AppError('Order already reviewed', 400);
  }

  // Save review to order
  order.review = {
    rating,
    comment: comment || '',
    submittedAt: new Date(),
    isVisible: true,
    flagged: false
  };

  await order.save();

  // Create individual reviews for each food item
  for (const item of order.items) {
    if (item.foodId) {
      await FoodReview.create({
        foodId: item.foodId._id,
        userId: userId,
        orderId: order._id,
        rating: rating,
        comment: comment || '',
        isVerifiedPurchase: true
      });
    }
  }

  logger.info('Food order review submitted', {
    orderId: order._id,
    userId,
    rating
  });

  res.status(200).json({
    success: true,
    data: order.review,
    message: 'Review submitted successfully'
  });
});

// ==================== AI MENU EXTRACTION ====================
// Step 8: AI Updates
// Upload menu image → OCR → Parse → Update MenuItem
export const extractMenuFromImage = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new AppError('Menu image is required', 400);
  }

  // TODO: Integrate with Google Vision API or similar OCR service
  // For now, return placeholder response
  
  const extractedItems = [
    {
      name: 'Extracted Item 1',
      price: 350.00,
      description: 'Extracted from image',
      ingredients: ['ingredient1', 'ingredient2']
    }
    // More items would be extracted here
  ];

  // In production, you would:
  // 1. Send image to Google Vision API
  // 2. Parse OCR text for menu items, prices, ingredients
  // 3. Use NLP to categorize items
  // 4. Update MenuItem collection with parsed data

  logger.info('Menu extraction requested', {
    filename: req.file.filename,
    uploadedBy: req.user.id
  });

  res.status(200).json({
    success: true,
    data: {
      extractedItems,
      imageUrl: `/uploads/${req.file.filename}`,
      status: 'pending_review'
    },
    message: 'Menu image processed. Review extracted items before adding to menu.'
  });
});

// ==================== KITCHEN QUEUE ====================
export const getKitchenQueue = catchAsync(async (req, res) => {
  const tasks = await FoodTaskQueue.getPendingTasks();

  res.status(200).json({
    success: true,
    data: tasks,
    count: tasks.length
  });
});

// ==================== STAFF WORKLOAD ====================
export const getStaffWorkload = catchAsync(async (req, res) => {
  const { staffId } = req.params;

  const workload = await FoodTaskQueue.getStaffWorkload(staffId);

  res.status(200).json({
    success: true,
    data: workload
  });
});
