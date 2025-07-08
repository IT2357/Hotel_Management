// 📁 backend/routes/adminRoutes.js
import express from "express";
import {
  createPrivilegedUser,
  createInvitation,
  getInvitations,
  approveUser,
  getPendingApprovals,
  getUsers,
  updateUserRole,
  deactivateUser,
} from "../controllers/admin/adminController.js";
import { authenticateToken } from "../middleware/auth.js";
import {
  checkApprovedAdmin,
  checkPermissions,
} from "../middleware/roleAuth.js";

const router = express.Router();

// All admin routes require:
// 1. Valid token
// 2. Admin role
// 3. Approved admin status
router.use(authenticateToken, checkApprovedAdmin);

// User management routes
router.post("/users", checkPermissions(["create-user"]), createPrivilegedUser);
router.post("/invitations", createInvitation);
router.get("/invitations", getInvitations);
router.get("/users", checkPermissions(["view-users"]), getUsers);
router.put(
  "/users/:userId/role",
  checkPermissions(["assign-roles"]),
  updateUserRole
);
router.put(
  "/users/:userId/deactivate",
  checkPermissions(["deactivate-users"]),
  deactivateUser
);

// Approval system routes
router.get(
  "/approvals",
  checkPermissions(["approve-users"]),
  getPendingApprovals
);
router.put(
  "/approvals/:userId",
  checkPermissions(["approve-users"]),
  approveUser
);

export default router;
