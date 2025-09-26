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
    // Who created the task (user) if applicable
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // Track whether assignment was done by a human user or the system
    assignmentSource: { type: String, enum: ["user", "system"], default: "user", index: true },
    // Who accepted (took) the task and when
    acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    acceptedAt: { type: Date },
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
      assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      source: { type: String, enum: ["user", "system"] },
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
    // Status change tracking and governance
    lastStatusChange: { type: Date, default: Date.now },
    statusHistory: [{
      from: { type: String },
      to: { type: String },
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      changedAt: { type: Date, default: Date.now },
      reason: { type: String }
    }],
  },
  { timestamps: true }
);

staffTaskSchema.index({ department: 1, status: 1 });
staffTaskSchema.index({ assignedTo: 1, status: 1 });
staffTaskSchema.index({ priority: 1, dueDate: 1 });
staffTaskSchema.index({ isUrgent: 1, status: 1 });
staffTaskSchema.index({ assignmentSource: 1 });
staffTaskSchema.index({ lastStatusChange: 1 });

// Governance: forward-only status progression after a grace period
// Order mapping for statuses
const STATUS_ORDER = {
  pending: 0,
  assigned: 1,
  in_progress: 2,
  completed: 3,
  cancelled: 3 // treat cancelled as terminal (no backward afterwards)
};

// Grace period in milliseconds during which a downgrade is allowed (e.g., 5 minutes)
const DOWNGRADE_GRACE_MS = 5 * 60 * 1000;

// Lock period for completed tasks (15 minutes - matches frontend timer)
const COMPLETION_LOCK_MS = 15 * 60 * 1000;

staffTaskSchema.pre('save', function(next) {
  try {
    // Only act if status changed
    if (!this.isModified('status')) return next();

    const prior = this.$__.priorDoc;
    const fromStatus = prior ? prior.status : this.status;
    const toStatus = this.status;

    console.log('Status change:', { from: fromStatus, to: toStatus });

    // Check if task is completed and locked
    if (fromStatus === 'completed' && this.completedAt) {
      const now = new Date();
      const timeSinceCompletion = now - this.completedAt;

      if (timeSinceCompletion > COMPLETION_LOCK_MS) {
        return next(new Error(`Task was completed ${Math.floor(timeSinceCompletion / (1000 * 60))} minutes ago and is now locked. No further updates are allowed.`));
      }
    }

    if (fromStatus && toStatus && STATUS_ORDER[fromStatus] !== undefined && STATUS_ORDER[toStatus] !== undefined) {
      const now = new Date();
      const lastChange = this.lastStatusChange || this.createdAt || now;
      const timeSince = now - lastChange;

      const isDowngrade = STATUS_ORDER[toStatus] < STATUS_ORDER[fromStatus];
      if (isDowngrade && timeSince > DOWNGRADE_GRACE_MS) {
        return next(new Error(`Backward status change from ${fromStatus} to ${toStatus} is not allowed after grace period`));
      }
    }

    // Record history and bump lastStatusChange
    this.statusHistory = this.statusHistory || [];
    if (fromStatus && fromStatus !== this.status) {
      this.statusHistory.push({
        from: fromStatus,
        to: this.status,
        changedAt: new Date(),
        changedBy: this.$__.priorDoc?.lastModifiedBy || null,
        reason: 'Status update'
      });
    }
    this.lastStatusChange = new Date();
    next();
  } catch (error) {
    console.error('Error in StaffTask pre-save middleware:', error);
    // Don't fail the save, just log the error
    next();
  }
});

const StaffTask = mongoose.model("StaffTask", staffTaskSchema);
export default StaffTask;
