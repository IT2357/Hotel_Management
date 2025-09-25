import mongoose from "mongoose";
import Task from "../../models/Task.js";
import GuestServiceRequest from "../../models/GuestServiceRequest.js";
import { User } from "../../models/User.js";
import cron from "node-cron";

// Auto-assignment logic
const autoAssignTasks = async () => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // Find unassigned tasks older than 5 minutes
    const unassignedTasks = await Task.find({
      status: "pending",
      assignedTo: { $exists: false },
      requestedAt: { $lte: fiveMinutesAgo },
      isActive: true
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
        status: "pending",
        isActive: true
      };
      
      if (department && department !== "all") {
        filter.department = department;
      }
      
      if (priority && priority !== "all") {
        filter.priority = priority;
      }

      const tasks = await Task.find(filter)
        .populate("guestId", "name email profile.phone")
        .populate("assignedBy", "name email")
        .sort({ requestedAt: -1 })
        .limit(parseInt(limit));

      // Calculate how long each task has been pending
      const tasksWithTimings = tasks.map(task => ({
        ...task.toObject(),
        pendingFor: Math.round((Date.now() - task.requestedAt) / (1000 * 60)), // minutes
        isNearAutoAssignment: (Date.now() - task.requestedAt) > (4 * 60 * 1000) // 4+ minutes
      }));

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
          const activeTasks = await Task.countDocuments({
            assignedTo: member._id,
            status: { $in: ["assigned", "in-progress"] },
            isActive: true
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

      const task = await Task.findById(taskId);
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

      // Update task assignment
      task.assignedTo = staffId;
      task.assignedBy = req.user.userId;
      task.status = "assigned";
      task.assignedAt = new Date();
      
      if (estimatedDuration) {
        task.estimatedDuration = estimatedDuration;
      }
      
      if (priority) {
        task.priority = priority;
      }
      
      if (notes) {
        task.notes = { ...task.notes, manager: notes };
      }

      await task.save();

      // Populate the updated task for response
      const updatedTask = await Task.findById(taskId)
        .populate("assignedTo", "name email profile")
        .populate("guestId", "name email profile.phone")
        .populate("assignedBy", "name email");

      res.json({
        success: true,
        message: `Task assigned to ${staff.name}`,
        data: updatedTask
      });

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
            requestedAt: {
              $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
              $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
            }
          };
          break;
        case "week":
          const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
          dateFilter = { requestedAt: { $gte: weekStart } };
          break;
        case "month":
          dateFilter = {
            requestedAt: {
              $gte: new Date(now.getFullYear(), now.getMonth(), 1)
            }
          };
          break;
      }

      const statusCounts = await Task.aggregate([
        { $match: { isActive: true, ...dateFilter } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            avgDuration: { $avg: "$actualDuration" }
          }
        }
      ]);

      const departmentStats = await Task.aggregate([
        { $match: { isActive: true, ...dateFilter } },
        {
          $group: {
            _id: "$department",
            total: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
            assigned: { $sum: { $cond: [{ $eq: ["$status", "assigned"] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } }
          }
        }
      ]);

      // Get overdue tasks count
      const overdueTasks = await Task.countDocuments({
        dueDate: { $lt: new Date() },
        status: { $in: ["pending", "assigned", "in-progress"] },
        isActive: true
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
        sortBy = "requestedAt",
        sortOrder = "desc"
      } = req.query;

      const filter = { isActive: true };
      
      if (status && status !== "all") filter.status = status;
      if (department && department !== "all") filter.department = department;
      if (priority && priority !== "all") filter.priority = priority;
      if (assignedTo && assignedTo !== "all") filter.assignedTo = assignedTo;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      const tasks = await Task.find(filter)
        .populate("assignedTo", "name email profile")
        .populate("guestId", "name email profile.phone")
        .populate("assignedBy", "name email")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const totalTasks = await Task.countDocuments(filter);
      const totalPages = Math.ceil(totalTasks / parseInt(limit));

      res.json({
        success: true,
        data: tasks,
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

      const task = await Task.findById(taskId);
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
        task.notes = { ...task.notes, manager: notes };
      }

      await task.save();

      const updatedTask = await Task.findById(taskId)
        .populate("assignedTo", "name email profile")
        .populate("guestId", "name email profile.phone")
        .populate("assignedBy", "name email");

      res.json({
        success: true,
        message: "Task updated successfully",
        data: updatedTask
      });

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