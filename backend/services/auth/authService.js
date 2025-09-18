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
import logger from "../../utils/logger.js";

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

    // Create role-specific profile (apply permissions for admin invites)
    await this.createRoleProfile(
      user._id,
      invitation.role,
      invitation.role === "admin" ? invitation.permissions : null
    );

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
  // async login({ email, password, ipAddress, userAgent }) {
  //   const user = await User.findOne({ email }).select(
  //     "+password +tokenVersion +passwordResetPending +isActive"
  //   );
  //   if (!user) {
  //     throw new Error("Invalid email or password");
  //   }
  //   if (user.authProviders.length > 0) {
  //     throw new Error(
  //       "This account uses social login. Please use Google or Apple."
  //     );
  //   }
  //   // Allow login for password reset pending users
  //   if (user.passwordResetPending && !user.isActive) {
  //     const isPasswordValid = await bcrypt.compare(password, user.password);
  //     if (!isPasswordValid) {
  //       throw new Error("Invalid email or password");
  //     }
  //     user.lastLogin = new Date();
  //     user.loginHistory.push({
  //       ipAddress: ipAddress || "Unknown",
  //       device: userAgent || "Unknown",
  //     });
  //     await user.save();
  //     const token = this.generateToken(user);
  //     return {
  //       user: {
  //         _id: user._id,
  //         email: user.email,
  //         name: user.name,
  //         role: user.role,
  //         isActive: user.isActive,
  //         passwordResetPending: user.passwordResetPending,
  //         isApproved: user.isApproved,
  //         emailVerified: user.emailVerified,
  //       },
  //       token,
  //     };
  //   }
  //   const isPasswordValid = await bcrypt.compare(password, user.password);
  //   if (!isPasswordValid) {
  //     throw new Error("Invalid email or password");
  //   }
  //   if (!user.emailVerified) {
  //     const otpCode = this.generateOTP();
  //     const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  //     user.otpCode = otpCode;
  //     user.otpExpiresAt = otpExpiry;
  //     await user.save();
  //     await EmailService.sendVerificationEmail(user, otpCode);
  //     throw new Error(
  //       "Please verify your email address. A new verification code has been sent.",
  //       {
  //         cause: {
  //           requiresVerification: true,
  //           data: { user: { _id: user._id, email: user.email } },
  //         },
  //       }
  //     );
  //   }
  //   if (user.role !== "guest" && !user.isApproved) {
  //     throw new Error("Your account is pending admin approval");
  //   }
  //   if (!user.isActive) {
  //     throw new Error(
  //       "Your account has been deactivated. Please contact support."
  //     );
  //   }
  //   user.lastLogin = new Date();
  //   user.loginHistory.push({
  //     ipAddress: ipAddress || "Unknown",
  //     device: userAgent || "Unknown",
  //   });
  //   await user.save();
  //   const token = this.generateToken(user);
  //   return {
  //     user: {
  //       _id: user._id,
  //       email: user.email,
  //       name: user.name,
  //       role: user.role,
  //       isActive: user.isActive,
  //       passwordResetPending: user.passwordResetPending,
  //       isApproved: user.isApproved,
  //       emailVerified: user.emailVerified,
  //     },
  //     token,
  //   };
  // }
  async login({ email, password, ipAddress, userAgent }) {
    console.log("🔐 Backend login called with:", {
      email,
      ipAddress,
      userAgent,
    });
    try {
      const user = await User.findOne({ email }).select(
        "+password +tokenVersion +passwordResetPending +isActive +emailVerified +isApproved"
      );
      if (!user) {
        console.error("🔐 User not found for email:", email);
        throw new Error("Invalid email or password");
      }
      console.log("🔐 Found user:", {
        email: user.email,
        isActive: user.isActive,
        passwordResetPending: user.passwordResetPending,
        emailVerified: user.emailVerified,
        isApproved: user.isApproved,
      });

      if (user.authProviders.length > 0) {
        console.error("🔐 Social login account:", email);
        throw new Error(
          "This account uses social login. Please use Google or Apple."
        );
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        console.error("🔐 Invalid password for user:", email);
        throw new Error("Invalid email or password");
      }

      // Check passwordResetPending before other validations
      if (user.passwordResetPending) {
        console.log("🔐 Password reset required for user:", email);
        throw new Error("Password change required", {
          cause: {
            redirectTo: "/reset-password",
            data: { user: { _id: user._id, email: user.email } },
          },
        });
      }

      if (!user.emailVerified) {
        const otpCode = this.generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        user.otpCode = otpCode;
        user.otpExpiresAt = otpExpiry;
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

      if (!user.isActive) {
        console.error("🔐 Account deactivated for user:", email);
        throw new Error(
          "Your account has been deactivated. Please contact support."
        );
      }

      if (user.role !== "guest" && !user.isApproved) {
        console.error("🔐 Account pending approval for user:", email);
        throw new Error("Your account is pending admin approval");
      }

      try {
        user.lastLogin = new Date();
        user.loginHistory.push({
          ipAddress: ipAddress || "Unknown",
          device: userAgent || "Unknown",
        });
        await user.save();
        console.log("🔐 Login history saved for user:", email);
      } catch (error) {
        console.error("🔐 Error saving login history:", {
          error: error.message,
          stack: error.stack,
        });
        logger.error("Error saving login history", { email, error });
        throw new Error("Failed to update login history");
      }

      const token = this.generateToken(user);
      console.log("🔐 Login successful for user:", email);
      return {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          passwordResetPending: user.passwordResetPending,
          isApproved: user.isApproved,
          emailVerified: user.emailVerified,
        },
        token,
      };
    } catch (error) {
      console.error("🔐 Login error:", {
        message: error.message,
        stack: error.stack,
        email,
      });
      logger.error("Login error", { email, error });
      throw error;
    }
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
    user.passwordResetPending = true;
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

    // Update password and invalidate token
    user.password = newPassword; // Pre-save hook hashes
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    user.passwordResetPending = false;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    return { message: "Password reset successfully" };
  }

  // Change password for logged-in users (including forced changes)
  async changePasswordForUser(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId).select(
        "+password +tokenVersion +passwordResetPending"
      );
      if (!user) {
        throw new Error("User not found");
      }
      if (user.authProviders.length > 0) {
        throw new Error(
          "This account uses social login. Please use Google or Apple to manage your account."
        );
      }
      if (!user.passwordResetPending) {
        if (!currentPassword) {
          throw new Error("Current password is required");
        }
        const isCurrentPasswordValid = await bcrypt.compare(
          currentPassword,
          user.password
        );
        if (!isCurrentPasswordValid) {
          throw new Error("Current password is incorrect");
        }
      }
      if (newPassword.length < 8) {
        throw new Error("New password must be at least 8 characters");
      }
      user.password = newPassword;
      user.passwordResetPending = false;
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      await user.save();
      logger.info(`Password changed for user ${userId}`);
      return { message: "Password changed successfully" };
    } catch (error) {
      logger.error("Error changing password:", error);
      throw error;
    }
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

    const user = await query.exec();
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

  // Delete user profile and associated data
  async deleteProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Delete role-specific profile
    switch (user.role) {
      case "guest":
        await GuestProfile.deleteOne({ userId });
        break;
      case "staff":
        await StaffProfile.deleteOne({ userId });
        break;
      case "manager":
        await ManagerProfile.deleteOne({ userId });
        break;
      case "admin":
        await AdminProfile.deleteOne({ userId });
        break;
    }

    // Delete user
    await User.deleteOne({ _id: userId });

    return { message: "User and associated profile deleted successfully" };
  }
}

export default new AuthService();
