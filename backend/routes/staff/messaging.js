import express from 'express';
import { 
  sendMessageToManager,
  getConversationWithManager,
  markMessagesAsRead,
  getUnreadCount,
  getAvailableManagers
} from '../../controllers/staff/messagingController.js';
import { authenticateToken } from '../../middleware/auth.js';
import { authorizeRoles } from '../../middleware/roleAuth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Staff messaging routes
router.post('/send-to-manager', authorizeRoles(['staff', 'chef', 'kitchen']), sendMessageToManager);
router.get('/conversation', authorizeRoles(['staff', 'chef', 'kitchen']), getConversationWithManager);
router.put('/mark-read', authorizeRoles(['staff', 'chef', 'kitchen']), markMessagesAsRead);
router.get('/unread-count', authorizeRoles(['staff', 'chef', 'kitchen']), getUnreadCount);
router.get('/managers', authorizeRoles(['staff', 'chef', 'kitchen']), getAvailableManagers);

export default router;
