import mongoose from "mongoose";

const taskFeedbackSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },
    
    // Feedback from different roles
    feedbackType: {
      type: String,
      enum: ["manager-to-staff", "staff-to-manager", "guest-to-staff", "staff-to-guest", "manager-to-guest"],
      required: true,
    },
    
    // Who provided the feedback
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fromUserRole: {
      type: String,
      enum: ["guest", "staff", "manager", "admin"],
      required: true,
    },
    
    // Who receives the feedback
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toUserRole: {
      type: String,
      enum: ["guest", "staff", "manager", "admin"],
      required: true,
    },
    
    // Feedback content
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    
    // Rating (if applicable)
    rating: {
      type: Number,
      min: 1,
      max: 5,
      validate: {
        validator: function(v) {
          // Rating is required for guest feedback
          if (this.feedbackType.includes('guest') && this.fromUserRole === 'guest') {
            return v != null;
          }
          return true;
        },
        message: 'Rating is required for guest feedback'
      }
    },
    
    // Status tracking
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    
    // Response tracking
    hasResponse: {
      type: Boolean,
      default: false,
    },
    responseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaskFeedback",
    },
    parentFeedbackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaskFeedback",
    },
    
    // Urgency level
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    
    // Attachments
    attachments: [{
      type: String,
      validate: {
        validator: (v) => /^(http|https):\/\/[^ "]+$/.test(v),
        message: "Invalid URL format",
      },
    }],
    
    // Metadata
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

// Indexes
taskFeedbackSchema.index({ taskId: 1, createdAt: -1 });
taskFeedbackSchema.index({ fromUser: 1 });
taskFeedbackSchema.index({ toUser: 1, isRead: 1 });
taskFeedbackSchema.index({ feedbackType: 1 });

// Pre-save middleware
taskFeedbackSchema.pre('save', function(next) {
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

// Instance methods
taskFeedbackSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static methods
taskFeedbackSchema.statics.getFeedbackForTask = function(taskId) {
  return this.find({ taskId, isActive: true })
    .populate('fromUser toUser', 'name email role')
    .sort({ createdAt: -1 });
};

taskFeedbackSchema.statics.getFeedbackForUser = function(userId, type = 'received') {
  const query = { isActive: true };
  if (type === 'received') {
    query.toUser = userId;
  } else if (type === 'sent') {
    query.fromUser = userId;
  }
  
  return this.find(query)
    .populate('taskId', 'title type status')
    .populate('fromUser toUser', 'name email role')
    .sort({ createdAt: -1 });
};

taskFeedbackSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    toUser: userId,
    isRead: false,
    isActive: true
  });
};

const TaskFeedback = mongoose.model("TaskFeedback", taskFeedbackSchema);

export default TaskFeedback;