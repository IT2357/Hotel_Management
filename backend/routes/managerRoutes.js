import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleAuth.js';
import * as managerController from '../controllers/manager/managerController.js';
import foodReviewRoutes from './managerFoodReviewRoutes.js';
import { handleValidationErrors } from '../middleware/validation.js';
import {
	manageAssignmentValidation,
	setTaskPriorityValidation,
	updateManagerProfileValidation,
} from '../validations/managerValidation.js';

const router = express.Router();

router.use(authenticateToken, authorizeRoles(['manager']));

router.get('/taskboard', managerController.getTaskBoard);
router.get('/staff', managerController.getStaff);
router.get('/staff-availability', managerController.getStaffAvailability);
router.post(
	'/manage-assignment',
	manageAssignmentValidation,
	handleValidationErrors,
	managerController.manageTaskAssignment
);
router.post(
	'/set-priority',
	setTaskPriorityValidation,
	handleValidationErrors,
	managerController.setTaskPriority
);
router.get('/analytics', managerController.getAnalytics);
router.get('/profile/overview', managerController.getManagerProfileOverview);
router.put(
	'/profile/update',
	updateManagerProfileValidation,
	handleValidationErrors,
	managerController.updateManagerProfile
);

// Food review management routes
router.use('/food-reviews', foodReviewRoutes);

export default router;