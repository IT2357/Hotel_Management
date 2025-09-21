// models/TaskHistory.js
import mongoose from 'mongoose';

const taskHistorySchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task', // References the Task model
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: ['created', 'updated', 'assigned', 'completed', 'rejected', 'deleted'], // Possible actions
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff', // References the Staff model (or User model if different)
    required: true,
  },
  previousValue: {
    type: mongoose.Schema.Types.Mixed, // Flexible field for storing previous state (e.g., { status: 'pending' })
    default: null,
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed, // Flexible field for storing new state (e.g., { status: 'completed' })
    default: null,
  },
  notes: {
    type: String,
    default: '',
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
});

export default mongoose.model('TaskHistory', taskHistorySchema);