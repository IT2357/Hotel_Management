import mongoose from "mongoose";

const STAGES = [
  "kitchen",
  "service",
  "maintenance",
  "cleaning",
];

const STATUS = ["Pending", "In Progress", "Completed", "Cancelled"];

const subTaskSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      enum: ["Kitchen", "Service", "Maintenance", "Housekeeping"],
      required: true,
    },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: STATUS, default: "Pending" },
    startedAt: Date,
    completedAt: Date,
    notes: String,
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    priority: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
    status: { type: String, enum: STATUS, default: "Pending" },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
    type: {
      type: String,
      enum: [
        "Cleaning",
        "Maintenance",
        "FoodOrder",
        "Service",
        "Other",
      ],
      required: true,
    },
    // Linear workflow represented as ordered subtasks
    workflow: [subTaskSchema],
    currentStepIndex: { type: Number, default: 0 },
    dueAt: Date,
    metadata: {},
  },
  { timestamps: true }
);

// Virtuals
taskSchema.virtual("currentStep").get(function () {
  if (!Array.isArray(this.workflow)) return null;
  return this.workflow[this.currentStepIndex] || null;
});

// Indexes
taskSchema.index({ status: 1, priority: 1, type: 1 });

const Task = mongoose.model("Task", taskSchema);
export default Task;
