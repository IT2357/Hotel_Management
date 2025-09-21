import mongoose from "mongoose";

// Performance Schema for tracking metrics
const performanceSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  totalTasks: Number,
  completedTasks: Number,
  pendingTasks: Number,
  inProgressTasks: Number,
  averageCompletionTime: Number,
  efficiencyRate: Number,
  staffOnline: Number,
  totalStaff: Number,
}, { timestamps: true });

const Performance = mongoose.model("Performance", performanceSchema);
export default Performance;