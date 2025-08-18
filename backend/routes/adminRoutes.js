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
  getPendingRefunds,
  getRefundDetails,
  approveRefund,
  denyRefund,
  requestMoreInfo,
  processRefund,
  checkRefundStatus,
} from "../controllers/admin/adminController.js";
import { authenticateToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/roleAuth.js";
import { refundOperationMiddleware } from "../middleware/refundValidation.js";
import StaffProfile from "../models/profiles/StaffProfile.js";

const router = express.Router();

// 🔒 Global middleware for admin routes - only approved admins
router.use(authenticateToken, authorizeRoles({ roles: ["admin"] }));

router.get(
  "/staff-profiles",
  authenticateToken,
  authorizeRoles(["admin"]),
  async (req, res) => {
    try {
      const staffProfiles = await StaffProfile.find({ isActive: true })
        .populate("userId", "name email phone role")
        .select("userId department position isActive");

      res.json({
        success: true,
        data: staffProfiles.map((profile) => ({
          userId: profile.userId._id,
          userEmail: profile.userId.email,
          userName: profile.userId.name,
          userRole: profile.userId.role,
          department: profile.department,
          position: profile.position,
          isActive: profile.isActive,
        })),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch staff profiles",
        error: error.message,
      });
    }
  }
);

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

// 🛍️ Refund management routes
router.get(
  "/refunds/pending",
  authorizeRoles({ permissions: ["refunds:read"] }),
  getPendingRefunds
);
router.get(
  "/refunds/:id",
  authorizeRoles({ permissions: ["refunds:read"] }),
  getRefundDetails
);
router.post(
  "/refunds/:id/approve",
  authorizeRoles({ permissions: ["refunds:update"] }),
  ...refundOperationMiddleware("approve"),
  approveRefund
);
router.post(
  "/refunds/:id/deny",
  authorizeRoles({ permissions: ["refunds:update"] }),
  ...refundOperationMiddleware("deny"),
  denyRefund
);
router.post(
  "/refunds/:id/request-info",
  authorizeRoles({ permissions: ["refunds:read"] }),
  ...refundOperationMiddleware("request-info"),
  requestMoreInfo
);
router.post(
  "/refunds/:id/process",
  authorizeRoles({ permissions: ["refunds:update"] }),
  ...refundOperationMiddleware("process"),
  processRefund
);
router.get(
  "/refunds/:id/status",
  authorizeRoles({ permissions: ["refunds:read"] }),
  checkRefundStatus
);

export default router;
