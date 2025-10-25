import express from 'express';
import {
  getStaffList,
  sendMessage,
  getSentMessages,
  getReceivedMessages,
  markMessageAsRead,
  deleteMessage,
  getMessageStats,
} from '../../controllers/manager/messagingController.js';
import { authenticateToken } from '../../middleware/auth.js';
import { authorizeRoles } from '../../middleware/roleAuth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Manager routes
router.get('/staff-list', authorizeRoles(['manager', 'admin']), getStaffList);
router.post('/send', authorizeRoles(['manager', 'admin']), sendMessage);
router.get('/sent', authorizeRoles(['manager', 'admin']), getSentMessages);
router.delete('/:id', authorizeRoles(['manager', 'admin']), deleteMessage);
router.get('/stats', authorizeRoles(['manager', 'admin']), getMessageStats);

// Staff routes (can also be used by managers)
router.get('/received', getReceivedMessages);
router.put('/:id/read', markMessageAsRead);

export default router;
