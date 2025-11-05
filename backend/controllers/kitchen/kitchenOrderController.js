import FoodOrder from '../../models/FoodOrder.js';
import MenuItem from '../../models/MenuItem.js';
import { getIO } from '../../utils/socket.js';
import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/appError.js';

// Get orders for kitchen staff
export const getKitchenOrders = catchAsync(async (req, res) => {
  const { status } = req.query;
  const query = {};
  
  if (status && status !== 'all') {
    query.kitchenStatus = status;
  }
  
  const orders = await FoodOrder.find(query)
    .populate('userId', 'firstName lastName email')
    .populate('items.foodId', 'name ingredients allergens')
    .sort({ createdAt: -1 });
  
  res.status(200).json({ 
    success: true, 
    count: orders.length,
    data: orders 
  });
});

// Update order status
export const updateOrderStatus = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const { status, kitchenStatus, notes } = req.body;
  
  const order = await FoodOrder.findById(orderId);
  
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  
  if (kitchenStatus) order.kitchenStatus = kitchenStatus;
  if (status) order.status = status;
  
  order.taskHistory.push({
    status: kitchenStatus || status,
    updatedBy: req.user._id,
    updatedAt: new Date(),
    note: notes || `Status updated to ${kitchenStatus || status}`
  });
  
  await order.save();
  
  // Emit Socket.io event to guest
  const io = getIO();
  if (order.userId) {
    io.to(`user-${order.userId}`).emit('foodStatusUpdate', {
      orderId: order._id,
      status: status || kitchenStatus,
      timeline: order.taskHistory,
      timestamp: new Date()
    });
  }
  
  res.status(200).json({ 
    success: true, 
    data: order,
    message: 'Order status updated successfully'
  });
});

// Confirm delivery (triggers review)
export const confirmDelivery = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  
  const order = await FoodOrder.findById(orderId)
    .populate('items.foodId', 'name');
  
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  
  order.status = 'delivered';
  order.kitchenStatus = 'delivered';
  
  order.taskHistory.push({
    status: 'delivered',
    updatedBy: req.user._id,
    updatedAt: new Date(),
    note: 'Order delivered to customer'
  });
  
  await order.save();
  
  // ⭐ TRIGGER REVIEW - Emit Socket.io event
  const io = getIO();
  if (order.userId) {
    io.to(`user-${order.userId}`).emit('showReview', {
      orderId: order._id,
      orderType: order.orderType,
      items: order.items,
      timestamp: new Date()
    });
    
    // Also emit status update
    io.to(`user-${order.userId}`).emit('foodStatusUpdate', {
      orderId: order._id,
      status: 'delivered',
      timeline: order.taskHistory,
      timestamp: new Date()
    });
  }
  
  res.status(200).json({ 
    success: true, 
    data: order,
    message: 'Delivery confirmed successfully'
  });
});

// Get kitchen statistics
export const getKitchenStats = catchAsync(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [totalToday, activeOrders, completedToday, allOrders] = await Promise.all([
    FoodOrder.countDocuments({
      createdAt: { $gte: today }
    }),
    FoodOrder.countDocuments({
      kitchenStatus: { $in: ['pending', 'preparing', 'ready'] }
    }),
    FoodOrder.countDocuments({
      kitchenStatus: 'delivered',
      createdAt: { $gte: today }
    }),
    FoodOrder.find({
      kitchenStatus: 'delivered',
      createdAt: { $gte: today }
    }).select('createdAt taskHistory')
  ]);
  
  // Calculate average preparation time
  let totalPrepTime = 0;
  let prepCount = 0;
  
  allOrders.forEach(order => {
    const startTime = order.taskHistory.find(h => h.status === 'preparing')?.updatedAt;
    const endTime = order.taskHistory.find(h => h.status === 'delivered')?.updatedAt;
    
    if (startTime && endTime) {
      const diff = (new Date(endTime) - new Date(startTime)) / (1000 * 60); // minutes
      totalPrepTime += diff;
      prepCount++;
    }
  });
  
  const avgPrepTime = prepCount > 0 ? Math.round(totalPrepTime / prepCount) : 0;
  
  res.status(200).json({
    success: true,
    data: {
      totalToday,
      activeOrders,
      completedToday,
      averagePrepTime: avgPrepTime
    }
  });
});

// Get orders grouped by time slot for a specific date
export const getOrdersByTimeSlot = catchAsync(async (req, res) => {
  const { date } = req.query;
  
  // Parse date or default to today
  const targetDate = date ? new Date(date) : new Date();
  
  // Start and end of day
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  // Fetch all orders for the day (both scheduled and regular orders)
  const orders = await FoodOrder.find({
    $or: [
      // Scheduled orders (meal plans) with scheduledDate
      {
        scheduledDate: { $gte: startOfDay, $lte: endOfDay },
        status: { $nin: ['cancelled'] }
      },
      // Regular orders created today
      {
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        scheduledDate: { $exists: false },
        status: { $nin: ['cancelled', 'delivered'] }
      }
    ]
  })
  .populate('items.foodId', 'name price category imageUrl')
  .populate('bookingId', 'bookingNumber roomTitle')
  .populate('userId', 'name email')
  .sort({ scheduledTime: 1, createdAt: 1 });
  
  // Group orders by meal type
  const grouped = {
    breakfast: [],
    lunch: [],
    dinner: [],
    other: []
  };
  
  orders.forEach(order => {
    // If order has mealType, group by that
    if (order.mealType) {
      if (grouped[order.mealType]) {
        grouped[order.mealType].push(order);
      } else {
        grouped.other.push(order);
      }
    } else {
      // For regular orders without mealType, categorize by time
      const orderTime = order.scheduledTime || order.createdAt;
      const hour = new Date(orderTime).getHours();
      
      if (hour >= 6 && hour < 11) {
        grouped.breakfast.push(order);
      } else if (hour >= 11 && hour < 16) {
        grouped.lunch.push(order);
      } else if (hour >= 16 && hour < 23) {
        grouped.dinner.push(order);
      } else {
        grouped.other.push(order);
      }
    }
  });
  
  // Calculate statistics
  const stats = {
    totalOrders: orders.length,
    mealPlanOrders: orders.filter(o => o.isPartOfMealPlan).length,
    alaCarteOrders: orders.filter(o => !o.isPartOfMealPlan).length,
    byStatus: {
      scheduled: orders.filter(o => o.status === 'scheduled').length,
      pending: orders.filter(o => o.status === 'pending').length,
      preparing: orders.filter(o => o.status === 'preparing' || o.kitchenStatus === 'preparing').length,
      ready: orders.filter(o => o.status === 'ready' || o.kitchenStatus === 'ready').length,
      delivered: orders.filter(o => o.status === 'delivered').length
    },
    byMealType: {
      breakfast: grouped.breakfast.length,
      lunch: grouped.lunch.length,
      dinner: grouped.dinner.length,
      other: grouped.other.length
    }
  };
  
  res.status(200).json({
    success: true,
    date: targetDate,
    data: grouped,
    stats: stats
  });
});

// Get upcoming meal plan orders (next 7 days)
export const getUpcomingMealPlanOrders = catchAsync(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const orders = await FoodOrder.find({
    isPartOfMealPlan: true,
    scheduledDate: { $gte: today, $lte: nextWeek },
    status: { $nin: ['cancelled', 'delivered'] }
  })
  .populate('items.foodId', 'name price')
  .populate('bookingId', 'bookingNumber roomTitle checkIn checkOut')
  .populate('userId', 'name email')
  .sort({ scheduledDate: 1, scheduledTime: 1 });
  
  // Group by date
  const groupedByDate = {};
  orders.forEach(order => {
    const dateKey = new Date(order.scheduledDate).toISOString().split('T')[0];
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = {
        date: dateKey,
        orders: [],
        totalOrders: 0,
        byMealType: { breakfast: 0, lunch: 0, dinner: 0 }
      };
    }
    groupedByDate[dateKey].orders.push(order);
    groupedByDate[dateKey].totalOrders++;
    if (order.mealType) {
      groupedByDate[dateKey].byMealType[order.mealType]++;
    }
  });
  
  res.status(200).json({
    success: true,
    data: Object.values(groupedByDate),
    totalOrders: orders.length
  });
});

