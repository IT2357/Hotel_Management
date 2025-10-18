// 📁 backend/models/FoodTaskQueue.js
// Food Task Queue Model for Kitchen Workflow Management
// Tracks preparation, cooking, and delivery tasks for food orders
import mongoose from "mongoose";

const foodTaskQueueSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodOrder",
      required: [true, 'Order ID is required'],
      index: true
    },
    taskType: {
      type: String,
      enum: ["prep", "cook", "plate", "delivery", "quality-check"],
      required: [true, 'Task type is required'],
      index: true
    },
    status: {
      type: String,
      enum: ["queued", "assigned", "in-progress", "completed", "failed", "cancelled"],
      default: "queued",
      index: true
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
      index: true
    },
    // Automatically set to 'urgent' for room service orders
    isRoomService: {
      type: Boolean,
      default: false,
      index: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false
    },
    assignedAt: {
      type: Date,
      required: false
    },
    startedAt: {
      type: Date,
      required: false
    },
    completedAt: {
      type: Date,
      required: false
    },
    estimatedCompletionTime: {
      type: Date,
      required: false
    },
    actualCompletionTime: {
      type: Date,
      required: false
    },
    // Kitchen Display System (KDS) integration
    kdsNotified: {
      type: Boolean,
      default: false
    },
    // Notes from kitchen staff
    notes: {
      type: String,
      trim: true
    },
    // Quality checks for Jaffna hospitality standards
    qualityChecks: {
      temperature: { type: Boolean, default: false },
      presentation: { type: Boolean, default: false },
      portionSize: { type: Boolean, default: false },
      garnish: { type: Boolean, default: false }
    },
    // Allergy and dietary compliance flags
    allergyChecked: {
      type: Boolean,
      default: false
    },
    dietaryTagsVerified: {
      type: Boolean,
      default: false
    },
    // Task history for audit trail
    taskHistory: [
      {
        status: {
          type: String,
          enum: ["queued", "assigned", "in-progress", "completed", "failed", "cancelled"]
        },
        timestamp: {
          type: Date,
          default: Date.now
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        note: String
      }
    ]
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for efficient queries
foodTaskQueueSchema.index({ status: 1, priority: -1, createdAt: 1 });
foodTaskQueueSchema.index({ assignedTo: 1, status: 1 });
foodTaskQueueSchema.index({ isRoomService: 1, status: 1 });

// Virtual for task duration
foodTaskQueueSchema.virtual('duration').get(function() {
  if (this.completedAt && this.startedAt) {
    return Math.floor((this.completedAt - this.startedAt) / 1000 / 60); // minutes
  }
  return null;
});

// Pre-save middleware to update task history
foodTaskQueueSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.taskHistory.push({
      status: this.status,
      timestamp: new Date(),
      updatedBy: this.assignedTo,
      note: `Status changed to ${this.status}`
    });
  }
  next();
});

// Method to calculate ETA based on task type and order items
foodTaskQueueSchema.methods.calculateETA = function(orderItems) {
  const baseMinutes = {
    prep: 5,
    cook: 15,
    plate: 3,
    delivery: 10,
    'quality-check': 2
  };
  
  const itemCount = orderItems ? orderItems.length : 1;
  const baseTime = baseMinutes[this.taskType] || 10;
  
  // Add time for multiple items (2 minutes per additional item)
  const estimatedMinutes = baseTime + Math.max(0, (itemCount - 1) * 2);
  
  // Room service gets priority, reduce ETA by 20%
  const finalMinutes = this.isRoomService 
    ? Math.floor(estimatedMinutes * 0.8) 
    : estimatedMinutes;
  
  const eta = new Date();
  eta.setMinutes(eta.getMinutes() + finalMinutes);
  
  return eta;
};

// Static method to get pending tasks sorted by priority
foodTaskQueueSchema.statics.getPendingTasks = function() {
  return this.find({ 
    status: { $in: ['queued', 'assigned', 'in-progress'] } 
  })
  .sort({ 
    priority: -1, // urgent > high > normal > low
    isRoomService: -1, // room service first
    createdAt: 1 // FIFO within same priority
  })
  .populate('orderId', 'items orderType totalPrice')
  .populate('assignedTo', 'name email');
};

// Static method to get staff workload
foodTaskQueueSchema.statics.getStaffWorkload = async function(staffId) {
  const tasks = await this.find({
    assignedTo: staffId,
    status: { $in: ['assigned', 'in-progress'] }
  });
  
  return {
    staffId,
    activeTasks: tasks.length,
    tasks
  };
};

const FoodTaskQueue = mongoose.model("FoodTaskQueue", foodTaskQueueSchema);
export default FoodTaskQueue;
