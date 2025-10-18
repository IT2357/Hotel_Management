/**
 * 🛣️ Enhanced Order Routes
 * US-FO-005: Modify/Cancel orders
 * US-FO-006: Reviews
 */

import express from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import {
  modifyOrder,
  cancelOrder,
  createReview,
  getMenuItemReviews
} from '../../controllers/food-complete/orderEnhancedController.js';

const router = express.Router();

// Order management routes
router.patch('/:id/modify', authenticateToken, modifyOrder);
router.post('/:id/cancel', authenticateToken, cancelOrder);

// Review routes
router.post('/reviews', authenticateToken, createReview);
router.get('/reviews/menu/:menuItemId', getMenuItemReviews);

export default router;
