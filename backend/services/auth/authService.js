// 📁 backend/services/auth/authService.js
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../../models/User.js";
import Invitation from "../../models/Invitation.js";
import GuestProfile from "../../models/profiles/GuestProfile.js";
import StaffProfile from "../../models/profiles/StaffProfile.js";
import ManagerProfile from "../../models/profiles/ManagerProfile.js";
import AdminProfile from "../../models/profiles/AdminProfile.js";
import EmailService from "../notification/emailService.js";

class AuthService {
  // Generate JWT Token with tokenVersion
  generateToken(user) {
    return jwt.sign(
      {
        userId: user._id,
        role: user.role, // REQUIRED
        isApproved: user.isApproved, // REQUIRED
        tokenVersion: user.tokenVersion,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      }
    );
  }

  // Generate OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Create role-specific profile
  async createRoleProfile(userId, role, permissions = null) {
    switch (role) {
      case "guest":
        return await GuestProfile.create({
          userId,
          preferences: { preferredLanguage: "en" },
        });
      case "staff":
        return await StaffProfile.create({
          userId,
          isActive: true,
          department: "Service", // Default department
          position: "Staff Member", // Default position
        });
      case "manager":
        return await ManagerProfile.create({
          userId,
          departments: ["FrontDesk"], // Default department
          permissions: {
            canApproveLeave: false,
            canAuthorizePayments: false,
            canManageInventory: false,
            canOverridePricing: false,
            canViewFinancials: false,
          },
        });
      case "admin":
        return await AdminProfile.create({
          userId,
          permissions: permissions || [
            { module: "users", actions: ["read", "create", "update"] },
            { module: "reports", actions: ["read"] },
          ],
          accessLevel: "Limited",
        });
      default:
        throw new Error(`Invalid role: ${role}`);
    }
  }

  // Register guest user
  async registerGuest({ name, email, password, phone }) {
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("User already exists with this email");
    }

    // Create user
    const otpCode = this.generateOTP();
    const user = new User({
      name,
      email,
      password, // Pre-save hook hashes this
      phone,
      role: "guest",
      isApproved: true,
      tokenVersion: 0,
      authProviders: [],
      otpCode: otpCode,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await user.save();

    // Create guest profile
    await this.createRoleProfile(user._id, "guest");

    // Send verification email
    await EmailService.sendVerificationEmail(user, otpCode);

    return {
      userId: user._id,
      email: user.email,
      message:
        "Guest registered successfully. Please check your email for verification code.",
    };
  }

  // Check invitation validity
  async checkInvitation(token) {
    if (!token) {
      throw new Error("Invitation token is required");
    }

    const invitation = await Invitation.findOne({ token });
    if (!invitation || invitation.used) {
      throw new Error("Invalid or already used invitation");
    }

    if (invitation.expiresAt < new Date()) {
      throw new Error("Invitation has expired");
    }

    return {
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    };
  }

  // Register with invitation
  async registerWithInvitation({ token, name, password }) {
    if (!token || !name || !password) {
      throw new Error("Token, name, and password are required");
    }

    const invitation = await Invitation.findOne({ token });
    if (!invitation || invitation.used) {
      throw new Error("Invalid or already used invitation");
    }

    if (invitation.expiresAt < new Date()) {
      throw new Error("Invitation has expired");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: invitation.email });
    if (existingUser) {
      throw new Error("User already exists with this email");
    }

    // Create user
    const user = await User.create({
      name,
      email: invitation.email,
      password, // Pre-save hook hashes this
      emailVerified: true,
      role: invitation.role,
      isApproved: true,
      approvedBy: invitation.createdBy,
      approvedAt: new Date(),
      tokenVersion: 0,
      authProviders: [],
    });

    // Create role-specific profile
    await this.createRoleProfile(user._id, invitation.role);

    // Mark invitation as used
    invitation.used = true;
    await invitation.save();

    // Generate auth token
    const authToken = this.generateToken(user);

    return {
      token: authToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  // Login user
  async login({ email, password, ipAddress, userAgent }) {
    const user = await User.findOne({ email }).select(
      "+password +tokenVersion +passwordResetPending"
    );

    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (user.passwordResetPending) {
      throw new Error("Password reset is pending. Please reset your password.");
    }
    if (!user) {
      throw new Error("Invalid email or password");
    }
    if (user.authProviders.length > 0) {
      throw new Error(
        "This account uses social login. Please use Google or Apple."
      );
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }
    if (!user.emailVerified) {
      const otpCode = this.generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      user.otpCode = otpCode; // Use otpCode
      user.otpExpiresAt = otpExpiry; // Use otpExpiresAt
      await user.save();
      await EmailService.sendVerificationEmail(user, otpCode);
      throw new Error(
        "Please verify your email address. A new verification code has been sent.",
        {
          cause: {
            requiresVerification: true,
            data: { user: { _id: user._id, email: user.email } },
          },
        }
      );
    }
    if (user.role !== "guest" && !user.isApproved) {
      throw new Error("Your account is pending admin approval");
    }
    if (!user.isActive) {
      throw new Error(
        "Your account has been deactivated. Please contact support."
      );
    }
    user.lastLogin = new Date();
    user.loginHistory.push({
      ipAddress: ipAddress || "Unknown",
      device: userAgent || "Unknown",
    });
    await user.save();
    const token = this.generateToken(user);
    user.password = undefined;
    user.tokenVersion = undefined;
    return { user, token };
  }

  // Verify email with OTP
  async verifyEmail(userId, otp) {
    const user = await User.findById(userId).select(
      "+otpCode +otpExpiresAt +tokenVersion"
    );
    if (!user) {
      throw new Error("User not found");
    }
    if (user.emailVerified) {
      throw new Error("Email already verified");
    }
    if (
      !user.otpCode ||
      user.otpCode != String(otp) || // Convert otp to string for comparison
      user.otpExpiresAt < new Date()
    ) {
      throw new Error("Invalid or expired OTP");
    }
    user.emailVerified = true;
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    await user.save();
    if (user.role !== "guest") {
      await this.notifyAdminsAboutPendingApproval(user);
    }
    const token = this.generateToken(user);
    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        isApproved: user.isApproved,
      },
      token,
      message:
        user.role === "guest"
          ? "Email verified successfully. You can now login."
          : "Email verified successfully. Your account is pending admin approval.",
    };
  }

  // Resend OTP
  async resendOTP(userId) {
    const user = await User.findById(userId).select("+otpCode +otpExpiresAt");
    if (!user) {
      throw new Error("User not found");
    }
    if (user.emailVerified) {
      throw new Error("Email already verified");
    }
    const otpCode = this.generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.otpCode = otpCode;
    user.otpExpiresAt = otpExpiry;
    await user.save();
    await EmailService.sendVerificationEmail(user, otpCode);
    return { message: "Verification code sent successfully" };
  }

  // Forgot password
  async forgotPassword(email) {
    const user = await User.findOne({ email }).select(
      "+passwordResetToken +passwordResetExpiry"
    );
    if (!user) {
      throw new Error("User not found with this email");
    }

    if (user.authProviders.length > 0) {
      throw new Error(
        "This account uses social login. Please use Google or Apple to reset your account."
      );
    }

    // Generate reset token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000);

    user.passwordResetToken = hashedToken;
    user.passwordResetExpiry = resetTokenExpiry;
    await user.save();

    // Send reset email
    await EmailService.sendPasswordResetEmail(user, rawToken);

    return { message: "Password reset link sent to your email" };
  }

  // Reset password
  async resetPassword(token, newPassword) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiry: { $gt: Date.now() },
    }).select(
      "+passwordResetToken +passwordResetExpiry +tokenVersion +passwordResetPending"
    );

    if (!user) {
      throw new Error("Invalid or expired reset token");
    }

    // Set passwordResetPending to true
    user.passwordResetPending = true;
    await user.save();

    return { message: "Password reset link sent to your email" };

    if (!user) {
      throw new Error("Invalid or expired reset token");
    }

    // Update password and invalidate token
    user.password = newPassword; // Pre-save hook hashes
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    user.passwordResetPending = false; // Set passwordResetPending to false
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    return { message: "Password reset successful" };
  }

  // Get current user with profile
  async getCurrentUser(userId, role) {
    let query = User.findById(userId).select(
      "-password -otp -passwordResetToken -passwordResetExpiry -tokenVersion"
    );

    // Populate role-specific profile
    switch (role) {
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
      throw new Error("User not found");
    }

    return user;
  }

  // Update user profile
  async updateProfile(userId, { name, phone, address }) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    await user.save();

    // Clean sensitive data
    user.password = undefined;
    user.otp = undefined;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    user.tokenVersion = undefined;

    return user;
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select("+password +tokenVersion");
    if (!user) {
      throw new Error("User not found");
    }

    if (user.authProviders.length > 0) {
      throw new Error(
        "This account uses social login. Please use Google or Apple to manage your account."
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Update password and increment token version
    user.password = newPassword; // Pre-save hook hashes
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    return { message: "Password changed successfully" };
  }

  // Logout user
  async logout(userId) {
    const user = await User.findById(userId).select("+tokenVersion");
    if (!user) {
      throw new Error("User not found");
    }

    // Invalidate all tokens by incrementing version
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    return { message: "Logged out successfully" };
  }

  // Check approval status
  async checkApprovalStatus(userId) {
    const user = await User.findById(userId).select(
      "isApproved role emailVerified"
    );
    if (!user) {
      throw new Error("User not found");
    }

    return {
      isApproved: user.isApproved,
      role: user.role,
      emailVerified: user.emailVerified,
    };
  }

  // Handle social login callback
  processSocialCallback(user) {
    if (!user) {
      throw new Error("Social authentication failed");
    }

    const token = this.generateToken(user);
    return { token, user };
  }

  // Private helper: Notify admins about pending approval
  async notifyAdminsAboutPendingApproval(user) {
    try {
      const admins = await User.find({ role: "admin", isApproved: true });

      const emailPromises = admins.map((admin) =>
        EmailService.sendAdminNotificationEmail(admin, {
          subject: "New User Requires Approval",
          userName: user.name,
          userEmail: user.email,
          userRole: user.role,
        })
      );

      await Promise.all(emailPromises);
    } catch (error) {
      console.error("Failed to notify admins:", error);
      // Don't throw - this shouldn't fail the main operation
    }
  }
}

export default new AuthService();
