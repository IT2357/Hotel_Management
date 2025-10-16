const Task = require('../models/Task');

// Get assigned tasks for staff
const getAssignedTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedStaff: req.user._id, status: { $in: ['Assigned', 'In-Progress'] } });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Accept task (set to In-Progress)
const acceptTask = async (req, res) => {
  const { taskId } = req.body;
  try {
    const task = await Task.findByIdAndUpdate(taskId, { status: 'In-Progress' }, { new: true });
    global.io.emit('updateTaskStatus', { taskId, status: 'In-Progress' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAssignedTasks, acceptTask };