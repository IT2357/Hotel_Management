import express from 'express';
import {
  getMenuItemReviews,
  submitReview,
  voteReview,
  reportReview,
  getReviewStats,
  getAllReviews,
  getAllReviewStats
} from '../controllers/food/foodReviewController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { 
  submitReviewValidation, 
  voteReviewValidation, 
  reportReviewValidation,
  getReviewsValidation 
} from '../validations/foodValidation.js';

const router = express.Router();

// Admin routes (for getting all reviews)
router.get('/', authenticateToken, requireRole('admin'), getAllReviews);
router.get('/stats', authenticateToken, requireRole('admin'), getAllReviewStats);

// Public routes
router.get('/menu/:menuItemId', getReviewsValidation, getMenuItemReviews);
router.get('/menu/:menuItemId/stats', getReviewStats);

// Protected routes (authenticated users)
router.post('/menu/:menuItemId', authenticateToken, submitReviewValidation, submitReview);
router.post('/:reviewId/vote', authenticateToken, voteReviewValidation, voteReview);
router.post('/:reviewId/report', authenticateToken, reportReviewValidation, reportReview);

export default router;