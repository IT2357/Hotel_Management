// 📁 backend/routes/bookingRoutes.js
import express from "express";
import { body, query } from "express-validator";
import {
  createBooking,
  getBookings,
  getBooking,
  updateBooking,
  cancelBooking,
  confirmBooking,
  checkAvailability,
  getAvailableSlots,
  getBookingsByDate,
  updateBookingStatus
} from "../controllers/booking/tableBookingController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validation.js";

const router = express.Router();

// Booking validation rules
const bookingValidation = [
  body('customerInfo.name')
    .trim()
    .notEmpty()
    .withMessage('Customer name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('customerInfo.email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('customerInfo.phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[+]?[\d\s\-()]{8,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('bookingDate')
    .isISO8601()
    .withMessage('Valid booking date is required')
    .custom((value) => {
      const bookingDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (bookingDate < today) {
        throw new Error('Booking date cannot be in the past');
      }
      return true;
    }),
  body('bookingTime')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid time in HH:MM format is required'),
  body('partySize')
    .isInt({ min: 1, max: 20 })
    .withMessage('Party size must be between 1 and 20'),
  body('specialRequests')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Special requests cannot exceed 500 characters'),
  body('dietaryRequirements')
    .optional()
    .isArray()
    .withMessage('Dietary requirements must be an array'),
  body('dietaryRequirements.*')
    .optional()
    .isIn(['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher'])
    .withMessage('Invalid dietary requirement'),
  body('occasion')
    .optional()
    .isIn(['birthday', 'anniversary', 'business', 'date', 'family', 'celebration', 'other'])
    .withMessage('Invalid occasion type')
];

// Availability check validation
const availabilityValidation = [
  query('date')
    .isISO8601()
    .withMessage('Valid date is required'),
  query('time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid time in HH:MM format is required'),
  query('partySize')
    .isInt({ min: 1, max: 20 })
    .withMessage('Party size must be between 1 and 20')
];

// Public Routes

// Check availability for a specific date/time
router.get('/availability', 
  availabilityValidation, 
  validateRequest, 
  checkAvailability
);

// Get available time slots for a date
router.get('/available-slots', 
  [
    query('date')
      .isISO8601()
      .withMessage('Valid date is required'),
    query('partySize')
      .isInt({ min: 1, max: 20 })
      .withMessage('Party size must be between 1 and 20')
  ],
  validateRequest,
  getAvailableSlots
);

// Create a new booking (public - no auth required for guests)
router.post('/', 
  bookingValidation, 
  validateRequest, 
  createBooking
);

// Protected Routes (authentication required)

// Get user's own bookings
router.get('/my-bookings', 
  authenticate, 
  getBookings
);

// Get specific booking (user can only access their own)
router.get('/:id', 
  authenticate, 
  getBooking
);

// Update booking (user can only update their own pending bookings)
router.put('/:id', 
  authenticate, 
  bookingValidation, 
  validateRequest, 
  updateBooking
);

// Cancel booking (user can cancel their own bookings)
router.patch('/:id/cancel', 
  authenticate, 
  [
    body('cancellationReason')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Cancellation reason cannot exceed 500 characters')
  ],
  validateRequest,
  cancelBooking
);

// Admin/Staff Routes

// Get all bookings (admin/staff only)
router.get('/', 
  authenticate, 
  authorize(['admin', 'staff']), 
  [
    query('date')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    query('status')
      .optional()
      .isIn(['Pending', 'Confirmed', 'Arrived', 'Seated', 'Completed', 'No Show', 'Cancelled'])
      .withMessage('Invalid status'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  validateRequest,
  getBookings
);

// Get bookings for a specific date (admin/staff only)
router.get('/date/:date', 
  authenticate, 
  authorize(['admin', 'staff']), 
  getBookingsByDate
);

// Confirm booking (admin/staff only)
router.patch('/:id/confirm', 
  authenticate, 
  authorize(['admin', 'staff']), 
  [
    body('tableNumber')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Table number cannot be empty'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes cannot exceed 1000 characters')
  ],
  validateRequest,
  confirmBooking
);

// Update booking status (admin/staff only)
router.patch('/:id/status', 
  authenticate, 
  authorize(['admin', 'staff']), 
  [
    body('status')
      .isIn(['Pending', 'Confirmed', 'Arrived', 'Seated', 'Completed', 'No Show', 'Cancelled'])
      .withMessage('Invalid status'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes cannot exceed 1000 characters')
  ],
  validateRequest,
  updateBookingStatus
);

export default router;