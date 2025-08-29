import express from "express";
import passport from "passport";
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
  socialCallback,
  deleteProfile,
} from "../controllers/auth/authController.js";
import { authenticateToken } from "../middleware/auth.js";
import {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validateChangePassword,
} from "../middleware/validation.js";
import { authorizeRoles } from "../middleware/roleAuth.js"; // <-- only this now

const router = express.Router();

// Public routes (no auth needed)
router.post("/register", validateRegistration, register);
router.get("/check-invitation", checkInvitation);
router.post("/register-with-invite", registerWithInvitation);
router.post("/login", validateLogin, login);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOTP);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Social login routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  socialCallback
);
router.get("/apple", passport.authenticate("apple"));
router.post(
  "/apple/callback",
  passport.authenticate("apple", { failureRedirect: "/login", session: false }),
  socialCallback
);

// Protected routes
router.get("/me", authenticateToken, getCurrentUser);
router.put("/profile", authenticateToken, validateProfileUpdate, updateProfile);
router.put(
  "/change-password",
  authenticateToken,
  validateChangePassword,
  changePassword
);
router.post("/logout", authenticateToken, logout);
router.delete("/profile", authenticateToken, deleteProfile);

// Example protected route with role & permission check:
// router.get(
//   "/staff-panel",
//   authenticateToken,
//   authorizeRoles({ roles: ["staff", "manager", "admin"], permissions: ["staff:read"] }),
//   getStaffPanel
// );

export default router;
