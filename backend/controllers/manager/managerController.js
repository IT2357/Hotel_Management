import Task from '../../models/Task.js';
import { User } from '../../models/User.js';
import Feedback from '../../models/Feedback.js';
import { suggestStaff, updateStaffWorkload } from '../../services/manager/autoAssignService.js';

// Get live task board (Pending, In-Progress, Completed)
const getTaskBoard = async (req, res) => {
  try {
    const tasks = await Task.find().populate('guestId assignedStaff');
    const grouped = {
      pending: tasks.filter(t => t.status === 'Pending'),
      inProgress: tasks.filter(t => t.status === 'In-Progress'),
      completed: tasks.filter(t => t.status === 'Completed'),
    };
    res.json(grouped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get staff availability
const getStaffAvailability = async (req, res) => {
  try {
    const staff = await User.find({ role: 'Staff' }).select('username department availability workload');
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Approve/Reject/Reassign task
const manageTaskAssignment = async (req, res) => {
  const { taskId, action, staffId } = req.body; // action: 'approve', 'reject', 'reassign'
  try {
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (action === 'approve') {
      task.assignedStaff = task.suggestedStaff[0]; // Assume first suggestion
      task.status = 'Assigned';
      await updateStaffWorkload(task.assignedStaff, 1); // Increment workload
      global.io.emit('assignTask', { staffId: task.assignedStaff, task });
    } else if (action === 'reassign') {
      task.assignedStaff = staffId;
      task.status = 'Assigned';
      await updateStaffWorkload(staffId, 1);
      global.io.emit('assignTask', { staffId, task });
    } else if (action === 'reject') {
      task.status = 'Pending'; // Or handle rejection logic
    }

    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Set task priority
const setTaskPriority = async (req, res) => {
  const { taskId, priority } = req.body;
  try {
    const task = await Task.findByIdAndUpdate(taskId, { priority }, { new: true });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get performance analytics
const getAnalytics = async (req, res) => {
  try {
    // Staff efficiency: avg completion time
    const staffEfficiency = await Task.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: '$assignedStaff', avgTime: { $avg: { $subtract: ['$completionTime', '$createdAt'] } } } },
    ]);

    // Guest satisfaction: avg rating per staff
    const satisfaction = await Feedback.aggregate([
      { $group: { _id: '$taskId', avgRating: { $avg: '$rating' } } },
      { $lookup: { from: 'tasks', localField: '_id', foreignField: '_id', as: 'task' } },
      { $unwind: '$task' },
      { $group: { _id: '$task.assignedStaff', avgSatisfaction: { $avg: '$avgRating' } } },
    ]);

    // Workload distribution
    const workload = await User.find({ role: 'Staff' }).select('username workload');

    res.json({ staffEfficiency, satisfaction, workload });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Auto-suggest staff for a new task (called when task is created)
const generateStaffSuggestions = async (taskId) => {
  const task = await Task.findById(taskId);
  const suggestions = await suggestStaff(task.type, task.priority);
  task.suggestedStaff = suggestions.map(s => s._id);
  await task.save();
  global.io.to('manager_room').emit('newSuggestion', { taskId, suggestions });
};

export {
  getTaskBoard,
  getStaffAvailability,
  manageTaskAssignment,
  setTaskPriority,
  getAnalytics,
  generateStaffSuggestions
};