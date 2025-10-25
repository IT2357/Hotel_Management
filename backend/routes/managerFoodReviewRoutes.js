import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleAuth.js';
import * as controller from '../controllers/manager/managerFoodReviewController.js';

const router = express.Router();

// Protect all routes - require authentication and manager/admin role
router.use(authenticateToken, authorizeRoles(['manager', 'admin']));

// Food review routes
router.get('/', controller.getAllFoodReviews);
router.get('/stats', controller.getFoodReviewStats);
router.post('/:reviewId/respond', controller.respondToFoodReview);
router.put('/:reviewId/publish', controller.publishFoodReview);
router.put('/:reviewId/archive', controller.archiveFoodReview);
router.post('/:reviewId/helpful', controller.markFoodReviewHelpful);

export default router;

