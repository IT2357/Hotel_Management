// 📁 backend/routes/foodWorkflowRoutes.js
// Food Order Workflow Routes - Modular enhancement for existing food system
// Handles: Order confirmation, staff assignment, status tracking, AI menu extraction
import express from "express";
import { 
  confirmFoodOrder, 
  assignFoodOrderToStaff, 
  updateFoodOrderStatus,
  modifyFoodOrderEnhanced,
  cancelFoodOrderEnhanced,
  getFoodOrderTimeline,
  submitFoodReview,
  extractMenuFromImage,
  getKitchenQueue,
  getStaffWorkload
} from "../controllers/food/foodWorkflowController.js";
import { authenticateToken as protect, requireRole as authorize } from "../middleware/auth.js";
import { uploadSingle, handleMulterError, uploadToGridFS } from "../middleware/gridfsUpload.js";

const router = express.Router();

// ==================== ORDER CONFIRMATION (Post-Payment) ====================
// Called after successful PayHere payment to trigger kitchen workflow
// Emits Socket.io event to notify manager/kitchen staff
router.post(
  '/confirm/:orderId', 
  protect, 
  confirmFoodOrder
);

// ==================== STAFF ASSIGNMENT (Manager/Admin) ====================
// Assign food order to kitchen staff for preparation
// Integrates with existing staff API, creates task queue entries
router.put(
  '/assign/:orderId', 
  protect, 
  authorize('admin', 'manager', 'staff'), 
  assignFoodOrderToStaff
);

// ==================== STATUS UPDATES (Staff/Kitchen) ====================
// Update order status in real-time (preparing, ready, delivered)
// Pushes timeline events and broadcasts via Socket.io
router.put(
  '/status/:orderId', 
  protect, 
  authorize('admin', 'manager', 'staff'), 
  updateFoodOrderStatus
);

// ==================== ORDER TIMELINE (Guest View) ====================
// Get detailed timeline of order progress with ETA
router.get(
  '/timeline/:orderId', 
  protect, 
  getFoodOrderTimeline
);

// ==================== ENHANCED MODIFICATION (Pre-Fulfillment) ====================
// Guest can modify order before staff assignment
// Recalculates pricing, notifies kitchen if already assigned
router.put(
  '/modify/:orderId', 
  protect, 
  modifyFoodOrderEnhanced
);

// ==================== ENHANCED CANCELLATION (With Auto-Refund) ====================
// Cancel order with automatic PayHere refund integration
// Updates task queue and notifies assigned staff
router.delete(
  '/cancel/:orderId', 
  protect, 
  cancelFoodOrderEnhanced
);

// ==================== POST-DELIVERY REVIEW ====================
// Submit rating and review after order delivery
// Aggregates ratings for menu items
router.post(
  '/review/:orderId', 
  protect, 
  submitFoodReview
);

// ==================== AI MENU EXTRACTION (Admin) ====================
// Upload menu image → OCR/parse → auto-update MenuItem
// Supports Google Vision API integration
router.post(
  '/ai-extract-menu', 
  protect, 
  authorize('admin', 'manager'),
  uploadSingle, // GridFS upload
  handleMulterError,
  uploadToGridFS,
  extractMenuFromImage
);

// ==================== KITCHEN QUEUE (Staff View) ====================
// Get prioritized list of pending food tasks
// Sorted by: room service > priority > FIFO
router.get(
  '/kitchen-queue', 
  protect, 
  authorize('admin', 'manager', 'staff'), 
  getKitchenQueue
);

// ==================== STAFF WORKLOAD (Manager View) ====================
// Get current workload for specific staff member
router.get(
  '/staff-workload/:staffId', 
  protect, 
  authorize('admin', 'manager'), 
  getStaffWorkload
);

export default router;