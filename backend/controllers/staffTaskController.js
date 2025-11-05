import mongoose from "mongoose";
import StaffTask from "../models/StaffTask.js";
import StaffProfile from "../models/profiles/StaffProfile.js";
import { assignTask } from "../utils/taskAssigner.js";
import config from "../config/environment.js";
import { syncGSRStatusFromTask } from "../utils/gsrSync.js";
import { getIO } from '../utils/socket.js';

// Validate department if provided by manager/admin
const CANON_DEPARTMENTS = ["Housekeeping", "Kitchen", "Maintenance", "Service"];
const getCanonicalDepartment = (dept) => {
  if (!dept) return null;
  const str = String(dept).trim().toLowerCase();
  return CANON_DEPARTMENTS.find(d => d.toLowerCase() === str) || null;
};
const validateDepartment = (dept) => !!getCanonicalDepartment(dept);

// Get all tasks for staff with filtering by department
export const getStaffTasks = async (req, res) => {
  try {
    const { status, priority, department, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    
    // Get staff's department if not manager/admin
    if (req.user.role === 'staff') {
      const staffProfile = await StaffProfile.findOne({ userId: req.user.id });
      
      if (!staffProfile) {
        return res.status(404).json({ 
          success: false,
          message: 'Staff profile not found. Please complete your staff profile.'
        });
      }
      
      if (!staffProfile.department) {
        return res.status(400).json({
          success: false,
          message: 'Department not assigned. Please contact your manager.'
        });
      }
      
      filter.department = getCanonicalDepartment(staffProfile.department) || staffProfile.department;
    } else if (department) {
      // Validate department for manager/admin
      const canon = getCanonicalDepartment(department);
      if (!canon) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department. Valid departments are: Housekeeping, Kitchen, Maintenance, Service'
        });
      }
      filter.department = canon;
    }
    
    // Staff visibility: either department-wide (default) or restricted by feature flag
    if (req.user.role === 'staff') {
      const restrict = !!config.FEATURES?.RESTRICT_STAFF_DEPT_VISIBILITY;
      filter.$or = restrict
        ? [
            { assignedTo: req.user.id },
            { assignedBy: req.user.id }
          ]
        : [
            { assignedTo: req.user.id },
            { assignedBy: req.user.id },
            { department: filter.department } // Include all tasks from their department
          ];
    }
    
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    const tasks = await StaffTask.find(filter)
      .populate('assignedTo', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName')
      .sort(sort);
    
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Get tasks assigned to the current user, filtered by department
export const getMyTasks = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { assignedTo: req.user.id };
    
    if (status) filter.status = status;
    
    // Get staff's department from StaffProfile
    const staffProfile = await StaffProfile.findOne({ userId: req.user.id });
    
    if (!staffProfile) {
      return res.status(404).json({ 
        success: false,
        message: 'Staff profile not found. Please complete your staff profile.'
      });
    }
    
    if (!staffProfile.department) {
      return res.status(400).json({
        success: false,
        message: 'Department not assigned. Please contact your manager.'
      });
    }
    
    filter.department = staffProfile.department;
    
    const tasks = await StaffTask.find(filter)
      .populate('assignedBy', 'firstName lastName')
      .sort({ dueDate: 1, priority: -1 });
    
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new task
export const createStaffTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate, department } = req.body;
    const canonDept = getCanonicalDepartment(department);
    if (department && !canonDept) {
      return res.status(400).json({ success: false, message: 'Invalid department' });
    }
    
    const task = new StaffTask({
      title,
      description,
      priority,
      dueDate,
      department: canonDept || undefined,
      assignedBy: req.user.id,
      status: 'pending'
    });
    
    await task.save();
    
    // Auto-assign if department is specified
    if (department) {
      await assignTask(task._id);
    }
    
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update task status
export const updateStaffTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, notes } = req.body;

    console.log('Updating task status:', { taskId, status, notes, userId: req.user?.id });

    if (!mongoose.isValidObjectId(taskId)) {
      return res.status(400).json({ message: 'Invalid task id' });
    }

    const task = await StaffTask.findById(taskId);
    if (!task) {
      console.log('Task not found:', taskId);
      return res.status(404).json({ message: 'Task not found' });
    }

    console.log('Found task:', { id: task._id, assignedTo: task.assignedTo, assignedBy: task.assignedBy });

    // Check if user is assigned to the task or is the assigner
    if (task.assignedTo?.toString() !== req.user.id && task.assignedBy?.toString() !== req.user.id) {
      console.log('Authorization failed:', { taskAssignedTo: task.assignedTo, taskAssignedBy: task.assignedBy, userId: req.user.id });
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    task.status = status;
    if (status === 'completed') {
      task.completedAt = new Date();
    }

    if (notes) {
      task.notes = task.notes || [];
      task.notes.push({
        content: notes,
        addedBy: req.user.id,
        addedAt: new Date()
      });
    }

    console.log('Saving task...');
    await task.save();
    console.log('Task saved successfully');

    // Reverse sync to GuestServiceRequest if linked (centralized util)
    await syncGSRStatusFromTask(task);

    // Notify relevant users (optional - don't fail if socket fails)
    try {
      getIO().emit('taskUpdated', task);
    } catch (socketError) {
      console.warn('Socket notification failed:', socketError);
    }

    res.status(200).json(task);
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete a task
export const deleteStaffTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const task = await StaffTask.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Only allow managers/admins or the task creator to delete
    if (task.assignedBy?.toString() !== req.user.id && !['manager', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }
    
    await StaffTask.findByIdAndDelete(taskId);
    
    // Notify relevant users
    getIO().emit('taskDeleted', { id: taskId });
    
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a note to a task
export const addTaskNote = async (req, res) => {
  try {
  const { taskId } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Note content is required' });
    }
    
    if (!mongoose.isValidObjectId(taskId)) {
      return res.status(400).json({ message: 'Invalid task id' });
    }
    const task = await StaffTask.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user is assigned to the task or is the assigner
    if (task.assignedTo?.toString() !== req.user.id && task.assignedBy?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to add notes to this task' });
    }
    
    task.notes = task.notes || [];
    task.notes.push({
      content,
      addedBy: req.user.id,
      addedAt: new Date()
    });
    
    await task.save();
    
    // Notify relevant users
    getIO().emit('taskUpdated', task);
    
    res.status(201).json(task.notes[task.notes.length - 1]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get task statistics
export const getStaffTaskStats = async (req, res) => {
  try {
    const { department, startDate, endDate } = req.query;
    const match = {};
    
    if (department) match.department = department;
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }
    
    if (req.user.role === 'staff') {
      match.$or = [
        { assignedTo: req.user.id },
        { assignedBy: req.user.id }
      ];
    }
    
    const stats = await StaffTask.aggregate([
      { $match: match },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalTime: { 
          $sum: { 
            $cond: [
              { $eq: ['$status', 'completed'] },
              { $subtract: ['$completedAt', '$assignedAt'] },
              0
            ]
          }
        },
        avgTime: {
          $avg: {
            $cond: [
              { $eq: ['$status', 'completed'] },
              { $subtract: ['$completedAt', '$assignedAt'] },
              null
            ]
          }
        }
      }},
      { $project: {
        _id: 0,
        status: '$_id',
        count: 1,
        totalTime: 1,
        avgTime: 1
      }}
    ]);
    
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
