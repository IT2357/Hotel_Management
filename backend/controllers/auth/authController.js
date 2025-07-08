// 📁 controllers/auth/authController.js
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../models/User.js";
import Invitation from "../../models/Invitation.js";
import GuestProfile from "../../models/profiles/GuestProfile.js";
import StaffProfile from "../../models/profiles/StaffProfile.js";
import ManagerProfile from "../../models/profiles/ManagerProfile.js";
import AdminProfile from "../../models/profiles/AdminProfile.js";
import { sendEmail } from "../../services/notification/emailService.js";
// import { sendSMS } from "../../services/notification/smsService.js";

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register User (Guest only)
export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Force role to be guest for public registration
    const role = "guest";

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate OTP for email verification
    const otpCode = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user (auto-approved for guests)
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
      isApproved: true, // Guests are auto-approved
      otp: {
        code: otpCode,
        expiresAt: otpExpiry,
      },
    });

    await user.save();

    // Create guest profile
    await GuestProfile.create({
      userId: user._id,
      preferences: { preferredLanguage: "en" },
    });

    // Send verification email
    await sendEmail({
      to: email,
      subject: "Verify Your Email - Hotel Management System",
      html: `
        <h2>Welcome to Our Hotel!</h2>
        <p>Hi ${name},</p>
        <p>Your verification code is: <strong>${otpCode}</strong></p>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't create this account, please ignore this email.</p>
      `,
    });

    res.status(201).json({
      success: true,
      message:
        "Guest registered successfully. Please check your email for verification code.",
      data: {
        userId: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

export const checkInvitation = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: "Invitation token is required" });
    }

    const invitation = await Invitation.findOne({ token });

    if (!invitation || invitation.used) {
      return res
        .status(404)
        .json({ error: "Invalid or already used invitation" });
    }

    if (invitation.expiresAt < new Date()) {
      return res.status(410).json({ error: "Invitation has expired" });
    }

    res.status(200).json({
      message: "Invitation is valid",
      email: invitation.email,
      role: invitation.role,
    });
  } catch (err) {
    console.error("Error checking invitation:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const registerWithInvitation = async (req, res) => {
  try {
    const { token, name, password } = req.body;

    if (!token || !name || !password) {
      return res
        .status(400)
        .json({ error: "Token, name, and password are required" });
    }

    const invitation = await Invitation.findOne({ token });

    if (!invitation || invitation.used) {
      return res
        .status(400)
        .json({ error: "Invalid or already used invitation" });
    }

    if (invitation.expiresAt < new Date()) {
      return res.status(410).json({ error: "Invitation has expired" });
    }

    const existingUser = await User.findOne({ email: invitation.email });
    if (existingUser) {
      return res
        .status(409)
        .json({ error: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email: invitation.email,
      password: hashedPassword,
      role: invitation.role,
      isApproved: true,
      approvedBy: invitation.createdBy,
      approvedAt: new Date(),
    });

    // Mark invitation as used
    invitation.used = true;
    await invitation.save();

    // Generate token (optional)
    const authToken = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "User registered successfully",
      token: authToken,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error("Error registering with invitation:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Login User
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      // Generate new OTP
      const otpCode = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      user.otp = {
        code: otpCode,
        expiresAt: otpExpiry,
      };
      await user.save();

      // Send verification email
      await sendEmail({
        to: email,
        subject: "Verify Your Email - Hotel Management System",
        html: `
          <h2>Email Verification Required</h2>
          <p>Hi ${user.name},</p>
          <p>Your verification code is: <strong>${otpCode}</strong></p>
          <p>This code will expire in 10 minutes.</p>
        `,
      });

      return res.status(401).json({
        success: false,
        message:
          "Please verify your email address. A new verification code has been sent.",
        requiresVerification: true,
        userId: user._id,
      });
    }

    // Check if account is approved (for non-guest roles)
    if (user.role !== "guest" && !user.isApproved) {
      return res.status(403).json({
        success: false,
        message: "Your account is pending admin approval",
        requiresApproval: true,
        userId: user._id,
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    user.password = undefined;

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

// Verify Email with OTP
export const verifyEmail = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified",
      });
    }

    // Check OTP
    if (!user.otp || user.otp.code !== otp || user.otp.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Verify email
    user.emailVerified = true;
    user.otp = undefined;
    await user.save();

    // For non-guest roles, notify admins about pending approval
    if (user.role !== "guest") {
      await notifyAdminsAboutPendingApproval(user);
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message:
        user.role === "guest"
          ? "Email verified successfully. You can now login."
          : "Email verified successfully. Your account is pending admin approval.",
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          isApproved: user.isApproved,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Email verification failed",
      error: error.message,
    });
  }
};

// Notify admins about pending approval
const notifyAdminsAboutPendingApproval = async (user) => {
  try {
    const admins = await User.find({ role: "admin", isApproved: true });

    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: "New User Requires Approval",
        html: `
          <h2>New User Pending Approval</h2>
          <p>A new ${user.role} user (${user.name}, ${user.email}) has registered and requires approval.</p>
          <p>Please review and approve this user in the admin dashboard.</p>
        `,
      });
    }
  } catch (error) {
    console.error("Failed to notify admins:", error);
  }
};

// Check Approval Status
export const checkApprovalStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select(
      "isApproved role emailVerified"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        isApproved: user.isApproved,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to check approval status",
      error: error.message,
    });
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified",
      });
    }

    // Generate new OTP
    const otpCode = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = {
      code: otpCode,
      expiresAt: otpExpiry,
    };
    await user.save();

    // Send verification email
    try {
      await sendEmail({
        to: user.email,
        subject: "Verify Your Email - Hotel Management System",
        html: `
          <h2>Email Verification</h2>
          <p>Hi ${user.name},</p>
          <p>Your new verification code is: <strong>${otpCode}</strong></p>
          <p>This code will expire in 10 minutes.</p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      throw new Error("Failed to send OTP email");
    }

    res.json({
      success: true,
      message: "Verification code sent successfully",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend verification code",
      error: error.message,
    });
  }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email",
      });
    }

    // Generate raw token
    const rawToken = crypto.randomBytes(32).toString("hex");

    // Hash the token before saving
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000);

    user.passwordResetToken = hashedToken;
    user.passwordResetExpiry = resetTokenExpiry;
    await user.save();

    // Send raw token in email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
    await sendEmail({
      to: email,
      subject: "Password Reset - Hotel Management System",
      html: `
        <h2>Password Reset Request</h2>
        <p>Hi ${user.name},</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link will expire in 30 minutes.</p>
        <p>If you didn't request this, you can safely ignore this message.</p>
      `,
    });

    res.json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send reset email",
      error: error.message,
    });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Password reset failed",
      error: error.message,
    });
  }
};

// Get Current User
export const getCurrentUser = async (req, res) => {
  try {
    let query = User.findById(req.user._id).select(
      "-password -otp -passwordResetToken -passwordResetExpiry"
    );

    switch (req.user.role) {
      case "guest":
        query = query.populate({
          path: "guestProfile",
          select: "-userId -__v",
        });
        break;
      case "staff":
        query = query.populate({
          path: "staffProfile",
          select: "-userId -__v",
        });
        break;
      case "manager":
        query = query.populate({
          path: "managerProfile",
          select: "-userId -__v",
        });
        break;
      case "admin":
        query = query.populate({
          path: "adminProfile",
          select: "-userId -__v",
        });
        break;
    }

    const user = await query;

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user data",
      error: error.message,
    });
  }
};

// Update Profile
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user data
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    await user.save();

    // Remove sensitive fields from response
    user.password = undefined;
    user.otp = undefined;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: { user },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Profile update failed",
      error: error.message,
    });
  }
};

// Change Password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Password change failed",
      error: error.message,
    });
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    // In a more advanced implementation, you might want to blacklist the token
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
      error: error.message,
    });
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
};
