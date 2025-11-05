import mongoose from "mongoose";
import StaffTask from "../../models/StaffTask.js";
import { User } from "../../models/User.js";
import cron from "node-cron";
import { syncGSRStatusFromTask } from "../../utils/gsrSync.js";

// Auto-assignment logic
const autoAssignTasks = async () => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // Find unassigned tasks older than 5 minutes
    const unassignedTasks = await StaffTask.find({
      status: "pending",
      assignedTo: { $exists: false },
      createdAt: { $lte: fiveMinutesAgo }
    });

    for (const task of unassignedTasks) {
      // Find available staff in the department
      const availableStaff = await User.find({
        role: "staff",
        "profile.department": task.department,
        isActive: true,
        isApproved: true
      }).populate("profile");

      if (availableStaff.length > 0) {
        // Simple round-robin assignment (can be enhanced with load balancing)
        const randomStaff = availableStaff[Math.floor(Math.random() * availableStaff.length)];
        
        task.assignedTo = randomStaff._id;
        task.status = "assigned";
        task.assignedAt = new Date();
        
        await task.save();

        // Keep linked GuestServiceRequest in sync when auto-assigning StaffTask
        try {
          await syncGSRStatusFromTask(task);
        } catch (e) {
          console.warn("GSR sync after auto-assign failed:", e?.message || e);
        }
        
        console.log(`Auto-assigned task ${task._id} to ${randomStaff.name}`);
        
        // TODO: Send notification to staff member
        // TODO: Send notification to manager about auto-assignment
      }
    }
  } catch (error) {
    console.error("Auto-assignment error:", error);
  }
};

// Schedule auto-assignment to run every minute
cron.schedule("*/1 * * * *", autoAssignTasks);

class ManagerTaskController {
  // Get all pending guest requests for manager dashboard
  static async getPendingRequests(req, res) {
    try {
      const { department, priority, limit = 50 } = req.query;
      
      const filter = {
        status: "pending"
      };
      
      if (department && department !== "all") {
        filter.department = department;
      }
      
      if (priority && priority !== "all") {
        filter.priority = priority;
      }

      const tasks = await StaffTask.find(filter)
        .populate("guestId", "name email profile.phone")
        .populate("assignedBy", "name email")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

      // Calculate how long each task has been pending
      const tasksWithTimings = tasks.map(task => {
        const obj = task.toObject();
        return {
          ...obj,
          requestedAt: obj.createdAt, // compatibility mapping
          pendingFor: Math.round((Date.now() - (obj.createdAt || Date.now())) / (1000 * 60)), // minutes
          isNearAutoAssignment: (Date.now() - (obj.createdAt || Date.now())) > (4 * 60 * 1000) // 4+ minutes
        };
      });

      res.json({
        success: true,
        data: tasksWithTimings,
        count: tasksWithTimings.length
      });
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch pending requests",
        error: error.message
      });
    }
  }

  // Get available staff by department
  static async getAvailableStaff(req, res) {
    try {
      const { department } = req.params;
      
      const staff = await User.find({
        role: "staff",
        "profile.department": department,
        isActive: true,
        isApproved: true
      }).populate("profile").select("name email profile");

      // Count current assigned tasks for workload info
      const staffWithWorkload = await Promise.all(
        staff.map(async (member) => {
          const activeTasks = await StaffTask.countDocuments({
            assignedTo: member._id,
            status: { $in: ["assigned", "in_progress"] }
          });
          
          return {
            ...member.toObject(),
            currentWorkload: activeTasks
          };
        })
      );

      res.json({
        success: true,
        data: staffWithWorkload
      });
    } catch (error) {
      console.error("Error fetching available staff:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch available staff",
        error: error.message
      });
    }
  }

  // Assign task to staff member
  static async assignTask(req, res) {
    try {
      const { taskId } = req.params;
      const { staffId, estimatedDuration, priority, notes } = req.body;
      
      if (!staffId) {
        return res.status(400).json({
          success: false,
          message: "Staff member ID is required"
        });
      }

      // Use StaffTask instead of legacy Task
      const task = await StaffTask.findById(taskId);
      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Task not found"
        });
      }

      const staff = await User.findById(staffId).populate("profile");
      if (!staff || staff.role !== "staff") {
        return res.status(404).json({
          success: false,
          message: "Staff member not found"
        });
      }

      // Update task assignment on StaffTask
      task.assignedTo = staffId;
      task.assignedBy = req.user.userId || req.user.id;
      task.status = "assigned";
      // Track in assignment history
      task.assignmentHistory = task.assignmentHistory || [];
      task.assignmentHistory.push({
        assignedTo: staffId,
        assignedBy: task.assignedBy,
        source: "user",
        status: "assigned",
        assignedAt: new Date(),
        notes: notes || undefined
      });

      if (estimatedDuration) {
        task.estimatedDuration = estimatedDuration;
      }
      if (priority) {
        task.priority = priority;
      }
      if (notes) {
        task.notes = task.notes || [];
        task.notes.push({ content: notes, addedBy: task.assignedBy, addedAt: new Date() });
      }

      await task.save();

      // Populate the updated StaffTask for response
      const updatedTask = await StaffTask.findById(taskId)
        .populate("assignedTo", "name email profile")
        .populate("assignedBy", "name email");

      const updatedObj = updatedTask?.toObject ? updatedTask.toObject() : updatedTask;
      res.json({
        success: true,
        message: `Task assigned to ${staff.name}`,
        data: { ...updatedObj, requestedAt: updatedObj?.createdAt }
      });

      // Keep linked GuestServiceRequest in sync
      try { await syncGSRStatusFromTask(task); } catch (e) { console.warn("GSR sync after manager assign failed:", e?.message || e); }
      // TODO: Send real-time notification to assigned staff
      // TODO: Send notification to guest about assignment
      
    } catch (error) {
      console.error("Error assigning task:", error);
      res.status(500).json({
        success: false,
        message: "Failed to assign task",
        error: error.message
      });
    }
  }

  // Get task status overview for manager dashboard
  static async getTaskStatusOverview(req, res) {
    try {
  const { timeframe = "today" } = req.query;
      
      let dateFilter = {};
      const now = new Date();
      
      switch (timeframe) {
        case "today":
          dateFilter = {
            createdAt: {
              $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
              $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
            }
          };
          break;
        case "week":
          const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
          dateFilter = { createdAt: { $gte: weekStart } };
          break;
        case "month":
          dateFilter = {
            createdAt: {
              $gte: new Date(now.getFullYear(), now.getMonth(), 1)
            }
          };
          break;
      }

      // Aggregate over StaffTask instead of legacy Task
      const statusCounts = await StaffTask.aggregate([
        { $match: { ...dateFilter } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            avgDuration: { $avg: "$actualDuration" }
          }
        }
      ]);

      const departmentStats = await StaffTask.aggregate([
        { $match: { ...dateFilter } },
        {
          $group: {
            _id: "$department",
            total: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
            assigned: { $sum: { $cond: [{ $eq: ["$status", "assigned"] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } }
          }
        }
      ]);

      // Get overdue tasks count
      const overdueTasks = await StaffTask.countDocuments({
        dueDate: { $lt: new Date() },
        status: { $in: ["pending", "assigned", "in_progress"] }
      });

      res.json({
        success: true,
        data: {
          statusCounts,
          departmentStats,
          overdueTasks,
          timeframe
        }
      });
    } catch (error) {
      console.error("Error fetching task overview:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch task overview",
        error: error.message
      });
    }
  }

  // Get all tasks with filtering and pagination
  static async getAllTasks(req, res) {
    try {
      const {
        status,
        department,
        priority,
        assignedTo,
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc"
      } = req.query;

      const filter = {};
      
      if (status && status !== "all") filter.status = status;
      if (department && department !== "all") filter.department = department;
      if (priority && priority !== "all") filter.priority = priority;
      if (assignedTo && assignedTo !== "all") filter.assignedTo = assignedTo;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      const tasks = await StaffTask.find(filter)
        .populate("assignedTo", "name email profile")
        .populate("guestId", "name email profile.phone")
        .populate("assignedBy", "name email")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const totalTasks = await StaffTask.countDocuments(filter);
      const totalPages = Math.ceil(totalTasks / parseInt(limit));

      const data = tasks.map(doc => {
        const obj = doc.toObject();
        return { ...obj, requestedAt: obj.createdAt };
      });

      res.json({
        success: true,
        data,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalTasks,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      });
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch tasks",
        error: error.message
      });
    }
  }

  // Update task status (for manual status changes)
  static async updateTaskStatus(req, res) {
    try {
      const { taskId } = req.params;
      const { status, notes, priority } = req.body;

      // Use StaffTask instead of legacy Task
      const task = await StaffTask.findById(taskId);
      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Task not found"
        });
      }

      // Update fields
      if (status) task.status = status;
      if (priority) task.priority = priority;
      if (notes) {
        task.notes = task.notes || [];
        task.notes.push({ content: notes, addedBy: req.user.userId || req.user.id, addedAt: new Date() });
      }

      await task.save();

      const updatedTask = await StaffTask.findById(taskId)
        .populate("assignedTo", "name email profile")
        .populate("assignedBy", "name email");

      const updatedObj = updatedTask?.toObject ? updatedTask.toObject() : updatedTask;
      res.json({
        success: true,
        message: "Task updated successfully",
        data: { ...updatedObj, requestedAt: updatedObj?.createdAt }
      });

      // Keep linked GuestServiceRequest in sync
      try { await syncGSRStatusFromTask(task); } catch (e) { console.warn("GSR sync after manager status update failed:", e?.message || e); }
      // TODO: Send notification about status change
      
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update task",
        error: error.message
      });
    }
  }

  // Get departments list
  static async getDepartments(req, res) {
    try {
      const departments = await User.distinct("profile.department", {
        role: "staff",
        isActive: true,
        isApproved: true
      });

      res.json({
        success: true,
        data: departments.filter(dept => dept) // Remove null/undefined values
      });
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch departments",
        error: error.message
      });
    }
  }
}

export default ManagerTaskController;