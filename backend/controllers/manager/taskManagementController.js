/**
 * Task Management Controller
 * Handles all task-related operations for managers
 */

import { User } from "../../models/User.js";
import StaffNotification from "../../models/StaffNotification.js";
import StaffTask from "../../models/StaffTask.js";
import { getIO } from "../../utils/socket.js";
import { ALLOWED_SORT_FIELDS } from "./taskConstants.js";
import {
  isValidObjectId,
  normalizeDepartment,
  normalizeCategory,
  normalizePriority,
  normalizeStatus,
  parseDate,
  extractUserId,
  sanitizePagination,
} from "./taskUtils.js";
import {
  computeStaffRecommendations,
  buildTaskResponse,
  getStaffByDepartment,
} from "./taskRecommendations.js";

export const getAllTasks = async (req, res) => {
  try {
    const {
      status,
      department,
      priority,
      search,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filters using utility function
    const { buildTaskFilters } = await import("./taskUtils.js");
    const filters = buildTaskFilters({ status, department, priority, search });

    // Sanitize pagination and sort parameters
    const { safeLimit, safePage } = sanitizePagination(page, limit);
    const sortField = ALLOWED_SORT_FIELDS.has(sortBy) ? sortBy : "createdAt";
    const sortDirection = String(sortOrder).toLowerCase() === "asc" ? 1 : -1;

    const query = StaffTask.find(filters)
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role")
      .sort({ [sortField]: sortDirection })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean();

    const [tasks, total] = await Promise.all([
      query,
      StaffTask.countDocuments(filters),
    ]);

    // Build task responses with AI recommendations
    const tasksWithRecommendations = await Promise.all(tasks.map(buildTaskResponse));

    res.status(200).json({
      success: true,
      data: {
        tasks: tasksWithRecommendations,
        pagination: {
          current: safePage,
          pages: Math.max(Math.ceil(total / safeLimit), 1),
          total,
          limit: safeLimit,
        },
      },
    });
  } catch (error) {
    console.error("manager:getAllTasks", error);
    res.status(500).json({ success: false, message: "Failed to fetch tasks" });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid task ID" });
    }

    const task = await StaffTask.findOne({ _id: id })
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role")
      .lean();

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    res.status(200).json({ success: true, data: await buildTaskResponse(task) });
  } catch (error) {
    console.error("manager:getTaskById", error);
    res.status(500).json({ success: false, message: "Failed to fetch task" });
  }
};

export const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      department,
      priority,
      status,
      type,
      dueDate,
      estimatedDuration,
      location,
      roomNumber,
      tags,
      notes,
      category,
      assignedTo,
      autoCreateFollowUp, // ✅ Kitchen → Service workflow
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    const creatorId = extractUserId(req.user);
    if (!creatorId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const safeDepartment = normalizeDepartment(department);
    const payload = {
      title: String(title).trim(),
      description: description ? String(description).trim() : "",
      department: safeDepartment,
      priority: normalizePriority(priority),
      status: normalizeStatus(status),
      category: normalizeCategory(category || type, safeDepartment),
      dueDate: parseDate(dueDate),
      estimatedDuration:
        estimatedDuration !== undefined && estimatedDuration !== null
          ? Math.max(Number(estimatedDuration), 0)
          : undefined,
      location: location ? String(location).trim().toLowerCase() : "",
      roomNumber: roomNumber ? String(roomNumber).trim() : undefined,
      tags: Array.isArray(tags) ? tags.map((tag) => String(tag).trim()).filter(Boolean) : undefined,
      notes: notes ? [{ content: String(notes?.manager || notes).trim(), addedBy: creatorId }] : [],
      createdBy: creatorId,
      assignedBy: creatorId,
      assignmentSource: "user",
      autoCreateFollowUp: autoCreateFollowUp === true, // ✅ Kitchen → Service workflow flag
    };

    if (assignedTo && isValidObjectId(assignedTo)) {
      payload.assignedTo = assignedTo;
      payload.status = "assigned";
      payload.assignmentHistory = [{
        assignedTo,
        assignedBy: creatorId,
        source: "user",
        assignedAt: new Date(),
        status: "assigned",
        notes: notes ? String(notes).trim() : undefined,
      }];
    }

    const task = await StaffTask.create(payload);
    const populatedTask = await StaffTask.findById(task._id)
      .populate("assignedTo", "name email role")
      .lean();

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: await buildTaskResponse(populatedTask),
    });
  } catch (error) {
    console.error("manager:createTask", error);
    res.status(500).json({ success: false, message: "Failed to create task" });
  }
};

export const assignTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { staffId, notes } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid task ID" });
    }

    if (!isValidObjectId(staffId)) {
      return res.status(400).json({ success: false, message: "Invalid staff ID" });
    }

    const [task, staff] = await Promise.all([
      StaffTask.findOne({ _id: id }),
      User.findOne({ _id: staffId, role: "staff", isActive: true }).lean(),
    ]);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }

    const managerId = extractUserId(req.user);

    task.assignedTo = staff._id;
    task.status = task.status === "completed" ? task.status : "assigned";
    task.assignmentHistory = task.assignmentHistory || [];
    task.assignmentHistory.push({
      assignedTo: staff._id,
      assignedBy: managerId,
      source: "user",
      assignedAt: new Date(),
      status: "assigned",
      notes: notes ? String(notes).trim() : undefined,
    });

    await task.save();
    const populatedTaskDoc = await StaffTask.findById(task._id).populate("assignedTo", "name email role");
    const responsePayload = await buildTaskResponse(populatedTaskDoc);

    try {
      const io = getIO();
      const staffIdString = String(staff._id);
      const assignmentPayload = {
        task: responsePayload,
        staffId: staffIdString,
        staffName: staff.name,
        managerId: managerId ? String(managerId) : undefined,
        assignedAt: new Date().toISOString(),
        notes: notes ? String(notes).trim() : undefined,
      };

      io.to(`staff-${staffIdString}`).emit("managerTaskAssigned", assignmentPayload);
      io.to(`user-${staffIdString}`).emit("managerTaskAssigned", assignmentPayload);
    } catch (socketError) {
      console.error("manager:assignTask socket emit failed", socketError);
    }

    // We already updated StaffTask directly; no shadow copy needed

    // Create notification for staff member
    try {
      const notificationData = {
        type: "task_assigned",
        title: `New Task Assigned: ${task.title}`,
        message: `You have been assigned a new ${task.priority} priority task: "${task.title}" in ${task.location || task.roomNumber || "general area"}.`,
        priority: task.priority === "Urgent" ? "high" : task.priority === "High" ? "medium" : "low",
        department: task.department,
        recipients: [{ userId: staff._id }],
        relatedTask: task._id,
        sender: managerId,
        actionRequired: true,
        actionUrl: `/staff/tasks/${task._id}`,
        metadata: {
          taskId: String(task._id),
          roomNumber: task.roomNumber || "",
          location: task.location || "",
          estimatedTime: task.estimatedDuration ? `${task.estimatedDuration} minutes` : "Not specified"
        }
      };

      await StaffNotification.create(notificationData);
      console.log(`Notification created for staff ${staff.name} (${staff._id})`);
    } catch (notificationError) {
      console.error("manager:assignTask notification creation failed", notificationError);
      // Don't fail the request if notification creation fails
    }

    res.status(200).json({
      success: true,
      message: "Task assigned successfully",
      data: responsePayload,
    });
  } catch (error) {
    console.error("manager:assignTask", error);
    res.status(500).json({ success: false, message: "Failed to assign task" });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, staffNotes } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid task ID" });
    }

    const task = await StaffTask.findOne({ _id: id });
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const normalizedStatus = normalizeStatus(status);

    if (normalizedStatus === "assigned" && !task.assignedTo) {
      return res.status(400).json({ success: false, message: "Assign staff before marking as Assigned" });
    }

    task.status = normalizedStatus;

    if (notes) {
      task.notes = task.notes || [];
      task.notes.push({ content: String(notes).trim(), addedBy: extractUserId(req.user) });
    }

    if (staffNotes) {
      task.notes = task.notes || [];
      task.notes.push({ content: String(staffNotes).trim(), addedBy: extractUserId(req.user) });
    }

    await task.save();
    const populatedTask = await StaffTask.findById(task._id).populate("assignedTo", "name email role");

    res.status(200).json({
      success: true,
      message: "Task status updated",
      data: await buildTaskResponse(populatedTask),
    });
  } catch (error) {
    console.error("manager:updateTaskStatus", error);
    res.status(500).json({ success: false, message: "Failed to update status" });
  }
};

export const cancelTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid task ID" });
    }

    const task = await StaffTask.findOne({ _id: id });

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const managerId = extractUserId(req.user);

    // Check if task is in a state where it can be cancelled/unassigned
    if (task.status === "completed") {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot cancel a completed task" 
      });
    }

    // If task is assigned or in progress, unassign it and return to pending
    if (task.assignedTo) {
      const previousStaff = task.assignedTo;
      
      // Clear assignment
      task.assignedTo = undefined;
      task.status = "pending";
      
      // Add note about cancellation
      task.notes = task.notes || [];
      task.notes.push({
        content: `Task unassigned from staff. Reason: ${reason || "Not accepted by staff"}`,
        addedBy: managerId,
      });

      // Add to assignment history
      task.assignmentHistory = task.assignmentHistory || [];
      task.assignmentHistory.push({
        assignedTo: previousStaff,
        assignedBy: managerId,
        source: "user",
        assignedAt: new Date(),
        status: "cancelled",
        notes: reason || "Task unassigned - staff did not accept",
      });

      await task.save();

      // Notify via socket
      try {
        const io = getIO();
        io.to(`staff-${String(previousStaff)}`).emit("taskCancelled", {
          taskId: String(task._id),
          reason: reason || "Manager unassigned the task",
        });
      } catch (socketError) {
        console.error("manager:cancelTask socket emit failed", socketError);
      }

      const populatedTask = await StaffTask.findById(task._id)
        .populate("assignedTo", "name email role");

      return res.status(200).json({
        success: true,
        message: "Task unassigned and returned to pending queue",
        data: await buildTaskResponse(populatedTask),
      });
    }

    // If task is pending (not assigned), just mark as cancelled
    task.status = "cancelled";
    task.notes = task.notes || [];
    task.notes.push({
      content: `Task cancelled. Reason: ${reason || "Cancelled by manager"}`,
      addedBy: managerId,
    });

    await task.save();

    const populatedTask = await StaffTask.findById(task._id)
      .populate("assignedTo", "name email role");

    res.status(200).json({
      success: true,
      message: "Task cancelled successfully",
      data: await buildTaskResponse(populatedTask),
    });
  } catch (error) {
    console.error("manager:cancelTask", error);
    res.status(500).json({ success: false, message: "Failed to cancel task" });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid task ID" });
    }

    const task = await StaffTask.findOneAndDelete({ _id: id });

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    res.status(200).json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("manager:deleteTask", error);
    res.status(500).json({ success: false, message: "Failed to delete task" });
  }
};

export const getMyTasks = async (req, res) => {
  try {
    const userId = extractUserId(req.user);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const tasks = await StaffTask.find({ assignedTo: userId })
      .sort({ dueDate: 1, createdAt: -1 })
      .populate("assignedTo", "name email role")
      .lean();

    const tasksWithRecommendations = await Promise.all(tasks.map(buildTaskResponse));
    res.status(200).json({ success: true, data: tasksWithRecommendations });
  } catch (error) {
    console.error("manager:getMyTasks", error);
    res.status(500).json({ success: false, message: "Failed to fetch your tasks" });
  }
};

export const getAllStaff = async (req, res) => {
  try {
    const staffMembers = await User.find({ role: "staff", isActive: true })
      .select("name email phone role")
      .lean();

    res.status(200).json({ success: true, data: staffMembers });
  } catch (error) {
    console.error("manager:getAllStaff", error);
    res.status(500).json({ success: false, message: "Failed to fetch staff" });
  }
};

export const getAvailableStaff = async (req, res) => {
  try {
    const department = normalizeDepartment(req.params.department);
    const staff = await getStaffByDepartment(department);
    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    console.error("manager:getAvailableStaff", error);
    res.status(500).json({ success: false, message: "Failed to fetch available staff" });
  }
};

export const getTaskStats = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;

    const matchStage = {};

    if (department) {
      matchStage.department = normalizeDepartment(department);
    }

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = parseDate(startDate);
      if (endDate) matchStage.createdAt.$lte = parseDate(endDate);
    }

    if (matchStage.createdAt) {
      if (!matchStage.createdAt.$gte) delete matchStage.createdAt.$gte;
      if (!matchStage.createdAt.$lte) delete matchStage.createdAt.$lte;
      if (Object.keys(matchStage.createdAt).length === 0) delete matchStage.createdAt;
    }

    const aggregation = await StaffTask.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const overview = {
      totalTasks: 0,
      pendingTasks: 0,
      assignedTasks: 0,
      inProgressTasks: 0,
      completedTasks: 0,
      cancelledTasks: 0,
    };

    aggregation.forEach((bucket) => {
      overview.totalTasks += bucket.count;
      switch (bucket._id) {
        case "pending":
          overview.pendingTasks = bucket.count;
          break;
        case "assigned":
          overview.assignedTasks = bucket.count;
          break;
        case "in_progress":
          overview.inProgressTasks = bucket.count;
          break;
        case "completed":
          overview.completedTasks = bucket.count;
          break;
        case "cancelled":
          overview.cancelledTasks = bucket.count;
          break;
        default:
          break;
      }
    });

    const departmentBreakdown = await StaffTask.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
            },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview,
        departmentBreakdown,
      },
    });
  } catch (error) {
    console.error("manager:getTaskStats", error);
    res.status(500).json({ success: false, message: "Failed to fetch task statistics" });
  }
};
