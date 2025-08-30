// 📁 backend/controllers/auth/authController.js
import AuthService from "../../services/auth/authService.js";

// Helper for consistent error responses
const handleError = (res, error, defaultMessage = "Operation failed") => {
  console.error(`${defaultMessage}:`, error);

  const statusCode = error.message.includes("not found")
    ? 404
    : error.message.includes("already exists")
    ? 400
    : error.message.includes("Invalid")
    ? 401
    : error.message.includes("expired")
    ? 410
    : error.message.includes("pending")
    ? 403
    : 500;

  res.status(statusCode).json({
    success: false,
    message: error.message || defaultMessage,
  });
};

// Helper for success responses
const sendSuccess = (
  res,
  data,
  message = "Operation successful",
  statusCode = 200
) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

// Register Guest User
export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    const result = await AuthService.registerGuest({
      name,
      email,
      password,
      phone,
    });
    sendSuccess(res, result, result.message, 201);
  } catch (error) {
    handleError(res, error, "Registration failed");
  }
};

// Check invitation validity
export const checkInvitation = async (req, res) => {
  try {
    const { token } = req.query;
    const result = await AuthService.checkInvitation(token);
    sendSuccess(res, result);
  } catch (error) {
    handleError(res, error, "Invalid invitation");
  }
};

// Register with invitation
export const registerWithInvitation = async (req, res) => {
  try {
    const { token, name, password } = req.body;
    const result = await AuthService.registerWithInvitation({
      token,
      name,
      password,
    });
    sendSuccess(res, result, "User registered successfully", 201);
  } catch (error) {
    handleError(res, error, "Registration with invitation failed");
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await AuthService.login({
      email,
      password,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({
      success: true,
      data: result,
      message: "Login successful",
    });
  } catch (error) {
    console.error("🔐 Login controller error:", {
      message: error.message,
      stack: error.stack,
      email: req.body.email,
    });

    // Handle password reset required
    if (error.message === "Password change required") {
      return res.status(403).json({
        success: false,
        message: error.message,
        redirectTo: error.cause?.redirectTo,
        data: error.cause?.data,
      });
    }

    // Handle email verification required
    if (error.message.includes("verify your email")) {
      return res.status(403).json({
        success: false,
        message: error.message,
        requiresVerification: true,
        data: error.cause?.data,
      });
    }

    // Handle pending admin approval
    if (error.message.includes("pending admin approval")) {
      return res.status(403).json({
        success: false,
        message: error.message,
        requiresApproval: true,
      });
    }

    // Handle invalid credentials
    if (error.message === "Invalid email or password") {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    // Generic error handling
    return res.status(500).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
};

// Verify email with OTP
export const verifyEmail = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    // Input validation
    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        message: "User ID and OTP are required",
      });
    }

    const result = await AuthService.verifyEmail(userId, otp);
    sendSuccess(res, result, result.message);
  } catch (error) {
    handleError(res, error, "Email verification failed");
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const result = await AuthService.resendOTP(userId);
    sendSuccess(res, result, result.message);
  } catch (error) {
    handleError(res, error, "Failed to resend verification code");
  }
};

// Forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const result = await AuthService.forgotPassword(email);
    sendSuccess(res, result, result.message);
  } catch (error) {
    handleError(res, error, "Failed to send reset email");
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
    }

    const result = await AuthService.resetPassword(token, newPassword);
    sendSuccess(res, result, result.message);
  } catch (error) {
    handleError(res, error, "Password reset failed");
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "User ID, current password, and new password are required",
      });
    }
    const result = await AuthService.changePasswordForUser(
      userId, // Use userId from request body
      currentPassword,
      newPassword
    );
    sendSuccess(res, result, result.message);
  } catch (error) {
    handleError(res, error, "Password change failed");
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const user = await AuthService.getCurrentUser(req.user._id, req.user.role);
    sendSuccess(res, { user });
  } catch (error) {
    handleError(res, error, "Failed to get user data");
  }
};

// Update profile
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const user = await AuthService.updateProfile(req.user._id, {
      name,
      phone,
      address,
    });
    sendSuccess(res, { user }, "Profile updated successfully");
  } catch (error) {
    handleError(res, error, "Profile update failed");
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    const result = await AuthService.logout(req.user._id);
    sendSuccess(res, result, result.message);
  } catch (error) {
    handleError(res, error, "Logout failed");
  }
};

// Check approval status
export const checkApprovalStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await AuthService.checkApprovalStatus(userId);
    sendSuccess(res, result);
  } catch (error) {
    handleError(res, error, "Failed to check approval status");
  }
};

// Social login callback
export const socialCallback = (req, res) => {
  try {
    const result = AuthService.processSocialCallback(req.user);

    // Redirect to frontend with token
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?token=${result.token}`
    );
  } catch (error) {
    console.error("Social callback error:", error);
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent(
        error.message
      )}`
    );
  }
};

export default {
  register,
  checkInvitation,
  registerWithInvitation,
  login,
  verifyEmail,
  resendOTP,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updateProfile,
  changePassword,
  logout,
  checkApprovalStatus,
  socialCallback,
};
