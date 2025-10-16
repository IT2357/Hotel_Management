import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleAuth.js';
import * as managerController from '../controllers/manager/managerController.js';

const router = express.Router();

router.use(authenticateToken, authorizeRoles(['Manager']));

router.get('/taskboard', managerController.getTaskBoard);
router.get('/staff-availability', managerController.getStaffAvailability);
router.post('/manage-assignment', managerController.manageTaskAssignment);
router.post('/set-priority', managerController.setTaskPriority);
router.get('/analytics', managerController.getAnalytics);

export default router;