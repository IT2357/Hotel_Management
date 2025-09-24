import mongoose from "mongoose";

const staffTaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    department: {
      type: String,
      enum: ["Housekeeping", "Kitchen", "Maintenance", "Service"],
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "assigned", "in_progress", "completed", "cancelled"],
      default: "pending",
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    dueDate: { type: Date },
    completedAt: { type: Date },
    complexity: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    estimatedPoints: {
      type: Number,
      min: 1,
      default: 5
    },
    skillRequirements: [{
      skill: String,
      level: { type: Number, min: 1, max: 5 }
    }],
    assignmentHistory: [{
      assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      assignedAt: { type: Date, default: Date.now },
      completedAt: { type: Date },
      status: String,
      notes: String
    }],
    timeLogs: [{
      staff: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      startTime: { type: Date },
      endTime: { type: Date },
      duration: { type: Number } // in minutes
    }],
    performanceMetrics: {
      timeEstimateAccuracy: { type: Number },
      qualityRating: { type: Number, min: 1, max: 5 },
      completionDelay: { type: Number } // in minutes
    },
    location: {
      type: String,
      enum: ["room", "kitchen", "lobby", "gym", "pool", "parking", "other"],
      required: true,
    },
    roomNumber: { type: String },
    category: {
      type: String,
      enum: [
        "electrical", "plumbing", "hvac", "appliance", "structural", "general",
        "food_preparation", "cooking", "cleaning", "inventory", "equipment",
        "guest_request", "room_service", "concierge", "transportation", "event",
        "cleaning", "laundry", "restocking", "inspection", "deep_cleaning"
      ],
      required: true,
    },
    estimatedDuration: { type: Number },
    actualDuration: { type: Number },
    materials: [String],
    notes: [{
      content: String,
      addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      addedAt: { type: Date, default: Date.now },
    }],
    attachments: [{
      filename: String,
      url: String,
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      uploadedAt: { type: Date, default: Date.now },
    }],
    isUrgent: { type: Boolean, default: false },
    requiresApproval: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    tags: [String],
    handoffTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    handoffFrom: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    handoffDepartment: { type: String },
    handoffReason: { type: String },
  },
  { timestamps: true }
);

staffTaskSchema.index({ department: 1, status: 1 });
staffTaskSchema.index({ assignedTo: 1, status: 1 });
staffTaskSchema.index({ priority: 1, dueDate: 1 });
staffTaskSchema.index({ isUrgent: 1, status: 1 });

const StaffTask = mongoose.model("StaffTask", staffTaskSchema);
export default StaffTask;
