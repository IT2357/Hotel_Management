import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    // Guest Request Information
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    type: {
      type: String,
      enum: ["food", "maintenance", "cleaning", "services", "other", "general"],
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    
    // Guest Information (optional for manager-created tasks)
    guestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    guestName: {
      type: String,
      required: false,
    },
    roomNumber: {
      type: String,
      required: false,
    },
    guestPhone: String,
    
    // Assignment Information
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    department: {
      type: String,
      enum: ["Kitchen Staff", "Server Staff", "Maintenance", "Cleaning Staff"], // Updated to match user requirements
      required: true,
    },
    
    // Location field for manager-created tasks
    location: {
      type: String,
      required: false,
    },
    
    // Task Status and Tracking
    status: {
      type: String,
      enum: ["pending", "assigned", "in-progress", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    
    // Important Dates
    requestedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    assignedAt: Date,
    startedAt: Date,
    completedAt: Date,
    dueDate: {
      type: Date,
      validate: {
        validator: function (v) {
          if (!v) return true; // Allow null/undefined dates
          // Allow due date to be up to 1 minute before request date to handle timing issues
          const tolerance = 60 * 1000; // 1 minute in milliseconds
          return v.getTime() >= (this.requestedAt.getTime() - tolerance);
        },
        message: "Due date must be after request date",
      },
    },
    
    // Task Details
    notes: {
      manager: String,
      staff: String,
    },
    estimatedDuration: {
      type: Number, // in minutes
      min: 1,
    },
    actualDuration: {
      type: Number, // in minutes
      min: 0,
    },
    
    // Media attachments
    attachments: [{
      type: String, // URLs to images/documents
      validate: {
        validator: (v) => /^(http|https):\/\/[^ "]+$/.test(v),
        message: "Invalid URL format",
      },
    }],
    
    // Task completion details
    completionNotes: String,
    completionAttachments: [{
      type: String,
      validate: {
        validator: (v) => /^(http|https):\/\/[^ "]+$/.test(v),
        message: "Invalid URL format",
      },
    }],
    
    // Guest satisfaction
    guestRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    guestFeedback: String,
    
    // System fields
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [String],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
taskSchema.index({ status: 1, createdAt: -1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ guestId: 1 });
taskSchema.index({ department: 1, status: 1 });
taskSchema.index({ assignedBy: 1 });

// Virtual for calculating if task is overdue
taskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'completed' || this.status === 'cancelled') {
    return false;
  }
  return new Date() > this.dueDate;
});

// Virtual for task duration
taskSchema.virtual('totalDuration').get(function() {
  if (this.completedAt && this.startedAt) {
    return Math.round((this.completedAt - this.startedAt) / (1000 * 60)); // in minutes
  }
  return null;
});

// Pre-save middleware
taskSchema.pre('save', function(next) {
  // Set assignedAt when task is first assigned
  if (this.isModified('assignedTo') && this.assignedTo && !this.assignedAt) {
    this.assignedAt = new Date();
    if (this.status === 'pending') {
      this.status = 'assigned';
    }
  }
  
  // Set startedAt when status changes to in-progress
  if (this.isModified('status') && this.status === 'in-progress' && !this.startedAt) {
    this.startedAt = new Date();
  }
  
  // Set completedAt when status changes to completed
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
    if (this.startedAt) {
      this.actualDuration = Math.round((this.completedAt - this.startedAt) / (1000 * 60));
    }
  }
  
  next();
});

// Static methods
taskSchema.statics.getTasksByDepartment = function(department, status = null) {
  const query = { department, isActive: true };
  if (status) query.status = status;
  return this.find(query).populate('assignedTo guestId assignedBy', 'name email phone');
};

taskSchema.statics.getTasksByStaff = function(staffId, status = null) {
  const query = { assignedTo: staffId, isActive: true };
  if (status) query.status = status;
  return this.find(query).populate('guestId assignedBy', 'name email phone');
};

taskSchema.statics.getTaskReports = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        isActive: true
      }
    },
    {
      $group: {
        _id: {
          department: '$department',
          status: '$status'
        },
        count: { $sum: 1 },
        avgDuration: { $avg: '$actualDuration' },
        avgRating: { $avg: '$guestRating' }
      }
    }
  ]);
};

const Task = mongoose.model("Task", taskSchema);

export default Task;