// 📁 backend/config/constants.js
// Shared constants across the application

export const ORDER_TYPES = [
  'dine-in',
  'takeaway',
  'delivery',
  'room-service'
];

export const PAYMENT_METHODS = [
  'cash',
  'card',
  'payhere',
  'bank-transfer'
];

export const ORDER_STATUS = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'delivered',
  'completed',
  'cancelled'
];

export const USER_ROLES = [
  'guest',
  'customer',
  'staff',
  'manager',
  'admin'
];

export const ROOM_TYPES = [
  'standard',
  'deluxe',
  'suite',
  'presidential'
];

export const TASK_STATUS = [
  'pending',
  'assigned',
  'in-progress',
  'completed',
  'cancelled'
];

export const TASK_PRIORITY = [
  'low',
  'medium',
  'high',
  'urgent'
];

export default {
  ORDER_TYPES,
  PAYMENT_METHODS,
  ORDER_STATUS,
  USER_ROLES,
  ROOM_TYPES,
  TASK_STATUS,
  TASK_PRIORITY
};