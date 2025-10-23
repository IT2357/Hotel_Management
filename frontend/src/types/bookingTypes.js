/**
 * 🔖 Standardized Booking Types and Utilities
 * Ensures consistent booking status and data handling across the entire system
 */

/**
 * Standardized booking status values
 */
export const BOOKING_STATUS = {
  PENDING: 'Pending Approval',
  ON_HOLD: 'On Hold',
  APPROVED_PAYMENT_PENDING: 'Approved - Payment Pending',
  APPROVED_PAYMENT_PROCESSING: 'Approved - Payment Processing',
  CONFIRMED: 'Confirmed',
  CHECKED_IN: 'Checked In',
  CHECKED_OUT: 'Checked Out',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  REJECTED: 'Rejected',
  OVERSTAY: 'Overstay'
};

/**
 * Payment methods
 */
export const PAYMENT_METHODS = {
  CARD: 'card',
  BANK: 'bank',
  CASH: 'cash'
};

/**
 * Payment status values
 */
export const PAYMENT_STATUS = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  PAID: 'Paid',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
  PARTIALLY_PAID: 'Partially Paid'
};

/**
 * Get CSS classes for booking status badges
 * @param {string} status - Booking status
 * @returns {string} Tailwind CSS classes
 */
export const getStatusBadgeClass = (status) => {
  const statusMap = {
    [BOOKING_STATUS.CONFIRMED]: 'bg-green-100 text-green-800',
    [BOOKING_STATUS.APPROVED_PAYMENT_PENDING]: 'bg-green-100 text-green-800',
    [BOOKING_STATUS.APPROVED_PAYMENT_PROCESSING]: 'bg-blue-100 text-blue-800',
    [BOOKING_STATUS.ON_HOLD]: 'bg-blue-100 text-blue-800',
    [BOOKING_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
    [BOOKING_STATUS.CHECKED_IN]: 'bg-indigo-100 text-indigo-800',
    [BOOKING_STATUS.CHECKED_OUT]: 'bg-purple-100 text-purple-800',
    [BOOKING_STATUS.COMPLETED]: 'bg-teal-100 text-teal-800',
    [BOOKING_STATUS.REJECTED]: 'bg-red-100 text-red-800',
    [BOOKING_STATUS.CANCELLED]: 'bg-gray-100 text-gray-800',
    [BOOKING_STATUS.OVERSTAY]: 'bg-orange-100 text-orange-800'
  };
  
  return statusMap[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Get display-friendly text for booking status
 * @param {string} status - Booking status
 * @returns {string} Display text
 */
export const getStatusDisplayText = (status) => {
  const displayMap = {
    [BOOKING_STATUS.APPROVED_PAYMENT_PENDING]: 'Approved (Pay at Hotel)',
    [BOOKING_STATUS.APPROVED_PAYMENT_PROCESSING]: 'Approved (Payment Processing)',
    [BOOKING_STATUS.CONFIRMED]: 'Confirmed',
    [BOOKING_STATUS.CHECKED_IN]: 'Checked In',
    [BOOKING_STATUS.CHECKED_OUT]: 'Checked Out',
    [BOOKING_STATUS.COMPLETED]: 'Completed',
    [BOOKING_STATUS.ON_HOLD]: 'On Hold',
    [BOOKING_STATUS.PENDING]: 'Pending Approval',
    [BOOKING_STATUS.CANCELLED]: 'Cancelled',
    [BOOKING_STATUS.REJECTED]: 'Rejected',
    [BOOKING_STATUS.OVERSTAY]: 'Overstay'
  };
  
  return displayMap[status] || status;
};

/**
 * Get CSS classes for payment status badges
 * @param {string} status - Payment status
 * @returns {string} Tailwind CSS classes
 */
export const getPaymentStatusBadgeClass = (status) => {
  const statusMap = {
    [PAYMENT_STATUS.PAID]: 'bg-green-100 text-green-800',
    [PAYMENT_STATUS.PROCESSING]: 'bg-blue-100 text-blue-800',
    [PAYMENT_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
    [PAYMENT_STATUS.FAILED]: 'bg-red-100 text-red-800',
    [PAYMENT_STATUS.REFUNDED]: 'bg-purple-100 text-purple-800',
    [PAYMENT_STATUS.PARTIALLY_PAID]: 'bg-orange-100 text-orange-800'
  };
  
  return statusMap[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Get display text for payment method
 * @param {string} method - Payment method
 * @returns {string} Display text
 */
export const getPaymentMethodDisplayText = (method) => {
  const methodMap = {
    [PAYMENT_METHODS.CARD]: '💳 Credit/Debit Card',
    [PAYMENT_METHODS.BANK]: '🏦 Bank Transfer',
    [PAYMENT_METHODS.CASH]: '💵 Pay at Hotel'
  };
  
  return methodMap[method] || method;
};

/**
 * Check if a booking status allows modification
 * @param {string} status - Booking status
 * @returns {boolean} Whether the booking can be modified
 */
export const canModifyBooking = (status) => {
  const modifiableStatuses = [
    BOOKING_STATUS.PENDING,
    BOOKING_STATUS.ON_HOLD,
    BOOKING_STATUS.APPROVED_PAYMENT_PENDING
  ];
  
  return modifiableStatuses.includes(status);
};

/**
 * Check if a booking status allows cancellation
 * @param {string} status - Booking status
 * @returns {boolean} Whether the booking can be cancelled
 */
export const canCancelBooking = (status) => {
  const cancellableStatuses = [
    BOOKING_STATUS.PENDING,
    BOOKING_STATUS.ON_HOLD,
    BOOKING_STATUS.APPROVED_PAYMENT_PENDING,
    BOOKING_STATUS.APPROVED_PAYMENT_PROCESSING,
    BOOKING_STATUS.CONFIRMED
  ];
  
  return cancellableStatuses.includes(status);
};

/**
 * Check if a booking requires payment
 * @param {string} status - Booking status
 * @returns {boolean} Whether payment is required
 */
export const requiresPayment = (status) => {
  const paymentRequiredStatuses = [
    BOOKING_STATUS.APPROVED_PAYMENT_PENDING,
    BOOKING_STATUS.APPROVED_PAYMENT_PROCESSING
  ];
  
  return paymentRequiredStatuses.includes(status);
};

/**
 * Get icon for booking status
 * @param {string} status - Booking status
 * @returns {string} Icon name or emoji
 */
export const getStatusIcon = (status) => {
  const iconMap = {
    [BOOKING_STATUS.CONFIRMED]: '✅',
    [BOOKING_STATUS.APPROVED_PAYMENT_PENDING]: '⏳',
    [BOOKING_STATUS.APPROVED_PAYMENT_PROCESSING]: '💳',
    [BOOKING_STATUS.ON_HOLD]: '⏸️',
    [BOOKING_STATUS.PENDING]: '🕐',
    [BOOKING_STATUS.CHECKED_IN]: '🔑',
    [BOOKING_STATUS.CHECKED_OUT]: '👋',
    [BOOKING_STATUS.COMPLETED]: '✔️',
    [BOOKING_STATUS.REJECTED]: '❌',
    [BOOKING_STATUS.CANCELLED]: '🚫',
    [BOOKING_STATUS.OVERSTAY]: '⚠️'
  };
  
  return iconMap[status] || '📋';
};

/**
 * Get description for booking status
 * @param {string} status - Booking status
 * @param {string} paymentMethod - Payment method
 * @returns {string} Status description
 */
export const getStatusDescription = (status, paymentMethod = '') => {
  const descriptions = {
    [BOOKING_STATUS.CONFIRMED]: 'Your booking is confirmed and ready!',
    [BOOKING_STATUS.APPROVED_PAYMENT_PENDING]: paymentMethod === PAYMENT_METHODS.CASH 
      ? 'Approved - Pay at hotel reception' 
      : 'Approved - Payment pending',
    [BOOKING_STATUS.APPROVED_PAYMENT_PROCESSING]: 'Your booking is approved and payment is being processed',
    [BOOKING_STATUS.ON_HOLD]: 'Your booking is on hold awaiting approval',
    [BOOKING_STATUS.PENDING]: 'Your booking request is pending admin approval',
    [BOOKING_STATUS.CHECKED_IN]: 'You have checked in - enjoy your stay!',
    [BOOKING_STATUS.CHECKED_OUT]: 'You have checked out - thank you for staying with us!',
    [BOOKING_STATUS.COMPLETED]: 'Your booking is completed',
    [BOOKING_STATUS.REJECTED]: 'Your booking request was rejected',
    [BOOKING_STATUS.CANCELLED]: 'This booking has been cancelled',
    [BOOKING_STATUS.OVERSTAY]: 'Check-out time has passed'
  };
  
  return descriptions[status] || 'Status unknown';
};

export default {
  BOOKING_STATUS,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  getStatusBadgeClass,
  getStatusDisplayText,
  getPaymentStatusBadgeClass,
  getPaymentMethodDisplayText,
  canModifyBooking,
  canCancelBooking,
  requiresPayment,
  getStatusIcon,
  getStatusDescription
};
