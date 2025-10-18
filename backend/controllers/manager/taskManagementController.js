import mongoose from "mongoose";
import ManagerTask, {
  TASK_DEPARTMENTS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TYPES,
} from "../../models/ManagerTask.js";
import { User } from "../../models/User.js";
import StaffProfile from "../../models/profiles/StaffProfile.js";

const STATUS_MAP = {
  pending: "Pending",
  queued: "Pending",
  assigned: "Assigned",
  inprogress: "In-Progress",
  "in-progress": "In-Progress",
  "in_progress": "In-Progress",
  active: "In-Progress",
  completed: "Completed",
  done: "Completed",
  finished: "Completed",
  cancelled: "Cancelled",
  canceled: "Cancelled",
};

const PRIORITY_MAP = {
  low: "Low",
  normal: "Medium",
  medium: "Medium",
  moderate: "Medium",
  high: "High",
  urgent: "Urgent",
  critical: "Urgent",
};

const DEPARTMENT_MAP = {
  housekeeping: "Housekeeping",
  cleaning: "Housekeeping",
  "cleaning staff": "Housekeeping",
  kitchen: "Kitchen",
  "kitchen staff": "Kitchen",
  maintenance: "Maintenance",
  engineering: "Maintenance",
  service: "Guest Services",
  services: "Guest Services",
  "guest services": "Guest Services",
  concierge: "Guest Services",
  "front desk": "Front Desk",
  reception: "Front Desk",
  security: "Security",
};

const TYPE_MAP = {
  cleaning: "cleaning",
  food: "food",
  kitchen: "food",
  maintenance: "maintenance",
  engineering: "maintenance",
  service: "service",
  services: "service",
  concierge: "service",
  general: "general",
};

const ALLOWED_SORT_FIELDS = new Set(["createdAt", "dueDate", "priority", "status"]);

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value));

const normalizeDepartment = (value) => {
  if (!value) return "Other";
  const normalized = String(value).trim().toLowerCase();
  return DEPARTMENT_MAP[normalized] || (TASK_DEPARTMENTS.includes(value) ? value : "Other");
};

const inferTypeFromDepartment = (department) => {
  const normalized = String(department).trim().toLowerCase();
  return TYPE_MAP[normalized] || "general";
};

const normalizeType = (value, department) => {
  if (!value) return inferTypeFromDepartment(department || "");
  const normalized = String(value).trim().toLowerCase();
  return TYPE_MAP[normalized] || (TASK_TYPES.includes(value) ? value : inferTypeFromDepartment(department || ""));
};

const normalizePriority = (value) => {
  if (!value) return "Medium";
  const normalized = String(value).trim().toLowerCase();
  return PRIORITY_MAP[normalized] || (TASK_PRIORITIES.includes(value) ? value : "Medium");
};

const normalizeStatus = (value) => {
  if (!value) return "Pending";
  const normalized = String(value).trim().toLowerCase();
  return STATUS_MAP[normalized] || (TASK_STATUSES.includes(value) ? value : "Pending");
};

const parseDate = (value) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const extractUserId = (user) => user?._id || user?.id || user?.userId;

const ensureRecommendations = (task) => {
  if (Array.isArray(task.recommendedStaff) && task.recommendedStaff.length > 0) {
    return task.recommendedStaff.map((member) => ({
      staffId: member.staffId,
      name: member.name,
      role: member.role || task.department || "Staff Member",
      match: member.match ?? task.aiRecommendationScore ?? 80,
    }));
  }

  const fallbackName = task.assignedTo?.name || "Available Staff";
  return [
    {
      name: fallbackName,
      role: task.department || task.type || "Staff Member",
      match: task.aiRecommendationScore ?? 82,
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
    type: task.type,
    priority: task.priority,
    status: task.status,
    location: task.location,
    roomNumber: task.roomNumber,
    dueDate: task.dueDate,
    estimatedDuration: task.estimatedDuration,
    tags: task.tags || [],
    recommendedStaff: ensureRecommendations({ ...task, assignedTo: assigned }),
    aiRecommendationScore: task.aiRecommendationScore,
    assignedTo: assigned,
    assignmentHistory: formatAssignmentHistory(task.assignmentHistory),
    notes: task.notes || {},
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

    const filters = { isArchived: false };

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

    const query = ManagerTask.find(filters)
      .populate("assignedTo", "name email role")
      .sort({ [sortField]: sortDirection })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean();

    const [tasks, total] = await Promise.all([
      query,
      ManagerTask.countDocuments(filters),
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

    const task = await ManagerTask.findOne({ _id: id, isArchived: false })
      .populate("assignedTo", "name email role")
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
      type: normalizeType(type, safeDepartment),
      dueDate: parseDate(dueDate),
      estimatedDuration:
        estimatedDuration !== undefined && estimatedDuration !== null
          ? Math.max(Number(estimatedDuration), 0)
          : undefined,
      location: location ? String(location).trim() : "",
      roomNumber: roomNumber ? String(roomNumber).trim() : undefined,
      tags: Array.isArray(tags) ? tags.map((tag) => String(tag).trim()).filter(Boolean) : undefined,
      notes: {
        manager: notes?.manager ? String(notes.manager).trim() : undefined,
        staff: notes?.staff ? String(notes.staff).trim() : undefined,
      },
      createdBy: creatorId,
      updatedBy: creatorId,
    };

    const task = await ManagerTask.create(payload);
    const populatedTask = await task.populate("assignedTo", "name email role");

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
      ManagerTask.findOne({ _id: id, isArchived: false }),
      User.findOne({ _id: staffId, role: "staff", isActive: true }).lean(),
    ]);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }

    task.assignedTo = staff._id;
    task.status = task.status === "Completed" ? task.status : "Assigned";
    task.updatedBy = extractUserId(req.user) || staff._id;
    task.assignmentHistory.push({
      assignedTo: staff._id,
      assignedName: staff.name,
      assignedAt: new Date(),
      assignedBy: extractUserId(req.user),
      notes: notes ? String(notes).trim() : undefined,
    });

    await task.save();
    const populatedTask = await task.populate("assignedTo", "name email role");

    res.status(200).json({
      success: true,
      message: "Task assigned successfully",
      data: buildTaskResponse(populatedTask),
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

    const task = await ManagerTask.findOne({ _id: id, isArchived: false });
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const normalizedStatus = normalizeStatus(status);

    if (normalizedStatus === "Assigned" && !task.assignedTo) {
      return res.status(400).json({ success: false, message: "Assign staff before marking as Assigned" });
    }

    task.status = normalizedStatus;
    task.updatedBy = extractUserId(req.user) || task.updatedBy;

    if (notes) {
      task.notes = task.notes || {};
      task.notes.manager = task.notes.manager
        ? `${task.notes.manager}\n${String(notes).trim()}`
        : String(notes).trim();
    }

    if (staffNotes) {
      task.notes = task.notes || {};
      task.notes.staff = task.notes.staff
        ? `${task.notes.staff}\n${String(staffNotes).trim()}`
        : String(staffNotes).trim();
    }

    await task.save();
    const populatedTask = await task.populate("assignedTo", "name email role");

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

    const task = await ManagerTask.findOneAndUpdate(
      { _id: id, isArchived: false },
      { isArchived: true, updatedBy: extractUserId(req.user) },
      { new: true },
    );

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    res.status(200).json({ success: true, message: "Task archived successfully" });
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

    const tasks = await ManagerTask.find({
      isArchived: false,
      assignedTo: userId,
    })
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

export const getAvailableStaff = async (req, res) => {
  try {
    const department = normalizeDepartment(req.params.department);

    const staffProfiles = await StaffProfile.find({ department, isActive: true })
      .populate("userId", "name email role")
      .lean();

    const staff = staffProfiles
      .filter((profile) => profile.userId?.isActive !== false)
      .map((profile) => ({
        staffId: String(profile.userId._id),
        name: profile.userId.name,
        email: profile.userId.email,
        role: profile.position,
        department: profile.department,
      }));

    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    console.error("manager:getAvailableStaff", error);
    res.status(500).json({ success: false, message: "Failed to fetch available staff" });
  }
};

export const getTaskStats = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;

    const matchStage = { isArchived: false };

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

    const aggregation = await ManagerTask.aggregate([
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
        case "Pending":
          overview.pendingTasks = bucket.count;
          break;
        case "Assigned":
          overview.assignedTasks = bucket.count;
          break;
        case "In-Progress":
          overview.inProgressTasks = bucket.count;
          break;
        case "Completed":
          overview.completedTasks = bucket.count;
          break;
        case "Cancelled":
          overview.cancelledTasks = bucket.count;
          break;
        default:
          break;
      }
    });

    const departmentBreakdown = await ManagerTask.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ["$status", "Completed"] }, 1, 0],
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
