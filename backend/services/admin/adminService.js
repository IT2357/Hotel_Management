// 📁 backend/services/admin/adminService.js
import crypto from "crypto";
import { User } from "../../models/User.js";
import Invitation from "../../models/Invitation.js";
import AdminProfile from "../../models/profiles/AdminProfile.js";
import StaffProfile from "../../models/profiles/StaffProfile.js";
import ManagerProfile from "../../models/profiles/ManagerProfile.js";
import GuestProfile from "../../models/profiles/GuestProfile.js";
import EmailService from "../notification/emailService.js";

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
          permissions: permissions || ["view-reports"],
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
          { permissions: permissions || ["view-reports"] },
          options
        );
      default:
        throw new Error(`Invalid role: ${role}`);
    }
  }

  // Create invitation
  async createInvitation({ email, role, expiresInHours = 24, createdBy }) {
    // Check if invitation already exists
    const existingInvitation = await Invitation.findOne({
      email,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (existingInvitation) {
      throw new Error("Active invitation already exists for this email");
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");

    // Create invitation
    const invitation = new Invitation({
      email,
      role,
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

    const total = await User.countDocuments(query);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Update user role
  async updateUserRole(userId, newRole, permissions, requestingAdminId) {
    if (!["guest", "staff", "manager", "admin"].includes(newRole)) {
      throw new Error("Invalid role");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const oldRole = user.role;
    user.role = newRole;

    // If promoting to privileged role, require approval
    if (oldRole === "guest" && newRole !== "guest") {
      user.isApproved = false;
      user.approvedBy = undefined;
      user.approvedAt = undefined;
    }

    await user.save();

    // Update or create role-specific profile
    if (newRole !== "guest") {
      await this.updateOrCreateRoleProfile(userId, newRole, permissions);
    }

    return {
      userId: user._id,
      oldRole,
      newRole,
      isApproved: user.isApproved,
      message: `User role updated from ${oldRole} to ${newRole}`,
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
    const user = await User.findById(userId).select("+tokenVersion");
    if (!user) {
      throw new Error("User not found");
    }

    // Generate temporary password if not provided
    const newPassword = temporaryPassword || this.generateTemporaryPassword();

    // Update password
    user.password = newPassword; // Pre-save hook will hash it
    user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate existing sessions

    if (requirePasswordChange) {
      user.mustChangePassword = true;
    }

    await user.save();

    // Log the action
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
}

export default new AdminService();
