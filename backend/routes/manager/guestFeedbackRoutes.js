import express from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import { authorizeRoles } from '../../middleware/roleAuth.js';
import * as guestFeedbackController from '../../controllers/manager/guestFeedbackController.js';

const router = express.Router();

// All routes require authentication and manager role
router.use(authenticateToken, authorizeRoles(['manager']));

// Get all feedback with filters
router.get('/', guestFeedbackController.getAllFeedback);

// Get feedback statistics
router.get('/stats', guestFeedbackController.getFeedbackStats);

// Respond to feedback
router.post('/:id/respond', guestFeedbackController.respondToFeedback);

// Mark feedback as helpful
router.post('/:id/helpful', guestFeedbackController.markHelpful);

// Publish feedback
router.put('/:id/publish', guestFeedbackController.publishFeedback);

// Archive feedback
router.put('/:id/archive', guestFeedbackController.archiveFeedback);

export default router;
