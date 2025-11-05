import express from 'express';
import {
  getUserReviews,
  createReview,
  updateReview,
  deleteReview,
  getReviewById,
  markHelpful,
  publishReview,
  getBookingReviews,
  getHotelReviews,
  getUserReviewStats
} from '../controllers/reviewController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/hotel', getHotelReviews);

// Protected routes - require authentication
router.use(authenticateToken);

// User review management
router.get('/my-reviews', getUserReviews);
router.get('/my-stats', getUserReviewStats);
router.post('/create', createReview);

// Individual review operations
router.get('/:reviewId', getReviewById);
router.put('/:reviewId', updateReview);
router.delete('/:reviewId', deleteReview);
router.put('/:reviewId/publish', publishReview);
router.post('/:reviewId/helpful', markHelpful);

// Booking-specific reviews
router.get('/booking/:bookingId', getBookingReviews);

export default router;