import FoodOrder from '../../models/FoodOrder.js';
import MenuItem from '../../models/MenuItem.js';
import Food from '../../models/Food.js'; // Legacy Food model support
import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/appError.js';
import paymentService from '../../services/payment/paymentService.js';
import payHereService from '../../services/payHereService.js';
import foodEmailService from '../../services/food/foodEmailService.js';
import logger from '../../utils/logger.js';

// Get all food orders (Admin/Staff view)
export const getAllFoodOrders = catchAsync(async (req, res) => {
  const { status, userId, date } = req.query;

  let filter = {};

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (userId) {
    filter.userId = userId;
  }

  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    filter.createdAt = { $gte: startDate, $lt: endDate };
  }

  const orders = await FoodOrder.find(filter)
    .populate('userId', 'name email')
    .populate('items.foodId', 'name price')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: orders,
    count: orders.length
  });
});

// Modify food order (guest)
export const modifyFoodOrder = catchAsync(async (req, res) => {
  const { quantity, type, notes } = req.body;
  const orderId = req.params.id;
  const userId = req.user.id;

  const order = await FoodOrder.findById(orderId);
  if (!order) throw new AppError('Order not found', 404);
  if (String(order.userId) !== String(userId)) throw new AppError('Unauthorized', 403);
  if (["Delivered", "Cancelled"].includes(order.status)) throw new AppError('Cannot modify delivered or cancelled orders', 400);

  // Only allow modification of quantity/type for all items (for simplicity)
  let changes = {};
  if (typeof quantity === 'number' && quantity > 0) {
    order.items.forEach(item => item.quantity = quantity);
    changes.quantity = quantity;
  }
  if (type && ["dine-in", "takeaway"].includes(type)) {
    order.orderType = type;
    changes.type = type;
    // Jaffna pricing: -5% for Jaffna
    if (order.customerDetails && order.customerDetails.deliveryAddress && /jaffna/i.test(order.customerDetails.deliveryAddress)) {
      order.totalPrice = Math.round(order.totalPrice * 0.95);
    }
  }
  if (notes) {
    order.notes = notes;
    changes.notes = notes;
  }
  order.status = 'Modified';
  order.modificationHistory.push({ timestamp: new Date(), changes });
  await order.save();

  // TODO: Regenerate invoice (stub)
  // TODO: Notify admin (stub)

  res.status(200).json({ success: true, data: order, message: 'Order modified successfully' });
});

// Cancel food order (guest)
export const cancelFoodOrder = catchAsync(async (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.id;
  const order = await FoodOrder.findById(orderId);
  if (!order) throw new AppError('Order not found', 404);
  if (String(order.userId) !== String(userId)) throw new AppError('Unauthorized', 403);
  if (["Delivered", "Cancelled"].includes(order.status)) throw new AppError('Cannot cancel delivered or already cancelled orders', 400);

  let refundResult = null;
  if (order.paymentStatus === 'Paid') {
    // Call PayHere refund API (sandbox)
    try {
      // TODO: Replace with real PayHere refund integration
      refundResult = { success: true, refundId: `REFUND_${Date.now()}` };
      order.paymentStatus = 'Refunded';
    } catch {
      throw new AppError('Refund failed', 500);
    }
  }
  order.status = 'Cancelled';
  order.modificationHistory.push({ timestamp: new Date(), changes: { cancelled: true, refund: refundResult } });
  await order.save();

  // TODO: Notify admin (stub)

  res.status(200).json({ success: true, data: order, refund: refundResult, message: 'Order cancelled successfully' });
});

// Get single food order
export const getFoodOrder = catchAsync(async (req, res) => {
  const order = await FoodOrder.findById(req.params.id)
    .populate('userId', 'name email')
    .populate('items.foodId', 'name price imageUrl');

  if (!order) {
    throw new AppError('Food order not found', 404);
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

// Update order status
export const updateOrderStatus = catchAsync(async (req, res) => {
  const { status } = req.body;

  // Normalize incoming status (accept both 'Preparing' and 'preparing', map synonyms)
  const rawStatus = String(status || '').trim();
  const normalized = rawStatus.toLowerCase();
  const statusMap = {
    assigned: 'confirmed' // some UIs may use 'Assigned' which maps to confirmed
  };

  const finalStatus = statusMap[normalized] || normalized;

  // Use the enum from model (lowercase) to validate
  const allowedStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled', 'modified'];
  if (!allowedStatuses.includes(finalStatus)) {
    throw new AppError('Invalid status', 400);
  }

  const order = await FoodOrder.findByIdAndUpdate(
    req.params.id,
    { status: finalStatus },
    { new: true, runValidators: true }
  ).populate('userId', 'name email');

  if (!order) {
    throw new AppError('Food order not found', 404);
  }

  // Send status update email
  try {
    const customer = {
      name: order.customerDetails?.name || `${order.customerDetails?.firstName || ''} ${order.customerDetails?.lastName || ''}`.trim(),
      firstName: order.customerDetails?.firstName || order.customerDetails?.name?.split(' ')[0] || '',
      lastName: order.customerDetails?.lastName || order.customerDetails?.name?.split(' ').slice(1).join(' ') || '',
      email: order.customerDetails?.email || order.userId?.email,
      phone: order.customerDetails?.phone || ''
    };
    
    if (customer.email) {
      if (finalStatus === 'ready') {
        await foodEmailService.sendOrderReady(order, customer);
      } else {
        await foodEmailService.sendStatusUpdate(order, customer, finalStatus);
      }
      logger.info('Status update email sent', { orderId: order._id, status: finalStatus });
    }
  } catch (emailError) {
    logger.error('Failed to send status update email', { 
      orderId: order._id, 
      status: finalStatus,
      error: emailError.message 
    });
    // Don't fail the status update if email fails
  }

  res.status(200).json({
    success: true,
    data: order,
    message: 'Order status updated successfully'
  });
});

// Get order statistics
export const getOrderStats = catchAsync(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalOrders,
    todayOrders,
    pendingOrders,
    completedOrders,
    totalRevenue
  ] = await Promise.all([
    FoodOrder.countDocuments(),
    FoodOrder.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
    FoodOrder.countDocuments({ status: 'pending' }),
    FoodOrder.countDocuments({ status: 'delivered' }),
    FoodOrder.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ])
  ]);

  const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

  res.status(200).json({
    success: true,
    data: {
      totalOrders,
      todayOrders,
      pendingOrders,
      completedOrders,
      totalRevenue: revenue
    }
  });
});

// Get customer's own orders
export const getCustomerOrders = catchAsync(async (req, res) => {
  let orders;
  
  // Check if user is authenticated
  if (req.user && req.user.id) {
    // For authenticated users: get their orders by userId
    logger.info('Fetching orders for authenticated user', { userId: req.user.id });
    orders = await FoodOrder.find({ userId: req.user.id })
      .populate('items.foodId', 'name price imageUrl')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    logger.info('Found orders for authenticated user', { userId: req.user.id, count: orders.length });
  } else if (req.query.email) {
    // For guest users: get orders by email (from query parameter)
    logger.info('Fetching orders for guest user', { email: req.query.email });
    orders = await FoodOrder.find({ 
      'customerDetails.email': req.query.email,
      userId: null // Only guest orders
    })
      .populate('items.foodId', 'name price imageUrl')
      .sort({ createdAt: -1 });
    logger.info('Found orders for guest user', { email: req.query.email, count: orders.length });
    
    // Log order details for debugging
    if (orders.length > 0) {
      logger.debug('Sample order structure', { 
        orderId: orders[0]._id,
        hasCustomerDetails: !!orders[0].customerDetails,
        customerDetailsKeys: orders[0].customerDetails ? Object.keys(orders[0].customerDetails) : [],
        status: orders[0].status,
        orderType: orders[0].orderType,
        totalPrice: orders[0].totalPrice
      });
    }
  } else {
    // No user and no email provided
    logger.warn('Order fetch attempt without authentication or email');
    return res.status(400).json({
      success: false,
      message: 'Please provide email to view orders'
    });
  }

  res.status(200).json({
    success: true,
    data: orders,
    count: orders.length
  });
});

// Create new food order (Customer endpoint)
export const createFoodOrder = catchAsync(async (req, res) => {
const {
  items,
  subtotal,
  tax,
  deliveryFee,
  totalPrice,
  currency,
  orderType,
  isTakeaway,
  customerDetails,
  paymentMethod,
  specialInstructions,
  scheduledTime,
  pickupTime,
  tableNumber
} = req.body;

 // Validate required fields
 if (!items || !Array.isArray(items) || items.length === 0) {
   throw new AppError('Order items are required', 400);
 }

 if (!subtotal || subtotal < 0) {
   throw new AppError('Subtotal is required and must be non-negative', 400);
 }

 if (!totalPrice || totalPrice <= 0) {
   throw new AppError('Total price is required and must be greater than 0', 400);
 }

 if (!currency || currency !== 'LKR') {
   throw new AppError('Currency must be LKR', 400);
 }

 if (!customerDetails || !customerDetails.customerName || !customerDetails.customerEmail || !customerDetails.customerPhone) {
   throw new AppError('Customer details (name, email, phone) are required', 400);
 }

 if (!paymentMethod) {
   throw new AppError('Payment method is required', 400);
 }

 // Validate payment method
 const validPaymentMethods = ['card', 'cash', 'wallet'];
 if (!validPaymentMethods.includes(paymentMethod)) {
   throw new AppError('Invalid payment method', 400);
 }

 // Validate and populate food items
 const validatedItems = [];
 let calculatedSubtotal = 0;

 for (const item of items) {
   const foodId = item.foodId || item.id;
   let menuItem = null;

  // Try multiple lookup strategies across both MenuItem and Food models
  if (foodId) {
    // Strategy 1: Try to find by _id (MongoDB ObjectId) in MenuItem
    try {
      if (typeof foodId === 'string' && foodId.length === 24 && /^[0-9a-fA-F]{24}$/.test(foodId)) {
        menuItem = await MenuItem.findById(foodId);
      }
   } catch {
     // Ignore cast errors
   }

    // Strategy 2: Try to find by _id in Food model (legacy support)
    if (!menuItem) {
      try {
        if (typeof foodId === 'string' && foodId.length === 24 && /^[0-9a-fA-F]{24}$/.test(foodId)) {
          menuItem = await Food.findById(foodId);
        }
      } catch {
        // Ignore cast errors
      }
    }

    // Strategy 3: Try to find by id field (numeric ID) in MenuItem
    if (!menuItem) {
      const numericId = typeof foodId === 'string' ? parseInt(foodId, 10) : foodId;
      if (!isNaN(numericId)) {
        menuItem = await MenuItem.findOne({ id: numericId });
      }
    }

    // Strategy 4: Try to find by slug in MenuItem
    if (!menuItem && typeof foodId === 'string') {
      menuItem = await MenuItem.findOne({ slug: foodId });
    }

    // Strategy 5: Try to find by name in MenuItem (fallback)
    if (!menuItem && typeof foodId === 'string') {
      menuItem = await MenuItem.findOne({ name: { $regex: new RegExp(`^${foodId}$`, 'i') } });
    }

    // Strategy 6: Try to find by name in Food model (legacy fallback)
    if (!menuItem && typeof foodId === 'string') {
      menuItem = await Food.findOne({ name: { $regex: new RegExp(`^${foodId}$`, 'i') } });
    }
  }

   if (!menuItem) {
     throw new AppError(`Menu item with ID ${foodId} not found`, 404);
   }

   if (!menuItem.isAvailable) {
     throw new AppError(`Menu item "${menuItem.name}" is not available`, 400);
   }

  const quantity = item.quantity || 1;
  const itemTotal = menuItem.price * quantity;
  calculatedSubtotal += itemTotal;

  validatedItems.push({
    foodId: menuItem._id,
    quantity: quantity,
    price: menuItem.price,
    name: menuItem.name,
    // Handle both MenuItem (image) and Food (imageUrl) models
    image: menuItem.image || menuItem.imageUrl || null
  });
}

 // Validate subtotal matches calculated subtotal
 if (Math.abs(calculatedSubtotal - subtotal) > 0.01) {
   throw new AppError('Subtotal does not match calculated subtotal', 400);
 }

 // Validate tax calculation (10% of subtotal)
 const expectedTax = calculatedSubtotal * 0.10;
 if (Math.abs(expectedTax - tax) > 0.01) {
   throw new AppError('Tax calculation is incorrect', 400);
 }

 // Validate delivery fee (LKR 200 for delivery, 0 otherwise)
 const expectedDeliveryFee = orderType === 'delivery' ? 200 : 0;
 if (deliveryFee !== expectedDeliveryFee) {
   throw new AppError('Delivery fee is incorrect', 400);
 }

 // Extract discount information (if any)
 const discount = parseFloat(req.body.discount) || 0;
 const appliedOffer = req.body.appliedOffer || null;

 // Validate discount amount (shouldn't exceed subtotal)
 if (discount < 0 || discount > calculatedSubtotal) {
   throw new AppError('Invalid discount amount', 400);
 }

 // Validate total price with discount consideration
 const expectedTotal = calculatedSubtotal - discount + tax + deliveryFee;
 if (Math.abs(expectedTotal - totalPrice) > 0.01) {
   console.error('Price mismatch:', {
     calculatedSubtotal,
     discount,
     tax,
     deliveryFee,
     expectedTotal,
     receivedTotal: totalPrice
   });
   throw new AppError(`Total price does not match calculated price. Expected: ${expectedTotal.toFixed(2)}, Received: ${totalPrice.toFixed(2)}`, 400);
 }

// Process payment
const orderId = `FOOD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

logger.info('Processing payment', { paymentMethod, orderId });

let paymentResult;
if (paymentMethod === 'cash') {
  // For cash on delivery, just register the order
  paymentResult = {
    success: true,
    paymentId: `CASH_${Date.now()}`,
    status: "PENDING",
    paymentMethod: "CASH",
    message: "Cash on delivery payment registered"
  };
  logger.info('Cash payment registered', { paymentId: paymentResult.paymentId });
} else {
  // Generate PayHere payment data
  logger.info('Generating PayHere payment data', { paymentMethod, orderId, amount: totalPrice });
  
  const payHereData = payHereService.generatePaymentData({
    orderId,
    amount: totalPrice,
    currency: "LKR",
    customerName: customerDetails.customerName,
    customerEmail: customerDetails.customerEmail,
    customerPhone: customerDetails.customerPhone,
    items: validatedItems.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price
    })),
    custom1: req.user ? req.user.id : null,
    custom2: orderId
  });

  logger.info('PayHere data generated', { merchant_id: payHereData.merchant_id, orderId: payHereData.order_id });

  const hash = payHereService.generateHash(payHereData);
  
  logger.info('PayHere hash generated', { hash: hash.substring(0, 10) + '...' });
  
  paymentResult = {
    success: true,
    paymentId: orderId,
    status: "PENDING",
    paymentMethod: "PAYHERE",
    message: "PayHere payment initialized",
    payHereData: {
      ...payHereData,
      hash: hash
    }
  };
  
  logger.info('PayHere payment result prepared', { hasPayHereData: !!paymentResult.payHereData });
}

// Generate pickup code for takeaway orders
const pickupCode = orderType === 'takeaway' 
  ? `PICKUP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  : undefined;

// Create order object
const orderData = {
  items: validatedItems,
  totalPrice: totalPrice,
  currency: currency,
  subtotal: subtotal,
  tax: tax,
  deliveryFee: deliveryFee,
  orderType: orderType,
  isTakeaway: Boolean(isTakeaway),
  customerDetails: {
    name: customerDetails.customerName,
    email: customerDetails.customerEmail,
    phone: customerDetails.customerPhone,
    deliveryAddress: customerDetails.deliveryAddress || '',
    specialInstructions: specialInstructions || ''
  },
  paymentMethod: paymentMethod.toUpperCase(),
  paymentStatus: paymentMethod === 'cash' ? 'pending' : 'paid',
  paymentId: paymentResult.paymentId,
  status: 'pending',
  scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
  deliveryLocation: isTakeaway ? customerDetails.deliveryAddress : `Table/Room: ${customerDetails.deliveryAddress || 'N/A'}`
};

// Add order-type specific fields
if (orderType === 'dine-in' && tableNumber) {
  orderData.tableNumber = tableNumber;
}

if (orderType === 'takeaway') {
  orderData.pickupTime = pickupTime || 30; // Default 30 minutes if not specified
  orderData.pickupCode = pickupCode;
}

 // Only add userId if user is authenticated
 if (req.user && req.user.id) {
   orderData.userId = req.user.id;
 }

 // Create the order
 const order = await FoodOrder.create(orderData);

 // Populate the order with food details
 await order.populate('items.foodId', 'name price imageUrl');
 await order.populate('userId', 'name email');

 // Send confirmation email
 try {
   const customer = {
     name: customerDetails.customerName,
     firstName: customerDetails.customerName.split(' ')[0],
     lastName: customerDetails.customerName.split(' ').slice(1).join(' '),
     email: customerDetails.customerEmail,
     phone: customerDetails.customerPhone
   };
   
   await foodEmailService.sendOrderConfirmation(order, customer);
   logger.info('Order confirmation email sent', { orderId: order._id });
 } catch (emailError) {
   logger.error('Failed to send order confirmation email', { 
     orderId: order._id, 
     error: emailError.message 
   });
   // Don't fail the order creation if email fails
 }

logger.info('Food order created successfully', {
  orderId: order._id,
  userId: req.user ? req.user.id : null,
  totalPrice: totalPrice,
  subtotal: subtotal,
  tax: tax,
  deliveryFee: deliveryFee,
  paymentMethod,
  paymentId: paymentResult.paymentId,
  hasPayHereData: !!paymentResult.payHereData
});

const response = {
  success: true,
  data: order,
  paymentResult: {
    success: paymentResult.success,
    paymentId: paymentResult.paymentId,
    status: paymentResult.status,
    redirectUrl: paymentResult.redirectUrl,
    message: paymentResult.message,
    payHereData: paymentResult.payHereData || null
  },
  message: 'Food order created successfully'
};

logger.info('Sending response', { hasPayHereData: !!response.paymentResult.payHereData });

res.status(201).json(response);
});