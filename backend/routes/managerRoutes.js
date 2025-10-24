import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleAuth.js';
import * as managerController from '../controllers/manager/managerController.js';

const router = express.Router();

router.use(authenticateToken, authorizeRoles(['manager']));

router.get('/taskboard', managerController.getTaskBoard);
router.get('/staff', managerController.getStaff);
router.get('/staff-availability', managerController.getStaffAvailability);
router.post('/manage-assignment', managerController.manageTaskAssignment);
router.post('/set-priority', managerController.setTaskPriority);
router.get('/analytics', managerController.getAnalytics);
router.get('/profile/overview', managerController.getManagerProfileOverview);
router.put('/profile/update', managerController.updateManagerProfile);

export default router;