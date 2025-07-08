// 📁 routes/auth.js
import express from "express";
import {
  register,
  registerWithInvitation,
  checkInvitation,
  login,
  verifyEmail,
  resendOTP,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updateProfile,
  changePassword,
  logout,
  // getDashboard,
  // getStaffPanel,
  // deleteRoom,
  // getBooking
} from "../controllers/auth/authController.js";
import { authenticateToken } from "../middleware/auth.js";
import {
  validateRegistration,
  validateLogin,
} from "../middleware/validation.js";
// import { authorizeRoles, checkPermissions, checkResourceAccess } from "../middleware/roleAuth.js";

const router = express.Router();

// Public routes
router.post("/register", validateRegistration, register);
router.get("/check-invitation", checkInvitation);
router.post("/register-with-invite", registerWithInvitation);
router.post("/login", validateLogin, login);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOTP);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected routes
router.get("/me", authenticateToken, getCurrentUser);
router.put("/profile", authenticateToken, updateProfile);
router.put("/change-password", authenticateToken, changePassword);
router.post("/logout", authenticateToken, logout);

// Uncomment and implement these as needed:
// router.get("/dashboard", authenticateToken, getDashboard);
// router.get("/staff-panel", authenticateToken, authorizeRoles("staff", "manager", "admin"), getStaffPanel);
// router.delete("/rooms/:id", authenticateToken, checkPermissions(["delete-room"]), deleteRoom);
// router.get("/bookings/:id", authenticateToken, checkResourceAccess("booking"), getBooking);

export default router;
