// 📁 backend/controllers/payments/payhereController.js
import Order from '../../models/Order.js';
import Food from '../../models/Food.js';
import paymentService from '../../services/payment/paymentService.js';

// POST /api/payments/payhere/init
// Creates an Order with paymentStatus 'Processing' and returns PayHere params
export const initPayment = async (req, res) => {
  try {
    const { items = [], customerInfo = {}, orderType = 'dine-in', tableNumber = null, specialInstructions = '', paymentMethod = 'Card', paymentProvider = '' } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items provided' });
    }

    // Recalculate totals server-side and validate items
    let calculatedSubtotal = 0;
    const processedItems = [];

    for (const orderItem of items) {
      const foodItem = await Food.findById(orderItem.menuItemId || orderItem.menuItem);
      if (!foodItem) {
        return res.status(400).json({ success: false, message: `Food item not found: ${orderItem?.name || orderItem?.menuItem}` });
      }
      if (foodItem.isAvailable === false) {
        return res.status(400).json({ success: false, message: `Food item is not available: ${foodItem.name}` });
      }
      const price = Number(orderItem.price ?? foodItem.basePrice ?? foodItem.displayPrice ?? 0);
      const quantity = Number(orderItem.quantity || 1);
      const itemTotal = price * quantity;
      calculatedSubtotal += itemTotal;
      processedItems.push({
        menuItem: foodItem._id,
        name: foodItem.name,
        quantity,
        price,
        itemTotal,
        selectedPortion: orderItem.selectedPortion || null,
        specialInstructions: orderItem.specialInstructions || null,
      });
    }

    const tax = Math.round(calculatedSubtotal * 0.125 * 100) / 100;
    const serviceCharge = Math.round(calculatedSubtotal * 0.10 * 100) / 100;
    const total = Math.round((calculatedSubtotal + tax + serviceCharge) * 100) / 100;

    // Create order with pending payment
    const order = await Order.create({
      items: processedItems,
      customerInfo,
      orderType: orderType || 'dine-in',
      tableNumber: orderType === 'dine-in' ? tableNumber : null,
      specialInstructions,
      subtotal: calculatedSubtotal,
      tax,
      serviceCharge,
      total,
      status: 'Pending',
      paymentStatus: 'Processing',
      paymentMethod: paymentMethod || 'Card',
      confirmedAt: undefined,
    });

    // Reload to get orderNumber
    const created = await Order.findById(order._id);

    // Build params for PayHere
    const paymentResult = await paymentService.processOrderPayment({
      orderId: created.orderNumber,
      amount: created.total,
      currency: 'LKR',
      paymentMethod: paymentMethod.toLowerCase(),
      customerDetails: customerInfo,
      returnUrl: process.env.PAYHERE_RETURN_URL,
      cancelUrl: process.env.PAYHERE_CANCEL_URL,
      notifyUrl: process.env.PAYHERE_NOTIFY_URL,
    });

    if (!paymentResult.success) {
      return res.status(400).json({ success: false, message: paymentResult.error || 'Payment initialization failed' });
    }

    const params = {
      action: paymentResult.gatewayUrl,
      params: paymentResult.paymentParams
    };

    return res.status(201).json({ success: true, message: 'Payment initialized', data: { order, payhere: params } });
  } catch (err) {
    console.error('PayHere init error:', err);
    return res.status(500).json({ success: false, message: 'Failed to initialize payment', error: err.message });
  }
};

// POST /api/payments/payhere/ipn
// Handles PayHere IPN notifications
export const handleIPN = async (req, res) => {
  try {
    const payload = req.body || {};

    // Verify signature/hash (best-effort; ensure this matches PayHere docs)
    const verified = paymentService.validateWebhookSignature(payload, payload.hash);
    if (!verified) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const { order_id, status_code, payment_id } = payload;
    if (!order_id) {
      return res.status(400).json({ success: false, message: 'Missing order_id' });
    }

    const order = await Order.findOne({ orderNumber: order_id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // PayHere status_code: 2 = success, -1 canceled, 0 pending, -2 failed
    if (String(status_code) === '2') {
      order.paymentStatus = 'Paid';
      order.paymentId = payment_id || order.paymentId;
      order.status = order.status === 'Pending' ? 'Confirmed' : order.status;
      order.confirmedAt = order.confirmedAt || new Date();
      await order.save();
      return res.status(200).json({ success: true });
    }

    if (String(status_code) === '-1') {
      order.paymentStatus = 'Pending';
      await order.save();
      return res.status(200).json({ success: true });
    }

    // failed or other
    order.paymentStatus = 'Failed';
    await order.save();
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('PayHere IPN error:', err);
    return res.status(500).json({ success: false, message: 'IPN processing failed' });
  }
};
