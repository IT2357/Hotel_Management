// 📁 backend/routes/orderRoutes.js
import express from "express";
import { body } from "express-validator";
import {
  createOrder,
  getOrder,
  getOrderByNumber,
  updateOrderStatus
} from "../controllers/orders/orderController.js";
import {
  getCustomerOrders,
  createCustomerOrder,
  getOrderStatus
} from "../controllers/orders/customerOrderController.js";

const router = express.Router();

// Order validation rules
const orderValidation = [
  body('orderType')
    .isIn(['Dine-in', 'Takeaway'])
    .withMessage('Order type must be Dine-in or Takeaway'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.menuItem')
    .isMongoId()
    .withMessage('Invalid menu item ID'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('items.*.itemTotal')
    .isFloat({ min: 0 })
    .withMessage('Item total must be non-negative'),
  body('subtotal')
    .isFloat({ min: 0 })
    .withMessage('Subtotal must be non-negative'),
  body('total')
    .isFloat({ min: 0 })
    .withMessage('Total must be non-negative'),
  body('customerInfo.name')
    .trim()
    .notEmpty()
    .withMessage('Customer name is required'),
  body('customerInfo.phone')
    .trim()
    .notEmpty()
    .withMessage('Customer phone is required')
];

// Customer order validation
const customerOrderValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.menuItemId')
    .isMongoId()
    .withMessage('Invalid menu item ID'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('customerInfo.name')
    .trim()
    .notEmpty()
    .withMessage('Customer name is required'),
  body('customerInfo.phone')
    .trim()
    .notEmpty()
    .withMessage('Customer phone is required'),
  body('customerInfo.email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required'),
  body('orderType')
    .isIn(['dine-in', 'takeaway'])
    .withMessage('Order type must be dine-in or takeaway')
];

// Order routes
router.post('/', orderValidation, createOrder);
router.get('/:id', getOrder);
router.get('/number/:orderNumber', getOrderByNumber);
router.patch('/:id/status', updateOrderStatus);

// Customer order routes
router.post('/customer', customerOrderValidation, createCustomerOrder);
router.get('/customer/:customerEmail', getCustomerOrders);
router.get('/customer/status/:orderNumber', getOrderStatus);

export default router;
