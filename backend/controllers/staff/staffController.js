// 📁 backend/controllers/staff/staffController.js
import StaffProfile from "../../models/profiles/StaffProfile.js";
import { User } from "../../models/User.js";
import { formatResponse } from "../../utils/responseFormatter.js";
import logger from "../../utils/logger.js";

// Get current user's staff profile
export const getMyProfile = async (req, res) => {
  try {
    const { userId } = req.user;

    const profile = await StaffProfile.findOne({ userId })
      .populate("userId", "name email phone")
      .populate("assignedRooms", "roomNumber type");

    if (!profile) {
      return res.status(404).json(formatResponse(false, "Staff profile not found"));
    }

    res.json(formatResponse(true, "Profile retrieved successfully", profile));
  } catch (error) {
    logger.error("Error getting staff profile:", error);
    res.status(500).json(formatResponse(false, "Failed to get profile", null, error.message));
  }
};

// Update current user's staff profile
export const updateMyProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    const updateData = req.body;

    // Remove fields that shouldn't be updated by staff
    delete updateData.userId;
    delete updateData.isActive;
    delete updateData.approvedBy;
    delete updateData.approvedAt;

    const profile = await StaffProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json(formatResponse(false, "Staff profile not found"));
    }

    // Update profile
    Object.assign(profile, updateData);
    await profile.save();

    // If a profilePicture URL was provided, upsert it to the base User as well
    if (typeof updateData.profilePicture === "string") {
      await User.findByIdAndUpdate(userId, { profilePicture: updateData.profilePicture });
    }

    const updatedProfile = await StaffProfile.findOne({ userId })
      .populate("userId", "name email phone")
      .populate("assignedRooms", "roomNumber type");

    res.json(formatResponse(true, "Profile updated successfully", updatedProfile));
  } catch (error) {
    logger.error("Error updating staff profile:", error);
    res.status(500).json(formatResponse(false, "Failed to update profile", null, error.message));
  }
};

// Get colleagues in the same department
export const getColleagues = async (req, res) => {
  try {
    const { userId } = req.user;
    const { department, page = 1, limit = 20 } = req.query;

    // Get current user's department
    const currentUserProfile = await StaffProfile.findOne({ userId });
    if (!currentUserProfile) {
      return res.status(404).json(formatResponse(false, "Staff profile not found"));
    }

    const filter = {
      isActive: true,
      department: department || currentUserProfile.department
    };

    const skip = (page - 1) * limit;

    const colleagues = await StaffProfile.find(filter)
      .populate("userId", "name email phone profilePicture")
      .sort({ "performance.rating": -1, name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await StaffProfile.countDocuments(filter);

    res.json(formatResponse(true, "Colleagues retrieved successfully", {
      colleagues,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }));
  } catch (error) {
    logger.error("Error getting colleagues:", error);
    res.status(500).json(formatResponse(false, "Failed to get colleagues", null, error.message));
  }
};

// Get specific colleague profile
export const getColleagueProfile = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { userId } = req.user;

    // Check if the requested profile is in the same department
    const currentUserProfile = await StaffProfile.findOne({ userId });
    const colleagueProfile = await StaffProfile.findById(staffId)
      .populate("userId", "name email phone profilePicture")
      .populate("assignedRooms", "roomNumber type");

    if (!colleagueProfile) {
      return res.status(404).json(formatResponse(false, "Colleague profile not found"));
    }

    if (!currentUserProfile || currentUserProfile.department !== colleagueProfile.department) {
      return res.status(403).json(formatResponse(false, "Access denied"));
    }

    res.json(formatResponse(true, "Colleague profile retrieved successfully", colleagueProfile));
  } catch (error) {
    logger.error("Error getting colleague profile:", error);
    res.status(500).json(formatResponse(false, "Failed to get colleague profile", null, error.message));
  }
};