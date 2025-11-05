/**
 * AI-Powered Staff Recommendation System
 * Computes optimal staff assignments based on workload, availability, and task requirements
 */

import { User } from "../../models/User.js";
import StaffProfile from "../../models/profiles/StaffProfile.js";
import StaffTask from "../../models/StaffTask.js";
import { STAFF_PROFILE_DEPARTMENT_MAP } from "./taskConstants.js";
import { toTitleCase } from "./taskUtils.js";

/**
 * Compute AI-powered staff recommendations for a task
 * @param {Object} task - Task object with department, priority, and assignment info
 * @returns {Promise<Array>} Array of recommended staff with match scores
 */
export const computeStaffRecommendations = async (task) => {
  try {
    // If already assigned, return the assigned staff as the top recommendation
    if (task.assignedTo && task.assignedTo._id) {
      return [
        {
          name: task.assignedTo.name || "Assigned Staff",
          staffId: String(task.assignedTo._id),
          role: task.assignedTo.role || task.department || "Staff Member",
          match: 100,
          email: task.assignedTo.email,
        },
      ];
    }

    // Find staff members from the same department
    const department = task.department;
    const lookupKey = String(department).toLowerCase();
    const profileDepartments = STAFF_PROFILE_DEPARTMENT_MAP[lookupKey] || [department];

    // Get staff profiles for this department
    const staffProfiles = await StaffProfile.find({
      department: { $in: profileDepartments },
      isActive: true,
    })
      .populate("userId", "name email role phone isActive")
      .lean();

    let availableStaff = staffProfiles
      .filter((profile) => profile.userId && profile.userId.role === "staff" && profile.userId.isActive !== false)
      .map((profile) => ({
        staffId: String(profile.userId._id),
        name: profile.userId.name,
        email: profile.userId.email,
        phone: profile.userId.phone || undefined,
        role: profile.position || profile.department,
        department: profile.department,
      }));

    // Fallback: if no profiles found, get all active staff
    if (availableStaff.length === 0) {
      const fallbackUsers = await User.find({ role: "staff", isActive: true })
        .select("name email phone")
        .lean();

      availableStaff = fallbackUsers.map((user) => ({
        staffId: String(user._id),
        name: user.name,
        email: user.email,
        phone: user.phone || undefined,
        role: toTitleCase(profileDepartments[0] || department || "Staff Member"),
        department: profileDepartments[0] || toTitleCase(department),
      }));
    }

    // If still no staff found, return empty array
    if (availableStaff.length === 0) {
      return [];
    }

    // Calculate match scores based on workload and priority
    const staffWithScores = await Promise.all(
      availableStaff.map(async (staff) => {
        // Get current workload for this staff member
        const activeTasksCount = await StaffTask.countDocuments({
          assignedTo: staff.staffId,
          status: { $in: ["pending", "assigned", "in_progress"] },
        });

        // Calculate match score (0-100)
        // Lower workload = higher match score
        let matchScore = 95 - activeTasksCount * 5; // Decrease score by 5 for each active task
        matchScore = Math.max(60, Math.min(99, matchScore)); // Keep between 60-99

        // Boost score for urgent/high priority tasks
        if (task.priority === "urgent" || task.priority === "high") {
          matchScore = Math.min(99, matchScore + 5);
        }

        return {
          ...staff,
          match: matchScore,
          currentWorkload: activeTasksCount,
        };
      })
    );

    // Sort by match score (highest first)
    staffWithScores.sort((a, b) => b.match - a.match);

    // Return top 3 recommendations
    return staffWithScores.slice(0, 3);
  } catch (error) {
    console.error("computeStaffRecommendations error:", error);
    return [];
  }
};

/**
 * Build complete task response with AI recommendations
 * @param {Object} taskDoc - Task document from database
 * @returns {Promise<Object>} Formatted task response with recommendations
 */
export const buildTaskResponse = async (taskDoc) => {
  if (!taskDoc) return null;
  const task = taskDoc.toObject ? taskDoc.toObject({ virtuals: true }) : taskDoc;

  const assigned = task.assignedTo
    ? {
        _id: task.assignedTo._id ? String(task.assignedTo._id) : String(task.assignedTo),
        name: task.assignedTo.name || task.assignedTo.fullName || "",
        email: task.assignedTo.email,
        role: task.assignedTo.role,
      }
    : null;

  // Get AI-powered staff recommendations
  const recommendedStaff = await computeStaffRecommendations({ ...task, assignedTo: assigned });

  const { formatAssignmentHistory } = await import("./taskUtils.js");

  return {
    _id: String(task._id),
    title: task.title,
    description: task.description || "",
    department: task.department,
    type: task.category || "general",
    priority: task.priority,
    status: task.status,
    location: task.location,
    roomNumber: task.roomNumber,
    dueDate: task.dueDate,
    estimatedDuration: task.estimatedDuration,
    tags: task.tags || [],
    recommendedStaff,
    aiRecommendationScore: recommendedStaff[0]?.match || undefined,
    assignedTo: assigned,
    assignmentHistory: formatAssignmentHistory(task.assignmentHistory),
    notes: Array.isArray(task.notes)
      ? { manager: task.notes.map(n => n.content).join("\n") }
      : task.notes || {},
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
};

/**
 * Get available staff for a specific department
 * @param {string} department - Department name
 * @returns {Promise<Array>} Array of available staff members
 */
export const getStaffByDepartment = async (department) => {
  const lookupKey = String(department).toLowerCase();
  const profileDepartments = STAFF_PROFILE_DEPARTMENT_MAP[lookupKey] || [department];

  const staffProfiles = await StaffProfile.find({ 
    department: { $in: profileDepartments }, 
    isActive: true 
  })
    .populate("userId", "name email role phone isActive")
    .lean();

  let staff = staffProfiles
    .filter((profile) => profile.userId && profile.userId.role === "staff" && profile.userId.isActive !== false)
    .map((profile) => ({
      staffId: String(profile.userId._id),
      name: profile.userId.name,
      email: profile.userId.email,
      phone: profile.userId.phone || undefined,
      role: profile.position,
      department: profile.department,
    }));

  // Fallback to all active staff if no profiles found
  if (staff.length === 0) {
    const fallbackUsers = await User.find({ role: "staff", isActive: true })
      .select("name email phone")
      .lean();

    staff = fallbackUsers.map((user) => ({
      staffId: String(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone || undefined,
      role: toTitleCase(profileDepartments[0] || department || "Staff Member"),
      department: profileDepartments[0] || toTitleCase(department),
    }));
  }

  return staff;
};
