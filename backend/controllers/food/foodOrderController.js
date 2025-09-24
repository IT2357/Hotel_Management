import FoodOrder from '../../models/FoodOrder.js';
import Food from '../../models/Food.js';
import MenuItem from '../../models/MenuItem.js';
import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/appError.js';
import paymentService from '../../services/payment/paymentService.js';
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

  const validStatuses = ['Pending', 'Preparing', 'Delivered', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    throw new AppError('Invalid status', 400);
  }

  const order = await FoodOrder.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  ).populate('userId', 'name email');

  if (!order) {
    throw new AppError('Food order not found', 404);
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
    FoodOrder.countDocuments({ status: 'Pending' }),
    FoodOrder.countDocuments({ status: 'Delivered' }),
    FoodOrder.aggregate([
      { $match: { status: 'Delivered' } },
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
  const orders = await FoodOrder.find({ userId: req.user.id })
    .populate('items.foodId', 'name price imageUrl')
    .sort({ createdAt: -1 });

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
   totalPrice,
   orderType,
   isTakeaway,
   customerDetails,
   paymentMethod,
   specialInstructions,
   scheduledTime
 } = req.body;

 // Validate required fields
 if (!items || !Array.isArray(items) || items.length === 0) {
   throw new AppError('Order items are required', 400);
 }

 if (!totalPrice || totalPrice <= 0) {
   throw new AppError('Total price is required and must be greater than 0', 400);
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

   // Try multiple lookup strategies
   if (foodId) {
     // Strategy 1: Try to find by _id (MongoDB ObjectId)
     try {
       if (typeof foodId === 'string' && foodId.length === 24 && /^[0-9a-fA-F]{24}$/.test(foodId)) {
         menuItem = await MenuItem.findById(foodId);
       }
     } catch (error) {
       // Ignore cast errors
     }

     // Strategy 2: Try to find by id field (numeric ID)
     if (!menuItem) {
       const numericId = typeof foodId === 'string' ? parseInt(foodId, 10) : foodId;
       if (!isNaN(numericId)) {
         menuItem = await MenuItem.findOne({ id: numericId });
       }
     }

     // Strategy 3: Try to find by slug
     if (!menuItem && typeof foodId === 'string') {
       menuItem = await MenuItem.findOne({ slug: foodId });
     }

     // Strategy 4: Try to find by name (fallback)
     if (!menuItem && typeof foodId === 'string') {
       menuItem = await MenuItem.findOne({ name: { $regex: new RegExp(`^${foodId}$`, 'i') } });
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
     name: menuItem.name
   });
 }

 // Calculate taxes and fees
 const tax = calculatedSubtotal * 0.15;
 const serviceCharge = calculatedSubtotal * 0.10;
 const deliveryFee = orderType === 'delivery' ? 500 : 0;
 const calculatedTotal = calculatedSubtotal + tax + serviceCharge + deliveryFee;

 // Validate total price matches calculated total
 if (Math.abs(calculatedTotal - totalPrice) > 0.01) {
   throw new AppError('Total price does not match calculated price', 400);
 }

 // Process payment
 const orderId = `FOOD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

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
 } else {
   // Process online payment
   paymentResult = await paymentService.processOrderPayment({
     orderId,
     amount: totalPrice,
     currency: "LKR",
     paymentMethod,
     customerDetails,
     returnUrl: `${process.env.FRONTEND_URL}/food/order/success`,
     cancelUrl: `${process.env.FRONTEND_URL}/food/order/cancel`,
     notifyUrl: `${process.env.BACKEND_URL}/api/webhooks/payhere`
   });
 }

 if (!paymentResult.success && paymentMethod !== 'cash') {
   throw new AppError(`Payment processing failed: ${paymentResult.error}`, 400);
 }

 // Create order object
 const orderData = {
   items: validatedItems,
   totalPrice: calculatedTotal,
   subtotal: calculatedSubtotal,
   tax: tax,
   serviceCharge: serviceCharge,
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
   paymentStatus: paymentMethod === 'cash' ? 'Pending' : 'Paid',
   paymentId: paymentResult.paymentId,
   status: 'Pending',
   scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
   deliveryLocation: isTakeaway ? customerDetails.deliveryAddress : `Table/Room: ${customerDetails.deliveryAddress || 'N/A'}`
 };

 // Only add userId if user is authenticated
 if (req.user && req.user.id) {
   orderData.userId = req.user.id;
 }

 // Create the order
 const order = await FoodOrder.create(orderData);

 // Populate the order with food details
 await order.populate('items.foodId', 'name price imageUrl');
 await order.populate('userId', 'name email');

 logger.info('Food order created successfully', {
   orderId: order._id,
   userId: req.user ? req.user.id : null,
   totalPrice: calculatedTotal,
   subtotal: calculatedSubtotal,
   tax: tax,
   serviceCharge: serviceCharge,
   deliveryFee: deliveryFee,
   paymentMethod,
   paymentId: paymentResult.paymentId
 });

 res.status(201).json({
   success: true,
   data: order,
   paymentResult: {
     success: paymentResult.success,
     paymentId: paymentResult.paymentId,
     status: paymentResult.status,
     redirectUrl: paymentResult.redirectUrl,
     message: paymentResult.message
   },
   message: 'Food order created successfully'
 });
});