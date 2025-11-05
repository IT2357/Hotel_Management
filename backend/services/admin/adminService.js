// 📁 backend/services/admin/adminService.js
import crypto from "crypto";
import { User } from "../../models/User.js";
import Invitation from "../../models/Invitation.js";
import AdminProfile from "../../models/profiles/AdminProfile.js";
import StaffProfile from "../../models/profiles/StaffProfile.js";
import ManagerProfile from "../../models/profiles/ManagerProfile.js";
import GuestProfile from "../../models/profiles/GuestProfile.js";
import RefundRequest from "../../models/RefundRequest.js";
import EmailService from "../notification/emailService.js";
import RefundNotificationService from "../notification/refundNotificationService.js";
import PaymentService from "../payment/paymentService.js";
import logger from "../../utils/logger.js";
import Booking from "../../models/Booking.js";
import Room from "../../models/Room.js";
import Invoice from "../../models/Invoice.js";

class AdminService {
  // Create privileged user
  async createPrivilegedUser({
    name,
    email,
    password,
    phone,
    role,
    permissions,
    requestingAdminId,
  }) {
    // Validate role
    if (!["staff", "manager", "admin"].includes(role)) {
      throw new Error("Invalid role for privileged user creation");
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("User already exists with this email");
    }

    // Create user (auto-approved since created by admin)
    const user = new User({
      name,
      email,
      password, // Pre-save hook hashes this
      phone,
      role,
      isApproved: true,
      approvedBy: requestingAdminId,
      approvedAt: new Date(),
      tokenVersion: 0,
      authProviders: [],
    });

    await user.save();

    // Create role-specific profile
    await this.createRoleProfile(user._id, role, permissions);

    // Send welcome email
    await EmailService.sendWelcomeEmail(user, role);

    return {
      userId: user._id,
      email: user.email,
      role: user.role,
      message: `${role} user created successfully`,
    };
  }

  // Create role-specific profile
  async createRoleProfile(userId, role, permissions = null) {
    switch (role) {
      case "staff":
        return await StaffProfile.create({ userId, isActive: true });
      case "manager":
        return await ManagerProfile.create({ userId });
      case "admin":
        return await AdminProfile.create({
          userId,
          permissions:
            permissions && Array.isArray(permissions)
              ? permissions
              : [
                  { module: "users", actions: ["read"] },
                  { module: "reports", actions: ["read"] },
                ],
        });
      default:
        throw new Error(`Invalid role for profile creation: ${role}`);
    }
  }

  // Approve pending user
  async approveUser(userId, { role, permissions }, requestingAdminId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if already approved
    if (user.isApproved) {
      throw new Error("User is already approved");
    }

    // Update role if provided and valid
    if (
      role &&
      role !== user.role &&
      ["staff", "manager", "admin"].includes(role)
    ) {
      user.role = role;
    }

    // Approve the user
    user.isApproved = true;
    user.approvedBy = requestingAdminId;
    user.approvedAt = new Date();
    await user.save();

    // Create or update role-specific profile
    if (user.role !== "guest") {
      await this.updateOrCreateRoleProfile(user._id, user.role, permissions);
    }

    // Send approval notification
    await EmailService.sendApprovalEmail(user);

    return {
      userId: user._id,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      message: "User approved successfully",
    };
  }

  // Update or create role profile
  async updateOrCreateRoleProfile(userId, role, permissions = null) {
    const options = { upsert: true, new: true };

    switch (role) {
      case "staff":
        return await StaffProfile.findOneAndUpdate(
          { userId },
          { isActive: true },
          options
        );
      case "manager":
        return await ManagerProfile.findOneAndUpdate({ userId }, {}, options);
      case "admin":
        return await AdminProfile.findOneAndUpdate(
          { userId },
          {
            permissions:
              permissions && Array.isArray(permissions)
                ? permissions
                : [
                    { module: "users", actions: ["read"] },
                    { module: "reports", actions: ["read"] },
                  ],
          },
          options
        );
      default:
        throw new Error(`Invalid role: ${role}`);
    }
  }

  // Create invitation
  async createInvitation({ email, role, department, position, permissions, expiresInHours = 24, createdBy }) {
    // Check if invitation already exists
    const existingInvitation = await Invitation.findOne({
      email,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (existingInvitation) {
      throw new Error("Active invitation already exists for this email");
    }

    // Validate staff-specific fields
    if (role === "staff") {
      const validDepartments = ["Housekeeping", "Kitchen", "Maintenance", "Service"];
      if (!department || !validDepartments.includes(department)) {
        throw new Error(`Department is required for staff invites. Valid departments are: ${validDepartments.join(", ")}`);
      }
      if (!position || typeof position !== "string" || position.trim().length === 0) {
        throw new Error("Position is required for staff invites");
      }
    }

    // Validate permissions if provided for admin role
    if (role === "admin" && permissions) {
      if (!Array.isArray(permissions)) {
        throw new Error("Permissions must be an array");
      }

      const validModules = [
        "invitations",
        "notification",
        "users",
        "rooms",
        "bookings",
        "inventory",
        "staff",
        "finance",
        "reports",
        "system",
      ];
      const validActions = [
        "create",
        "read",
        "update",
        "delete",
        "approve",
        "reject",
        "export",
        "manage",
      ];

      for (const perm of permissions) {
        if (!perm || typeof perm !== "object") {
          throw new Error("Each permission must be an object");
        }
        if (!perm.module || typeof perm.module !== "string") {
          throw new Error("Each permission must have a valid 'module' field");
        }
        if (!validModules.includes(perm.module)) {
          throw new Error(`Invalid module '${perm.module}'. Valid modules are: ${validModules.join(", ")}`);
        }
        if (!Array.isArray(perm.actions) || perm.actions.length === 0) {
          throw new Error("Each permission must have a non-empty 'actions' array");
        }
        for (const action of perm.actions) {
          if (typeof action !== "string" || !validActions.includes(action)) {
            throw new Error(`Invalid action '${action}' for module '${perm.module}'. Valid actions are: ${validActions.join(", ")}`);
          }
        }
      }
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");

    // Create invitation
    const invitation = new Invitation({
      email,
      role,
      department: role === "staff" ? department : undefined,
      position: role === "staff" ? position : undefined,
      permissions: role === "admin" ? permissions : undefined,
      token,
      createdBy,
      expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
    });

    await invitation.save();

    // Send invitation email
    await EmailService.sendInvitationEmail(email, role, token, expiresInHours);

    return {
      invitationId: invitation._id,
      email: invitation.email,
      role: invitation.role,
      department: invitation.department,
      position: invitation.position,
      permissions: invitation.permissions,
      expiresAt: invitation.expiresAt,
      message: "Invitation sent successfully",
    };
  }

  // Get invitations with filtering
  async getInvitations({ status, email }) {
    const query = {};

    // Filter by status
    if (status === "active") {
      query.used = false;
      query.expiresAt = { $gt: new Date() };
    } else if (status === "expired") {
      query.expiresAt = { $lt: new Date() };
    } else if (status === "used") {
      query.used = true;
    }

    // Filter by email
    if (email) {
      query.email = { $regex: email, $options: "i" };
    }

    const invitations = await Invitation.find(query)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return invitations;
  }

  // Update invitation
  async updateInvitation(invitationId, updates) {
    const invitation = await Invitation.findByIdAndUpdate(
      invitationId,
      updates,
      { new: true }
    );

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    return invitation;
  }

  // Delete invitation
  async deleteInvitation(invitationId) {
    const deleted = await Invitation.findByIdAndDelete(invitationId);
    if (!deleted) {
      throw new Error("Invitation not found");
    }

    return { message: "Invitation deleted successfully" };
  }

  // Get pending approvals
  async getPendingApprovals() {
    const pendingUsers = await User.find({
      isApproved: false,
      role: { $ne: "guest" },
      emailVerified: true,
    }).select(
      "-password -otp -passwordResetToken -passwordResetExpiry -tokenVersion"
    );

    return pendingUsers;
  }

  // Get all users with filtering and pagination
  async getUsers({ page = 1, limit = 20, role, isApproved, search }) {
    const query = {};

    // Build query filters
    if (role) query.role = role;
    if (typeof isApproved === "boolean") query.isApproved = isApproved;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Execute query with pagination
    const users = await User.find(query)
      .select(
        "-password -otp -passwordResetToken -passwordResetExpiry -tokenVersion"
      )
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("approvedBy", "name email");

    // Populate profiles for users (excluding guests)
    const populatedUsers = await Promise.all(
      users.map(async (user) => {
        const userObj = user.toObject();
        if (user.role !== 'guest') {
          try {
            let profile = null;
            switch (user.role) {
              case "staff":
                profile = await StaffProfile.findOne({ userId: user._id }).select("-userId");
                break;
              case "manager":
                profile = await ManagerProfile.findOne({ userId: user._id }).select("-userId");
                break;
              case "admin":
                profile = await AdminProfile.findOne({ userId: user._id }).select("-userId");
                break;
            }
            userObj.profile = profile;
          } catch (profileError) {
            console.error(`Failed to load profile for user ${user._id}:`, profileError.message);
            userObj.profile = null; // Set to null if profile loading fails
          }
        }
        return userObj;
      })
    );

    const total = await User.countDocuments(query);

    return {
      users: populatedUsers,
      pagination: {
        currentPage: page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Deactivate user
  async deactivateUser(userId, reason) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.isActive) {
      throw new Error("User is already deactivated");
    }

    user.isActive = false;
    user.deactivatedAt = new Date();
    user.deactivationReason = reason;

    // Increment token version to invalidate all sessions
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    // Send deactivation notification
    await EmailService.sendDeactivationEmail(user, reason);

    return {
      userId: user._id,
      email: user.email,
      isActive: user.isActive,
      message: "User deactivated successfully",
    };
  }

  // Reactivate user
  async reactivateUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.isActive) {
      throw new Error("User is already active");
    }

    user.isActive = true;
    user.deactivatedAt = undefined;
    user.deactivationReason = undefined;
    await user.save();

    // Send reactivation notification
    await EmailService.sendReactivationEmail(user);

    return {
      userId: user._id,
      email: user.email,
      isActive: user.isActive,
      message: "User reactivated successfully",
    };
  }

  // Delete user account (permanent deletion)
  async deleteUser(userId, reason, requestingAdminId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Prevent deletion of other admins or self
    if (user.role === "admin") {
      throw new Error("Cannot delete admin accounts");
    }

    if (userId === requestingAdminId.toString()) {
      throw new Error("Cannot delete your own account");
    }

    // Log the deletion action
    await this.logAdminActivity(requestingAdminId, "delete", "User", userId, {
      description: `Deleted user ${user.email}`,
      reason: reason || "No reason provided",
      deletedUser: {
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });

    // Delete associated profile first
    await this.deleteUserProfile(userId, user.role);

    // Delete the user
    await User.findByIdAndDelete(userId);

    return {
      userId,
      email: user.email,
      message: "User account deleted successfully",
    };
  }

  // Delete user profile based on role
  async deleteUserProfile(userId, role) {
    switch (role) {
      case "guest":
        await GuestProfile.findOneAndDelete({ userId });
        break;
      case "staff":
        await StaffProfile.findOneAndDelete({ userId });
        break;
      case "manager":
        await ManagerProfile.findOneAndDelete({ userId });
        break;
      case "admin":
        await AdminProfile.findOneAndDelete({ userId });
        break;
    }
  }

  // Get user details with profile
  async getUserDetails(userId) {
    const user = await User.findById(userId)
      .select(
        "-password -otp -passwordResetToken -passwordResetExpiry -tokenVersion"
      )
      .populate("approvedBy", "name email");

    if (!user) {
      throw new Error("User not found");
    }

    // Get role-specific profile
    let profile = null;
    switch (user.role) {
      case "guest":
        profile = await GuestProfile.findOne({ userId }).select("-userId");
        break;
      case "staff":
        profile = await StaffProfile.findOne({ userId }).select("-userId");
        break;
      case "manager":
        profile = await ManagerProfile.findOne({ userId }).select("-userId");
        break;
      case "admin":
        profile = await AdminProfile.findOne({ userId }).select("-userId");
        break;
    }

    return {
      user,
      profile,
    };
  }

  // Update user profile
  async updateUserProfile(userId, updates, requestingAdminId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Update basic user fields
    const allowedUserFields = ["name", "phone", "address"];
    const userUpdates = {};
    allowedUserFields.forEach((field) => {
      if (updates[field] !== undefined) {
        userUpdates[field] = updates[field];
      }
    });

    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(userId, userUpdates);
    }

    // Update role-specific profile
    const profileUpdates = updates.profile || {};
    if (Object.keys(profileUpdates).length > 0) {
      await this.updateRoleSpecificProfile(userId, user.role, profileUpdates);
    }

    // Log the update action
    await this.logAdminActivity(requestingAdminId, "update", "User", userId, {
      description: `Updated user profile for ${user.email}`,
      updates: { ...userUpdates, profile: profileUpdates },
    });

    return {
      userId,
      message: "User profile updated successfully",
    };
  }

  // Update role-specific profile
  async updateRoleSpecificProfile(userId, role, updates) {
    switch (role) {
      case "guest":
        await GuestProfile.findOneAndUpdate({ userId }, updates);
        break;
      case "staff":
        await StaffProfile.findOneAndUpdate({ userId }, updates);
        break;
      case "manager":
        await ManagerProfile.findOneAndUpdate({ userId }, updates);
        break;
      case "admin":
        await AdminProfile.findOneAndUpdate({ userId }, updates);
        break;
    }
  }

  // Get user activity logs
  async getUserActivityLogs(userId, { page = 1, limit = 20 }) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get login history from user
    const loginHistory = user.loginHistory
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice((page - 1) * limit, page * limit);

    // Get admin actions related to this user
    const adminProfile = await AdminProfile.findOne({ userId }).select(
      "activityLogs"
    );
    const adminLogs =
      adminProfile?.activityLogs
        .filter((log) => log.entityId.toString() === userId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10) || [];

    return {
      loginHistory,
      adminActions: adminLogs,
      pagination: {
        page,
        limit,
        total: user.loginHistory.length,
        pages: Math.ceil(user.loginHistory.length / limit),
      },
    };
  }

  // Reset user password (admin action)
  async resetUserPassword(
    userId,
    temporaryPassword,
    requirePasswordChange,
    requestingAdminId
  ) {
    const user = await User.findById(userId).select(
      "+isActive +tokenVersion +password"
    );

    if (!user) {
      throw new Error("User not found");
    }

    if (user.authProviders && user.authProviders.length > 0) {
      throw new Error(
        "This account uses social login and cannot be reset by admin."
      );
    }

    const newPassword = temporaryPassword || this.generateTemporaryPassword();
    console.log("🔐 New password:", newPassword);

    user.password = newPassword;
    user.markModified("password"); // Ensure pre-save hook triggers hashing

    user.isActive = true;
    user.passwordResetPending = requirePasswordChange;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;

    try {
      await user.save();
    } catch (saveError) {
      throw new Error("Failed to save updated user: " + saveError.message);
    }

    try {
      await EmailService.sendAdminPasswordResetEmail(user, newPassword);
    } catch (emailError) {
      logger.error("Failed to send admin password reset email", {
        userId,
        error: emailError.message,
      });
    }

    await this.logAdminActivity(requestingAdminId, "update", "User", userId, {
      description: `Reset password for user ${user.email}`,
      requirePasswordChange,
    });

    return {
      userId,
      temporaryPassword: newPassword,
      message: "Password reset successfully",
    };
  }

  // Generate temporary password
  generateTemporaryPassword() {
    const length = 12;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  async updateUserPassword(userId, newPassword) {
    const user = await User.findById(userId).select("+tokenVersion");
    if (!user) {
      throw new Error("User not found");
    }
    user.password = newPassword; // Pre-save hook will hash it
    user.isActive = true; // Reactivate account
    user.passwordResetPending = false; // Clear flag
    user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate sessions
    await user.save();
    return {
      userId,
      message: "Password updated successfully",
    };
  }

  // Log admin activity
  async logAdminActivity(adminId, action, entityType, entityId, details = {}) {
    try {
      const adminProfile = await AdminProfile.findOne({ userId: adminId });
      if (adminProfile) {
        adminProfile.activityLogs.push({
          action,
          entityType,
          entityId,
          description: details.description || `${action} ${entityType}`,
          ipAddress: details.ipAddress || "Unknown",
          userAgent: details.userAgent || "Unknown",
          timestamp: new Date(),
        });
        await adminProfile.save();
      }
    } catch (error) {
      console.error("Failed to log admin activity:", error);
      // Don't throw - logging failure shouldn't break the main operation
    }
  }

  // Get admin dashboard statistics
  async getDashboardStats() {
    const [
      totalUsers,
      pendingApprovals,
      activeUsers,
      usersByRole,
      recentRegistrations,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isApproved: false, role: { $ne: "guest" } }),
      User.countDocuments({ isActive: true }),
      User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      User.find()
        .select("name email role createdAt")
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    return {
      totalUsers,
      pendingApprovals,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentRegistrations,
    };
  }

  // Refund Management Methods

  // Get all refunds with optional status filtering
  async getRefunds({ status = null, search = null } = {}) {
    const query = {};

    // Filter by status if provided
    if (status && status !== 'all') {
      query.status = status;
    }

    // Add search functionality
    if (search) {
      const refunds = await RefundRequest.find(query)
        .populate("bookingId", "bookingNumber")
        .populate("guestId", "name email")
        .populate("invoiceId", "invoiceNumber")
        .sort({ createdAt: -1 });

      // Filter by search term
      const filteredRefunds = refunds.filter(refund =>
        refund.bookingId?.bookingNumber?.toLowerCase().includes(search.toLowerCase()) ||
        refund.guestId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        refund.guestId?.email?.toLowerCase().includes(search.toLowerCase()) ||
        refund.reason?.toLowerCase().includes(search.toLowerCase())
      );

      return filteredRefunds;
    }

    const refunds = await RefundRequest.find(query)
      .populate("bookingId", "bookingNumber")
      .populate("guestId", "name email")
      .populate("invoiceId", "invoiceNumber")
      .sort({ createdAt: -1 });

    return refunds;
  }

  async getRefundDetails(refundId) {
    const refund = await RefundRequest.findById(refundId)
      .populate("bookingId", "bookingNumber")
      .populate("guestId", "name email")
      .populate("invoiceId", "invoiceNumber");

    if (!refund) {
      throw new Error("Refund not found");
    }

    return refund;
  }

  async approveRefund(refundId, requestingAdminId) {
    const refund = await RefundRequest.findById(refundId)
      .populate("bookingId", "bookingNumber")
      .populate("guestId", "name email")
      .populate("invoiceId", "invoiceNumber");

    if (!refund) {
      throw new Error("Refund not found");
    }

    if (refund.status !== "pending") {
      throw new Error("Refund is not pending");
    }

    refund.status = "approved";
    refund.approvedBy = requestingAdminId;
    refund.approvedAt = new Date();

    await refund.save();

    // Send approval notification
    try {
      const approver = await User.findById(requestingAdminId).select(
        "name email"
      );
      await RefundNotificationService.sendRefundApproved(
        refund.guestId,
        refund,
        approver
      );
    } catch (notificationError) {
      logger.error("Failed to send refund approval notification", {
        refundId,
        error: notificationError.message,
      });
      // Don't fail the approval if notification fails
    }

    return refund;
  }

  async denyRefund(refundId, reason, requestingAdminId) {
    const refund = await RefundRequest.findById(refundId)
      .populate("bookingId", "bookingNumber")
      .populate("guestId", "name email")
      .populate("invoiceId", "invoiceNumber");

    if (!refund) {
      throw new Error("Refund not found");
    }

    if (refund.status !== "pending") {
      throw new Error("Refund is not pending");
    }

    refund.status = "denied";
    refund.denialReason = reason;
    refund.deniedBy = requestingAdminId;
    refund.deniedAt = new Date();

    await refund.save();

    // Send denial notification
    try {
      const denier = await User.findById(requestingAdminId).select(
        "name email"
      );
      await RefundNotificationService.sendRefundDenied(
        refund.guestId,
        refund,
        denier
      );
    } catch (notificationError) {
      logger.error("Failed to send refund denial notification", {
        refundId,
        error: notificationError.message,
      });
      // Don't fail the denial if notification fails
    }

    return refund;
  }

  async requestMoreInfo(refundId, infoRequested, requestingAdminId) {
    const refund = await RefundRequest.findById(refundId)
      .populate("bookingId", "bookingNumber")
      .populate("guestId", "name email")
      .populate("invoiceId", "invoiceNumber");

    if (!refund) {
      throw new Error("Refund not found");
    }

    if (refund.status !== "pending") {
      throw new Error("Refund is not pending");
    }

    refund.status = "info_requested";
    refund.infoRequested = infoRequested;
    refund.infoRequestedBy = requestingAdminId;
    refund.infoRequestedAt = new Date();

    await refund.save();

    // Send info request notification
    try {
      await RefundNotificationService.sendRefundInfoRequested(
        refund.guestId,
        refund
      );
    } catch (notificationError) {
      logger.error("Failed to send refund info request notification", {
        refundId,
        error: notificationError.message,
      });
      // Don't fail the request if notification fails
    }

    return refund;
  }

  async processRefund(refundId, originalPaymentId) {
    const refund = await RefundRequest.findById(refundId)
      .populate("bookingId", "bookingNumber")
      .populate("guestId", "name email")
      .populate("invoiceId", "invoiceNumber totalAmount");

    if (!refund) {
      throw new Error("Refund not found");
    }

    if (refund.status !== "approved") {
      throw new Error("Refund is not approved");
    }

    try {
      logger.info("Processing refund through PayHere", {
        refundId,
        amount: refund.amount,
        originalPaymentId,
      });

      // Validate refund eligibility
      const eligibilityCheck = PaymentService.validateRefundEligibility({
        paymentDate: refund.invoiceId?.createdAt || refund.createdAt,
        paymentStatus: "completed",
        amount: refund.invoiceId?.totalAmount || refund.amount,
        refundAmount: refund.amount,
      });

      if (!eligibilityCheck.isEligible) {
        refund.status = "failed";
        refund.failureReason = eligibilityCheck.errors.join(", ");
        await refund.save();

        logger.error("Refund eligibility check failed", {
          refundId,
          errors: eligibilityCheck.errors,
        });

        throw new Error(
          `Refund not eligible: ${eligibilityCheck.errors.join(", ")}`
        );
      }

      // Process refund through PayHere
      const paymentResult = await PaymentService.processRefund({
        originalPaymentId: originalPaymentId || refund.paymentGatewayRef,
        refundAmount: refund.amount,
        refundReason: refund.reason,
        refundReference: `REF_${refund._id}_${Date.now()}`,
        currency: refund.currency || "LKR",
      });

      if (paymentResult.success) {
        // Update refund record with successful processing
        refund.status = "processed";
        refund.paymentGatewayRef = paymentResult.refundId;
        refund.processedAt = new Date();
        refund.gatewayResponse = paymentResult.gatewayResponse;

        logger.info("Refund processed successfully", {
          refundId,
          paymentGatewayRef: paymentResult.refundId,
          amount: refund.amount,
        });

        // Send notification to guest about successful refund
        try {
          await EmailService.sendRefundProcessedEmail(refund.guestId, {
            refundId: refund._id,
            amount: refund.amount,
            currency: refund.currency || "LKR",
            bookingNumber: refund.bookingId?.bookingNumber,
            processedAt: refund.processedAt,
            estimatedArrival: "3-5 business days",
          });
        } catch (emailError) {
          logger.error("Failed to send refund processed email", {
            refundId,
            error: emailError.message,
          });
          // Don't fail the refund process if email fails
        }
      } else {
        // Update refund record with failure
        refund.status = "failed";
        refund.failureReason =
          paymentResult.error || "Payment gateway processing failed";
        refund.gatewayResponse = paymentResult.gatewayResponse;

        logger.error("Refund processing failed", {
          refundId,
          error: paymentResult.error,
          errorCode: paymentResult.errorCode,
        });

        // Send notification to admin about failed refund
        try {
          await EmailService.sendRefundFailedNotification({
            refundId: refund._id,
            amount: refund.amount,
            error: paymentResult.error,
            bookingNumber: refund.bookingId?.bookingNumber,
            guestEmail: refund.guestId?.email,
          });
        } catch (emailError) {
          logger.error("Failed to send refund failed notification", {
            refundId,
            error: emailError.message,
          });
        }
      }

      await refund.save();
      return refund;
    } catch (error) {
      // Handle unexpected errors
      refund.status = "failed";
      refund.failureReason =
        error.message || "Unexpected error during refund processing";
      await refund.save();

      logger.error("Unexpected error during refund processing", {
        refundId,
        error: error.message,
        stack: error.stack,
      });

      throw error;
    }
  }

  // Add method to check refund status
  async checkRefundStatus(refundId) {
    const refund = await RefundRequest.findById(refundId);

    if (!refund) {
      throw new Error("Refund not found");
    }

    if (refund.status === "processed" && refund.paymentGatewayRef) {
      try {
        const statusResult = await PaymentService.checkRefundStatus(
          refund.paymentGatewayRef
        );

        if (statusResult.success) {
          // Update local status if needed
          if (statusResult.status !== refund.status) {
            refund.status = statusResult.status;
            refund.gatewayResponse = statusResult.gatewayResponse;
            await refund.save();
          }
        }

        return {
          ...refund.toObject(),
          gatewayStatus: statusResult,
        };
      } catch (error) {
        logger.error("Failed to check refund status with PayHere", {
          refundId,
          error: error.message,
        });

        return refund;
      }
    }

    return refund;
  }
}

export default new AdminService();
