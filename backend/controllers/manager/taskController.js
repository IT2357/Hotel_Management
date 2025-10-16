import Task from "../../models/Task.js";
import { generateStaffSuggestions } from "./managerController";

// Create guest request (task)
const createTask = async (req, res) => {
  const { type, description, priority } = req.body;
  try {
    const task = new Task({
      guestId: req.user._id, // From auth middleware
      type,
      description,
      priority,
    });
    await task.save();
    await generateStaffSuggestions(task._id); // Trigger auto-suggest
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update task status (staff use, but manager can monitor)
const updateTaskStatus = async (req, res) => {
  const { taskId, status } = req.body;
  try {
    const update = { status };
    if (status === 'Completed') update.completionTime = new Date();
    const task = await Task.findByIdAndUpdate(taskId, update, { new: true });
    if (status === 'Completed') {
      await autoAssignService.updateStaffWorkload(task.assignedStaff, -1); // Decrement workload
    }
    global.io.emit('updateTaskStatus', { taskId, status });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createTask, updateTaskStatus };