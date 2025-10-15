import express from "express";
import {
  submitOrderReview,
  getOrderReview,
  getAllReviews,
  moderateReview,
  deleteReview,
  getReviewStats
} from "../controllers/food/foodReviewController.js";
import { authenticateToken as protect, requireRole as authorize } from "../middleware/auth.js";
import { validateFoodReview } from "../middleware/validation.js";

const router = express.Router();

// Customer review routes (authenticated users)
router.post('/orders/:orderId', protect, validateFoodReview, submitOrderReview);
router.get('/orders/:orderId', protect, getOrderReview);
router.delete('/orders/:orderId', protect, deleteReview);

// Admin/Manager review management routes
router.get('/', protect, authorize('admin', 'manager'), getAllReviews);
router.get('/stats', protect, authorize('admin', 'manager'), getReviewStats);
router.patch('/orders/:orderId/moderate', protect, authorize('admin', 'manager'), moderateReview);

export default router;