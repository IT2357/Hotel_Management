// 📁 backend/routes/adminRoutes.js
import express from "express";
import {
  getAllNotifications,
  sendAdminNotification,
  getNotificationStats,
  createPrivilegedUser,
  createInvitation,
  getInvitations,
  updateInvitation,
  deleteInvitation,
  approveUser,
  getPendingApprovals,
  getUsers,
  updateUserRole,
  deactivateUser,
} from "../controllers/admin/adminController.js";
import { authenticateToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/roleAuth.js";

const router = express.Router();

// 🔒 Global middleware for admin routes - only approved admins
router.use(authenticateToken, authorizeRoles({ roles: ["admin"] }));

// 📣 Notification management routes
router.get(
  "/notifications/admin",
  authorizeRoles({ permissions: ["notifications:read"] }),
  getAllNotifications
);
router.post(
  "/notifications/send",
  authorizeRoles({ permissions: ["notifications:create"] }),
  sendAdminNotification
);
router.get(
  "/notifications/stats",
  authorizeRoles({ permissions: ["notifications:read"] }),
  getNotificationStats
);

// 👥 User management routes
router.post(
  "/users",
  authorizeRoles({ permissions: ["users:create"] }),
  createPrivilegedUser
);
router.get("/users", authorizeRoles({ permissions: ["users:read"] }), getUsers);
router.put(
  "/users/:userId/role",
  authorizeRoles({ permissions: ["users:update"] }),
  updateUserRole
);
router.put(
  "/users/:userId/deactivate",
  authorizeRoles({ permissions: ["users:update"] }),
  deactivateUser
);

// ✅ Approval system routes
router.get(
  "/approvals",
  authorizeRoles({ permissions: ["users:update"] }),
  getPendingApprovals
);
router.put(
  "/approvals/:userId",
  authorizeRoles({ permissions: ["users:update"] }),
  approveUser
);

// ✉️ Invitation management routes
router.get(
  "/invitations",
  authorizeRoles({ permissions: ["invitations:read"] }),
  getInvitations
);
router.post(
  "/invitations",
  authorizeRoles({ permissions: ["invitations:create"] }),
  createInvitation
);
router.put(
  "/invitations/:id",
  authorizeRoles({ permissions: ["invitations:update"] }),
  updateInvitation
);
router.delete(
  "/invitations/:id",
  authorizeRoles({ permissions: ["invitations:delete"] }),
  deleteInvitation
);

export default router;
