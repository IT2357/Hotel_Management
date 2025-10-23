import mongoose from "mongoose";
import { User } from "../../models/User.js";
import StaffProfile from "../../models/profiles/StaffProfile.js";
import StaffNotification from "../../models/StaffNotification.js";
import StaffTask from "../../models/StaffTask.js";
import { getIO } from "../../utils/socket.js";

// Normalize incoming status values to StaffTask schema (lowercase)
const STATUS_MAP = {
  pending: "pending",
  queued: "pending",
  assigned: "assigned",
  inprogress: "in_progress",
  "in-progress": "in_progress",
  "in_progress": "in_progress",
  active: "in_progress",
  completed: "completed",
  done: "completed",
  finished: "completed",
  cancelled: "cancelled",
  canceled: "cancelled",
};

// Normalize incoming priority values to StaffTask (lowercase)
const PRIORITY_MAP = {
  low: "low",
  normal: "medium",
  medium: "medium",
  moderate: "medium",
  high: "high",
  urgent: "urgent",
  critical: "urgent",
};

// Map various inputs to StaffTask department enum
// StaffTask departments: ["Housekeeping", "Kitchen", "Maintenance", "Service"]
const DEPARTMENT_MAP = {
  housekeeping: "Housekeeping",
  cleaning: "Housekeeping",
  "cleaning staff": "Housekeeping",
  kitchen: "Kitchen",
  food: "Kitchen",
  "kitchen staff": "Kitchen",
  maintenance: "Maintenance",
  engineering: "Maintenance",
  service: "Service",
  services: "Service",
  "guest services": "Service",
  concierge: "Service",
  "room service": "Service",
  "front desk": "Service",
  reception: "Service",
};

// Map to StaffTask category enum
const CATEGORY_ALLOWED = new Set([
  "electrical",
  "plumbing",
  "hvac",
  "appliance",
  "structural",
  "general",
  "food_preparation",
  "cooking",
  "cleaning",
  "inventory",
  "equipment",
  "guest_request",
  "room_service",
  "concierge",
  "transportation",
  "event",
  "laundry",
  "restocking",
  "inspection",
  "deep_cleaning",
]);

const ALLOWED_SORT_FIELDS = new Set(["createdAt", "dueDate", "priority", "status"]);

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value));

const toTitleCase = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeDepartment = (value) => {
  if (!value) return "Service";
  const normalized = String(value).trim().toLowerCase();
  if (DEPARTMENT_MAP[normalized]) return DEPARTMENT_MAP[normalized];
  // If already one of StaffTask enums, keep
  const maybe = toTitleCase(value);
  return ["Housekeeping", "Kitchen", "Maintenance", "Service"].includes(maybe)
    ? maybe
    : "Service";
};

const inferCategoryFromDepartment = (department) => {
  const normalized = String(department).trim().toLowerCase();
  if (normalized === "kitchen") return "food_preparation";
  if (normalized === "housekeeping" || normalized === "cleaning") return "cleaning";
  if (normalized === "maintenance") return "general";
  return "guest_request";
};

const normalizeCategory = (value, department) => {
  if (!value) return inferCategoryFromDepartment(department || "");
  const normalized = String(value).trim().toLowerCase().replace(/[-\s]+/g, "_");
  return CATEGORY_ALLOWED.has(normalized) ? normalized : inferCategoryFromDepartment(department || "");
};

const normalizePriority = (value) => {
  if (!value) return "medium";
  const normalized = String(value).trim().toLowerCase();
  return PRIORITY_MAP[normalized] || "medium";
};

const normalizeStatus = (value) => {
  if (!value) return "pending";
  const normalized = String(value).trim().toLowerCase();
  return STATUS_MAP[normalized] || "pending";
};

const parseDate = (value) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const extractUserId = (user) => user?._id || user?.id || user?.userId;

// For StaffTask we won't compute AI staff recommendations here; provide a simple placeholder
const ensureRecommendations = (task) => {
  const fallbackName = task.assignedTo?.name || "Available Staff";
  return [
    {
      name: fallbackName,
      role: task.department || "Staff Member",
      match: 80,
    },
  ];
};

const formatAssignmentHistory = (history) =>
  (history || []).map((entry) => ({
    assignedTo: entry.assignedTo ? String(entry.assignedTo) : undefined,
    assignedName: entry.assignedName || "",
    assignedAt: entry.assignedAt,
    assignedBy: entry.assignedBy ? String(entry.assignedBy) : undefined,
    notes: entry.notes,
  }));

const buildTaskResponse = (taskDoc) => {
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
    recommendedStaff: ensureRecommendations({ ...task, assignedTo: assigned }),
    aiRecommendationScore: undefined,
    assignedTo: assigned,
    assignmentHistory: formatAssignmentHistory(task.assignmentHistory),
    notes: Array.isArray(task.notes)
      ? { manager: task.notes.map(n => n.content).join("\n") }
      : task.notes || {},
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
};

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

    const filters = {};

    if (status) {
      filters.status = normalizeStatus(status);
    }

    if (department) {
      filters.department = normalizeDepartment(department);
    }

    if (priority) {
      filters.priority = normalizePriority(priority);
    }

    if (search) {
      const regex = new RegExp(String(search).trim(), "i");
      filters.$or = [
        { title: regex },
        { description: regex },
        { location: regex },
        { roomNumber: regex },
      ];
    }

    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);

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

    res.status(200).json({
      success: true,
      data: {
        tasks: tasks.map(buildTaskResponse),
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

    res.status(200).json({ success: true, data: buildTaskResponse(task) });
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
      data: buildTaskResponse(populatedTask),
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
    const responsePayload = buildTaskResponse(populatedTaskDoc);

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
      data: buildTaskResponse(populatedTask),
    });
  } catch (error) {
    console.error("manager:updateTaskStatus", error);
    res.status(500).json({ success: false, message: "Failed to update status" });
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

    res.status(200).json({ success: true, data: tasks.map(buildTaskResponse) });
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

const STAFF_PROFILE_DEPARTMENT_MAP = {
  cleaning: ["Housekeeping", "Cleaning"],
  maintenance: ["Maintenance"],
  service: ["Service", "Guest Services", "Concierge"],
  kitchen: ["Kitchen", "Food"],
};

export const getAvailableStaff = async (req, res) => {
  try {
    const department = normalizeDepartment(req.params.department);
    const lookupKey = String(department).toLowerCase();
    const profileDepartments = STAFF_PROFILE_DEPARTMENT_MAP[lookupKey] || [department];

    const staffProfiles = await StaffProfile.find({ department: { $in: profileDepartments }, isActive: true })
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
