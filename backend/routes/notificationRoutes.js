import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/roleAuth.js";
import {
  validateNotificationSend,
  validateNotificationId,
  validateNotificationQuery,
  validateNotificationPreferences,
} from "../middleware/notificationValidation.js";

// Import controller functions directly
import {
  sendNotification,
  sendBulkNotifications,
  getUserNotifications,
  getAdminNotifications,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  getPreferences,
  updatePreferences,
  getMyPreferences,
  updateMyPreferences,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  deleteMyNotification,
  adminDeleteNotification,
  getNotificationStats,
} from "../controllers/notificationController.js";

const router = express.Router();

// Middleware groups
const auth = [authenticateToken];
const admin = [...auth, authorizeRoles(["admin"])];
const staff = [...auth, authorizeRoles(["staff"])];
const withValidation = [
  ...auth,
  validateNotificationId,
  validateNotificationQuery,
];

// ===================== USER NOTIFICATION OPERATIONS =====================
router.get("/my", [...auth, validateNotificationQuery], getMyNotifications);
router.get("/my/preferences", auth, getMyPreferences);
router.put(
  "/my/preferences",
  [...auth, validateNotificationPreferences],
  updateMyPreferences
);
router.patch("/:id/read", [...auth, validateNotificationId], markAsRead);
router.patch("/read-all", auth, markAllAsRead);
router.get("/unread-count", auth, getUnreadCount);
router.delete("/:id", [...auth, validateNotificationId], deleteMyNotification);

// ===================== ADMIN NOTIFICATION OPERATIONS =====================
router.post("/send", [...auth, validateNotificationSend], sendNotification);
router.post(
  "/send/bulk",
  [...admin, validateNotificationSend],
  sendBulkNotifications
);
router.get(
  "/admin",
  [...admin, validateNotificationQuery],
  getAdminNotifications
);
router.get("/user/:userId", withValidation, getUserNotifications);
router.get("/stats", admin, getNotificationStats);
router.delete(
  "/admin/:id",
  [...admin, validateNotificationId],
  adminDeleteNotification
);

// ===================== TEMPLATE OPERATIONS =====================
router.get("/templates", admin, getTemplates);
router.post("/templates", admin, createTemplate);
router.put("/templates/:id", admin, updateTemplate);
router.delete("/templates/:id", admin, deleteTemplate);

// ===================== USER PREFERENCE OPERATIONS =====================
router.get("/preferences/:userId", auth, getPreferences);
router.put(
  "/preferences/:userId",
  [...auth, validateNotificationPreferences],
  updatePreferences
);

export default router;
