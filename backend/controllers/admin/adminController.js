// 📁 backend/controllers/admin/adminController.js
import User from "../../models/User.js";
import Invitation from "../../models/Invitation.js";
import AdminProfile from "../../models/profiles/AdminProfile.js";
import StaffProfile from "../../models/profiles/StaffProfile.js";
import ManagerProfile from "../../models/profiles/ManagerProfile.js";
import { sendEmail } from "../../services/notification/emailService.js";
import crypto from "crypto";

// Create user with privileged role
export const createPrivilegedUser = async (req, res) => {
  try {
    const { name, email, password, phone, role, permissions } = req.body;
    const requestingAdmin = req.user;

    // Validate role
    if (!["staff", "manager", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role for privileged user creation",
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Create user (auto-approved since created by admin)
    const user = new User({
      name,
      email,
      password, // Password should be pre-hashed by the frontend or hashed here
      phone,
      role,
      isApproved: true,
      approvedBy: requestingAdmin._id,
      approvedAt: new Date(),
    });

    await user.save();

    // Create role-specific profile
    switch (role) {
      case "staff":
        await StaffProfile.create({ userId: user._id, isActive: true });
        break;
      case "manager":
        await ManagerProfile.create({ userId: user._id });
        break;
      case "admin":
        await AdminProfile.create({
          userId: user._id,
          permissions: permissions || ["view-reports"],
        });
        break;
    }

    // Send welcome email with temporary password
    await sendEmail({
      to: email,
      subject: "Your Hotel Management System Account",
      html: `
        <h2>Account Created</h2>
        <p>Hi ${name},</p>
        <p>An admin has created an account for you with ${role} privileges.</p>
        <p>Please login using your email and the temporary password provided to you.</p>
        <p>You'll be prompted to change your password on first login.</p>
      `,
    });

    res.status(201).json({
      success: true,
      message: `${role} user created successfully`,
      data: {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Create privileged user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: error.message,
    });
  }
};

// Approve pending user
export const approveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, permissions } = req.body; // Optional role update during approval
    const requestingAdmin = req.user;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if already approved
    if (user.isApproved) {
      return res.status(400).json({
        success: false,
        message: "User is already approved",
      });
    }

    // Update role if provided (and different from current)
    if (
      role &&
      role !== user.role &&
      ["staff", "manager", "admin"].includes(role)
    ) {
      user.role = role;
    }

    // Approve the user
    user.isApproved = true;
    user.approvedBy = requestingAdmin._id;
    user.approvedAt = new Date();
    await user.save();

    // Create or update role-specific profile
    if (user.role !== "guest") {
      switch (user.role) {
        case "staff":
          await StaffProfile.findOneAndUpdate(
            { userId: user._id },
            { isActive: true },
            { upsert: true, new: true }
          );
          break;
        case "manager":
          await ManagerProfile.findOneAndUpdate(
            { userId: user._id },
            {},
            { upsert: true, new: true }
          );
          break;
        case "admin":
          await AdminProfile.findOneAndUpdate(
            { userId: user._id },
            { permissions: permissions || ["view-reports"] },
            { upsert: true, new: true }
          );
          break;
      }
    }

    // Send approval notification
    await sendEmail({
      to: user.email,
      subject: "Your Account Has Been Approved",
      html: `
        <h2>Account Approved</h2>
        <p>Hi ${user.name},</p>
        <p>Your ${user.role} account has been approved by an administrator.</p>
        <p>You can now login and access all features available to your role.</p>
      `,
    });

    res.json({
      success: true,
      message: "User approved successfully",
      data: {
        userId: user._id,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
      },
    });
  } catch (error) {
    console.error("Approve user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve user",
      error: error.message,
    });
  }
};

// Create Invitation
export const createInvitation = async (req, res) => {
  try {
    const { email, role, expiresInHours = 24 } = req.body;
    console.log("📨 Incoming invitation:", { email, role, expiresInHours });

    const token = crypto.randomBytes(32).toString("hex");
    console.log("🔑 Generated token:", token);

    const invitation = new Invitation({
      email,
      role,
      token,
      createdBy: req.user?._id,
      expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
    });

    console.log("📦 Saving invitation...");
    await invitation.save();
    console.log("✅ Invitation saved");

    const inviteUrl = `${process.env.FRONTEND_URL}/invite?token=${token}`;
    console.log("📧 Sending email to:", email);

    await sendEmail({
      to: email,
      subject: "You're Invited to Join Our System",
      html: `
        <h2>Join Our Team</h2>
        <p>You've been invited as a ${role}.</p>
        <a href="${inviteUrl}">Complete Registration</a>
        <p>Link expires in ${expiresInHours} hours</p>
      `,
    });

    console.log("✅ Email sent");

    res.status(201).json({
      success: true,
      message: "Invitation sent",
    });
  } catch (error) {
    console.error("❌ Error creating invitation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create invitation",
    });
  }
};

// 🔄 Update Invitation
export const updateInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const invitation = await Invitation.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!invitation) {
      return res
        .status(404)
        .json({ success: false, message: "Invitation not found" });
    }

    res.json({ success: true, data: invitation });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update invitation" });
  }
};

// ❌ Delete Invitation
export const deleteInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Invitation.findByIdAndDelete(id);

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Invitation not found" });
    }

    res.json({ success: true, message: "Invitation deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete invitation" });
  }
};

// 🔍 Filter Invitations
export const getInvitations = async (req, res) => {
  try {
    const { status, email } = req.query;
    const query = {};

    if (status === "active") {
      query.used = false;
      query.expiresAt = { $gt: new Date() };
    } else if (status === "expired") {
      query.expiresAt = { $lt: new Date() };
    } else if (status === "used") {
      query.used = true;
    }

    if (email) {
      query.email = { $regex: email, $options: "i" };
    }

    const invitations = await Invitation.find(query);
    res.json({ success: true, data: invitations });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to get invitations" });
  }
};

// Get pending approvals
export const getPendingApprovals = async (req, res) => {
  try {
    const pendingUsers = await User.find({
      isApproved: false,
      role: { $ne: "guest" },
      emailVerified: true,
    }).select("-password");

    res.json({
      success: true,
      data: pendingUsers,
    });
  } catch (error) {
    console.error("Get pending approvals error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get pending approvals",
      error: error.message,
    });
  }
};

// Additional admin functions
export const getUsers = async (req, res) => {
  // Implementation to get all users with filtering/pagination
};

export const updateUserRole = async (req, res) => {
  // Implementation to update user role
};

export const deactivateUser = async (req, res) => {
  // Implementation to deactivate user
};
