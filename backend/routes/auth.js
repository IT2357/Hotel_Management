import express from "express";
import passport from "passport";
import authController from "../controllers/auth/authController.js";
import { authenticateToken, optionalAuth } from "../middleware/auth.js";
import {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validateChangePassword,
} from "../middleware/validation.js";
import { authorizeRoles } from "../middleware/roleAuth.js"; // <-- only this now

const router = express.Router();

// Public routes (no auth needed)
router.post("/register", validateRegistration, authController.register);
router.get("/check-invitation", authController.checkInvitation);
router.post("/register-with-invite", authController.registerWithInvitation);
router.post("/login", validateLogin, authController.login);
router.post("/verify-email", authController.verifyEmail);
router.post("/resend-otp", authController.resendOTP);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/change-password", optionalAuth, authController.changePassword);

// Social login routes
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL) {
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
    authController.socialCallback
  );
  console.log("✅ Google OAuth routes registered");
} else {
  console.log("⚠️ Google OAuth routes not registered - missing environment variables");
}

if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY && process.env.APPLE_CALLBACK_URL) {
  router.get("/apple", passport.authenticate("apple"));
  router.post(
    "/apple/callback",
    passport.authenticate("apple", { failureRedirect: "/login", session: false }),
    authController.socialCallback
  );
  console.log("✅ Apple OAuth routes registered");
} else {
  console.log("⚠️ Apple OAuth routes not registered - missing environment variables");
}

// Protected routes
router.get("/me", authenticateToken, authController.getCurrentUser);
router.put("/profile", authenticateToken, validateProfileUpdate, authController.updateProfile);
router.put(
  "/change-password",
  authenticateToken,
  validateChangePassword,
  authController.changePassword
);
router.post("/logout", authenticateToken, authController.logout);
import seedTestUsers from "../utils/seedTestUsers.js";

// Test route to seed test users
router.post("/seed-test-users", async (req, res) => {
  try {
    await seedTestUsers();
    res.json({
      success: true,
      message: "Test users seeded successfully",
      users: [
        { email: 'admin@test.com', password: 'admin123', role: 'admin' },
        { email: 'guest@test.com', password: 'guest123', role: 'guest' },
        { email: 'manager@test.com', password: 'manager123', role: 'manager' },
        { email: 'staff@test.com', password: 'staff123', role: 'staff' }
      ]
    });
  } catch (error) {
    console.error("Error seeding test users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to seed test users",
      error: error.message
    });
  }
});

export default router;
