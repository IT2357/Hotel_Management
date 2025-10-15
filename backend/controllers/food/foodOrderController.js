import FoodOrder from '../../models/FoodOrder.js';
import Food from '../../models/Food.js';
import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/appError.js';

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
    scheduledTime
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
    let foodItem = null;

    // Try to find the food item
    if (foodId) {
      try {
        foodItem = await Food.findById(foodId);
      } catch {
        // Try finding by other fields if ObjectId fails
        if (typeof foodId === 'string') {
          foodItem = await Food.findOne({ 
            $or: [
              { name: { $regex: new RegExp(`^${foodId}$`, 'i') } },
              { slug: foodId }
            ]
          });
        }
      }
    }

    if (!foodItem) {
      throw new AppError(`Food item with ID ${foodId} not found`, 404);
    }

    if (!foodItem.isAvailable) {
      throw new AppError(`Food item "${foodItem.name}" is not available`, 400);
    }

    const quantity = item.quantity || 1;
    const itemTotal = foodItem.price * quantity;
    calculatedSubtotal += itemTotal;

    validatedItems.push({
      foodId: foodItem._id,
      quantity: quantity,
      price: foodItem.price,
      name: foodItem.name
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

  // Validate total price
  const expectedTotal = calculatedSubtotal + tax + deliveryFee;
  if (Math.abs(expectedTotal - totalPrice) > 0.01) {
    throw new AppError('Total price does not match calculated price', 400);
  }

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
    paymentStatus: paymentMethod === 'cash' ? 'Pending' : 'Paid',
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
  if (order.userId) {
    await order.populate('userId', 'name email');
  }

  res.status(201).json({
    success: true,
    data: order,
    message: 'Food order created successfully'
  });
});