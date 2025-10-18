import mongoose from "mongoose";

const { Schema } = mongoose;

export const TASK_STATUSES = [
  "Pending",
  "Assigned",
  "In-Progress",
  "Completed",
  "Cancelled",
];

export const TASK_PRIORITIES = ["Low", "Medium", "High", "Urgent"];

export const TASK_DEPARTMENTS = [
  "Housekeeping",
  "Kitchen",
  "Maintenance",
  "Guest Services",
  "Front Desk",
  "Security",
  "Other",
];

export const TASK_TYPES = ["cleaning", "food", "maintenance", "service", "general"];

const recommendedStaffSchema = new Schema(
  {
    staffId: { type: Schema.Types.ObjectId, ref: "User" },
    name: { type: String, trim: true, required: true },
    role: { type: String, trim: true, default: "Staff Member" },
    match: {
      type: Number,
      min: 0,
      max: 100,
      default: 75,
    },
  },
  { _id: false },
);

const assignmentHistorySchema = new Schema(
  {
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    assignedName: { type: String, trim: true },
    assignedAt: { type: Date, default: Date.now },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User" },
    notes: { type: String, trim: true },
  },
  { _id: false },
);

const managerTaskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, default: "" },
    department: {
      type: String,
      enum: TASK_DEPARTMENTS,
      required: true,
    },
    type: {
      type: String,
      enum: TASK_TYPES,
      default: "general",
    },
    priority: {
      type: String,
      enum: TASK_PRIORITIES,
      default: "Medium",
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: "Pending",
    },
    location: { type: String, trim: true, default: "" },
    roomNumber: { type: String, trim: true },
    dueDate: { type: Date },
    estimatedDuration: { type: Number, min: 0 },
    tags: [{ type: String, trim: true }],
    recommendedStaff: {
      type: [recommendedStaffSchema],
      default: undefined,
    },
    aiRecommendationScore: { type: Number, min: 0, max: 100 },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    assignmentHistory: {
      type: [assignmentHistorySchema],
      default: [],
    },
    notes: {
      manager: { type: String, trim: true },
      staff: { type: String, trim: true },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    isArchived: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: "manager_tasks",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

managerTaskSchema.index({ status: 1 });
managerTaskSchema.index({ department: 1 });
managerTaskSchema.index({ priority: 1 });
managerTaskSchema.index({ dueDate: 1 });
managerTaskSchema.index({ createdBy: 1 });
managerTaskSchema.index({ assignedTo: 1, status: 1 });

const ManagerTask = mongoose.models.ManagerTask || mongoose.model("ManagerTask", managerTaskSchema);

export default ManagerTask;
