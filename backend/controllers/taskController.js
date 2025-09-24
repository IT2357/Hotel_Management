import StaffTask from "../models/StaffTask.js";
import { assignTask } from "../utils/taskAssigner.js";
import { getIO } from '../utils/socket.js';

const STATUS_ORDER = {
  pending: 0,
  assigned: 1,
  in_progress: 2,
  completed: 3,
  cancelled: 3
};
const DOWNGRADE_GRACE_MS = 5 * 60 * 1000; // 5 minutes

// Get Tasks
export const getTasks = async (req, res) => {
  try {
    const { status, assignedTo, department, priority } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (department) filter.department = department;
    if (priority) filter.priority = priority;
    
    const tasks = await StaffTask.find(filter)
      .populate('assignedTo', 'firstName lastName')
      .populate('assignedBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Task by ID
export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await StaffTask.findById(id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create Task
export const createTask = async (req, res) => {
  try {
    const attachments = req.files ? req.files.map(file => ({
      filename: file.originalname,
      url: file.path,
      uploadedBy: req.user.id
    })) : [];

    const task = new StaffTask({
      ...req.body,
      createdBy: req.user.id,
      assignedBy: req.user.id,
      assignmentSource: 'user',
      attachments,
      status: 'pending'
    });

    await task.save();

    if (task.department) {
      await assignTask(task._id);
    }

    getIO().emit('taskCreated', task);
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Task Status
export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const task = await StaffTask.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    // Enforce forward-only progression after grace period
    const fromStatus = task.status;
    const toStatus = status;
    const now = Date.now();
    const lastChange = task.lastStatusChange ? new Date(task.lastStatusChange).getTime() : task.createdAt?.getTime() || now;
    const isDowngrade = STATUS_ORDER[toStatus] < STATUS_ORDER[fromStatus];
    if (isDowngrade && (now - lastChange) > DOWNGRADE_GRACE_MS) {
      return res.status(400).json({ message: `Backward status change from ${fromStatus} to ${toStatus} is not allowed after grace period` });
    }
    
    // Apply transition and record metadata
    task.status = toStatus;
    if (toStatus === 'completed') {
      task.completedAt = new Date();
    }
    if (toStatus === 'in_progress' && !task.acceptedBy) {
      task.acceptedBy = req.user.id;
      task.acceptedAt = new Date();
    }
    task.statusHistory = task.statusHistory || [];
    task.statusHistory.push({ from: fromStatus, to: toStatus, changedBy: req.user.id, changedAt: new Date() });
    task.lastStatusChange = new Date();
    
    await task.save();
    getIO().emit('taskUpdated', task);
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Task
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (req.files) {
      updates.attachments = req.files.map(file => ({
        filename: file.originalname,
        url: file.path,
        uploadedBy: req.user.id
      }));
    }
    
    // If status change is requested here, enforce same rules as updateTaskStatus
    if (updates.status) {
      const taskCurrent = await StaffTask.findById(id);
      if (!taskCurrent) return res.status(404).json({ message: 'Task not found' });

      const fromStatus = taskCurrent.status;
      const toStatus = updates.status;
      const now = Date.now();
      const lastChange = taskCurrent.lastStatusChange ? new Date(taskCurrent.lastStatusChange).getTime() : taskCurrent.createdAt?.getTime() || now;
      const isDowngrade = STATUS_ORDER[toStatus] < STATUS_ORDER[fromStatus];
      if (isDowngrade && (now - lastChange) > DOWNGRADE_GRACE_MS) {
        return res.status(400).json({ message: `Backward status change from ${fromStatus} to ${toStatus} is not allowed after grace period` });
      }

      // Apply transition on the doc and save to capture history fields
      taskCurrent.status = toStatus;
      if (toStatus === 'completed') taskCurrent.completedAt = new Date();
      if (toStatus === 'in_progress' && !taskCurrent.acceptedBy) {
        taskCurrent.acceptedBy = req.user.id;
        taskCurrent.acceptedAt = new Date();
      }
      taskCurrent.statusHistory = taskCurrent.statusHistory || [];
      taskCurrent.statusHistory.push({ from: fromStatus, to: toStatus, changedBy: req.user.id, changedAt: new Date() });
      taskCurrent.lastStatusChange = new Date();

      // If reassignment is included
      if (updates.assignedTo && String(updates.assignedTo) !== String(taskCurrent.assignedTo || '')) {
        taskCurrent.assignedTo = updates.assignedTo;
        taskCurrent.assignmentHistory = taskCurrent.assignmentHistory || [];
        taskCurrent.assignmentHistory.push({ assignedTo: updates.assignedTo, assignedBy: req.user.id, source: 'user', status: 'reassigned', notes: updates.notes });
        taskCurrent.assignedBy = req.user.id;
        taskCurrent.assignmentSource = 'user';
      }

      // Apply other updatable fields (excluding status and assignedTo already handled)
      const { status, assignedTo, ...rest } = updates;
      Object.assign(taskCurrent, rest);

      const saved = await taskCurrent.save();
      const populated = await saved
        .populate('assignedTo', 'firstName lastName')
        .populate('assignedBy', 'firstName lastName');
      getIO().emit('taskUpdated', populated);
      return res.status(200).json(populated);
    }

    const task = await StaffTask.findByIdAndUpdate(id, updates, { new: true })
      .populate('assignedTo', 'firstName lastName')
      .populate('assignedBy', 'firstName lastName');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    getIO().emit('taskUpdated', task);
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Task
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await StaffTask.findByIdAndDelete(id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    getIO().emit('taskDeleted', { id });
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Auto Assign Tasks
export const autoAssignTasks = async (req, res) => {
  try {
    const pendingTasks = await StaffTask.find({ 
      status: 'pending',
      department: { $exists: true }
    });
    
    const results = await Promise.all(
      pendingTasks.map(async (task) => {
        try {
          const assignedTask = await assignTask(task._id);
          getIO().emit('taskAssigned', assignedTask);
          return { task: task._id };
        } catch (e) {
          return { task: task._id, error: e.message };
        }
      })
    );
    
    res.status(200).json({
      assigned: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Task Priority (previously escalateTask)
export const updateTaskPriority = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await StaffTask.findById(id);
    
    if (task.priority === 'low') task.priority = 'medium';
    else if (task.priority === 'medium') task.priority = 'high';
    else if (task.priority === 'high') task.priority = 'urgent';
    
    await task.save();
    getIO().emit('taskUpdated', task);
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Process Task Handoff (previously handoffTask)
export const processTaskHandoff = async (req, res) => {
  try {
    const { id } = req.params;
    const { toStaffId, reason } = req.body;
    
    const task = await StaffTask.findById(id);
    task.assignedTo = toStaffId;
    task.assignmentHistory.push({
      assignedTo: toStaffId,
      assignedFrom: req.user.id,
      assignedBy: req.user.id,
      source: 'user',
      status: 'reassigned',
      notes: reason
    });
  
    await task.save();
    getIO().emit('taskUpdated', task);
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const trackPerformance = async (req, res) => {
  try {
    const { staffId } = req.params;
    const tasks = await StaffTask.find({ 
      assignedTo: staffId,
      status: 'completed',
      completedAt: { $exists: true }
    });
    
    const stats = {
      totalTasks: tasks.length,
      avgCompletionTime: 0,
      onTimeRate: 0,
      qualityAvg: 0
    };
    
    if (tasks.length > 0) {
      const totalCompletionTime = tasks.reduce((acc, task) => {
        const startTime = task.createdAt;
        const endTime = task.completedAt;
        return acc + (endTime - startTime);
      }, 0);
      stats.avgCompletionTime = totalCompletionTime / tasks.length;

      const onTimeTasks = tasks.filter(task => task.dueDate && task.completedAt <= task.dueDate).length;
      stats.onTimeRate = (onTimeTasks / tasks.length) * 100;

      const totalQuality = tasks.reduce((acc, task) => acc + (task.performanceMetrics.qualityRating || 0), 0);
      const ratedTasks = tasks.filter(task => task.performanceMetrics.qualityRating);
      stats.qualityAvg = ratedTasks.length > 0 ? totalQuality / ratedTasks.length : 0;
    }
    
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};