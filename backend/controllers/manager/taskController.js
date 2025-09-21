// controllers/manager/taskController.js
import Task from '../../models/manager/Task.js';
import Staff from '../../models/profiles/StaffProfile.js';
import { Guest } from '../../models/User.js'; // Import the Guest discriminator
import TaskHistory from '../../models/manager/TaskHistory.js';
import Notification from '../../models/Notification.js';

export const createTaskHistory = async (taskId, action, performedBy, previousValue = null, newValue = null, notes = '') => {
  try {
    const history = new TaskHistory({ taskId, action, performedBy, previousValue, newValue, notes });
    await history.save();
  } catch (error) {
    console.error('Error creating task history:', error);
  }
};

export const createNotification = async (recipient, type, title, message, relatedTask = null, priority = 'medium') => {
  try {
    const notification = new Notification({ recipient, type, title, message, relatedTask, priority });
    await notification.save();
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const getTasks = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority, category, assignedTo, roomNumber, search, sortBy = 'createdAt', sortOrder = 'desc', dateFrom, dateTo, overdue } = req.query;
    const skip = (page - 1) * limit;
    let query = {};

    if (status && status !== 'all') {
      if (status === 'overdue') {
        query.status = { $in: ['pending', 'assigned', 'in-progress'] };
        query.dueDate = { $lt: new Date() };
      } else {
        query.status = status;
      }
    }
    if (priority && priority !== 'all') query.priority = priority;
    if (category && category !== 'all') query.category = category;
    if (assignedTo && assignedTo !== 'all') query.assignedTo = assignedTo;
    if (roomNumber) query.roomNumber = new RegExp(roomNumber, 'i');
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { guestName: { $regex: search, $options: 'i' } },
        { roomNumber: { $regex: search, $options: 'i' } }
      ];
    }
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email role avatar isOnline')
      .populate('guest', 'name email phone vipStatus loyaltyTier')
      .populate('createdBy', 'name role')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    const total = await Task.countDocuments(query);
    const [categories, staff, priorities, statuses] = await Promise.all([
      Task.distinct('category'), // Hotel-specific categories: 'cleaning', 'maintenance', 'guest service', etc.
      Staff.find({ isActive: true, role: { $in: ['staff', 'manager'] } }, 'name role department'), // Filter active staff/manager
      Task.distinct('priority'),
      Task.distinct('status')
    ]);

    res.json({
      tasks,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
      filters: { categories, staff, priorities, statuses }
    });
  } catch (error) {
    console.error('Tasks fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, description, category = 'guest service', priority = 'medium', guestName, roomNumber, estimatedTime = 30, dueDate, assignTo, notes } = req.body;
    // Validate category for hotel context
    const validCategories = ['cleaning', 'maintenance', 'guest service', 'check-in', 'check-out'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: `Category must be one of: ${validCategories.join(', ')}` });
    }

    let guest = await Guest.findOne({ name: guestName, roomNumber, role: 'guest' });
    if (!guest) {
      guest = new Guest({
        name: guestName,
        email: `${guestName.toLowerCase().replace(/\s+/g, '.')}@guest.hotel`,
        roomNumber,
        checkIn: new Date(),
        checkOut: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        role: 'guest',
        // Note: guestProfile is not set here; consider creating a GuestProfile if needed
        // e.g., guest.guestProfile = new GuestProfile({ preferences: {} })._id; await guest.save();
      });
      await guest.save();
    }

    const task = new Task({
      title,
      description: description || `Handle ${category} for room ${roomNumber}`,
      category,
      priority,
      guest: guest._id,
      guestName,
      roomNumber,
      estimatedTime,
      dueDate: dueDate ? new Date(dueDate) : null,
      createdBy: req.user._id,
    });

    if (assignTo) {
      const assignedStaff = await Staff.findById(assignTo);
      if (!assignedStaff || !assignedStaff.isActive || assignedStaff.role === 'manager') {
        return res.status(400).json({ error: 'Invalid or inactive staff member for assignment' });
      }
      task.assignedTo = assignTo;
      task.status = 'assigned';
      await Staff.findByIdAndUpdate(assignTo, { $inc: { currentWorkload: 1 } });
      await createNotification(
        assignTo,
        'task_assigned',
        'New Task Assigned',
        `You have been assigned a new ${priority} priority task: ${title} for room ${roomNumber}`,
        task._id,
        priority === 'urgent' ? 'high' : 'medium'
      );
    }

    await task.save();
    await createTaskHistory(task._id, 'created', req.user._id, null, { status: task.status, priority, category }, `Task created by ${req.user.name} for room ${roomNumber}`);
    if (notes) {
      task.notes.push({ author: req.user._id, message: notes, isInternal: false, timestamp: new Date() });
      await task.save();
    }
    await task.populate('assignedTo', 'name email role avatar isOnline').populate('guest', 'name email phone vipStatus loyaltyTier');
    res.status(201).json(task);
  } catch (error) {
    console.error('Task creation error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

export const updateTask = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const updates = req.body;
    const allowedUpdates = ['title', 'description', 'priority', 'estimatedTime', 'dueDate', 'status', 'assignedTo', 'rejectionReason', 'actualTime'];
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => { if (allowedUpdates.includes(key)) filteredUpdates[key] = updates[key]; });

    const currentTask = await Task.findById(taskId);
    if (!currentTask) return res.status(404).json({ error: 'Task not found' });

    if (filteredUpdates.status && filteredUpdates.status !== currentTask.status) {
      const now = new Date();
      switch (filteredUpdates.status) {
        case 'in-progress': filteredUpdates.startedAt = now; break;
        case 'completed':
          filteredUpdates.completedAt = now;
          if (!filteredUpdates.actualTime && currentTask.startedAt) filteredUpdates.actualTime = Math.round((now - currentTask.startedAt) / (1000 * 60));
          if (currentTask.assignedTo) await Staff.findByIdAndUpdate(currentTask.assignedTo, { $inc: { tasksCompleted: 1, currentWorkload: -1 } });
          break;
        case 'rejected':
          filteredUpdates.rejectedAt = now;
          if (currentTask.assignedTo) await Staff.findByIdAndUpdate(currentTask.assignedTo, { $inc: { currentWorkload: -1 } });
          break;
      }
    }

    if (filteredUpdates.assignedTo && filteredUpdates.assignedTo !== currentTask.assignedTo?.toString()) {
      if (currentTask.assignedTo) await Staff.findByIdAndUpdate(currentTask.assignedTo, { $inc: { currentWorkload: -1 } });
      if (filteredUpdates.assignedTo) {
        const assignedStaff = await Staff.findById(filteredUpdates.assignedTo);
        if (!assignedStaff || !assignedStaff.isActive || assignedStaff.role === 'manager') {
          return res.status(400).json({ error: 'Invalid or inactive staff member for assignment' });
        }
        await Staff.findByIdAndUpdate(filteredUpdates.assignedTo, { $inc: { currentWorkload: 1 } });
        filteredUpdates.status = 'assigned';
        await createNotification(filteredUpdates.assignedTo, 'task_assigned', 'Task Reassigned', `You have been assigned task: ${currentTask.title} for room ${currentTask.roomNumber}`, taskId);
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(taskId, filteredUpdates, { new: true, runValidators: true })
      .populate('assignedTo', 'name email role avatar isOnline')
      .populate('guest', 'name email phone vipStatus loyaltyTier');
    await createTaskHistory(taskId, 'updated', req.user._id, { status: currentTask.status }, { status: updatedTask.status }, `Task updated by ${req.user.name} for room ${currentTask.roomNumber}`);
    res.json(updatedTask);
  } catch (error) {
    console.error('Task update error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};