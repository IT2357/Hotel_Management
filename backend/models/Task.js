import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  guestId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['Food', 'Cleaning', 'Maintenance', 'Services'], required: true },
  description: { type: String, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { type: String, enum: ['Pending', 'Assigned', 'In-Progress', 'Completed'], default: 'Pending' },
  suggestedStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Auto-suggested
  assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completionTime: { type: Date },
}, { timestamps: true });

const Task = mongoose.model("Task", taskSchema);

export default Task;
