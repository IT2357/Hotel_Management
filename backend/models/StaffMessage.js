import mongoose from 'mongoose';

const staffMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderRole: {
      type: String,
      required: true,
    },
    // Recipient can be individual staff or team
    recipientType: {
      type: String,
      enum: ['individual', 'team', 'all', 'department'],
      required: true,
      default: 'individual',
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // Required only for individual messages
    },
    recipientName: {
      type: String,
    },
    // For team/department messages
    recipientDepartment: {
      type: String,
      enum: ['Housekeeping', 'Kitchen', 'Maintenance', 'Service', 'All'],
    },
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
      maxlength: 2000,
    },
    messageType: {
      type: String,
      enum: ['announcement', 'task', 'alert', 'feedback', 'general'],
      default: 'general',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['sent', 'read', 'archived'],
      default: 'sent',
    },
    readBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    attachments: [
      {
        filename: String,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
staffMessageSchema.index({ sender: 1, createdAt: -1 });
staffMessageSchema.index({ recipient: 1, createdAt: -1 });
staffMessageSchema.index({ recipientDepartment: 1, createdAt: -1 });
staffMessageSchema.index({ messageType: 1 });
staffMessageSchema.index({ priority: 1 });
staffMessageSchema.index({ status: 1 });

// Virtual for read status
staffMessageSchema.virtual('isRead').get(function () {
  return this.readBy && this.readBy.length > 0;
});

// Method to mark message as read by a user
staffMessageSchema.methods.markAsRead = function (userId) {
  const alreadyRead = this.readBy.some((read) => read.userId.toString() === userId.toString());
  if (!alreadyRead) {
    this.readBy.push({ userId, readAt: new Date() });
    return this.save();
  }
  return this;
};

// Static method to get messages for a user (received)
staffMessageSchema.statics.getMessagesForUser = function (userId, filters = {}) {
  const query = {
    $or: [
      { recipient: userId }, // Direct messages
      { recipientType: 'all' }, // Messages to all staff
    ],
  };

  if (filters.messageType) {
    query.messageType = filters.messageType;
  }
  if (filters.priority) {
    query.priority = filters.priority;
  }
  if (filters.status) {
    query.status = filters.status;
  }

  return this.find(query)
    .populate('sender', 'fullName email role')
    .populate('recipient', 'fullName email role')
    .sort({ createdAt: -1 });
};

// Static method to get messages for a department
staffMessageSchema.statics.getMessagesForDepartment = function (department, filters = {}) {
  const query = {
    $or: [
      { recipientDepartment: department },
      { recipientDepartment: 'All' },
      { recipientType: 'all' },
    ],
  };

  if (filters.messageType) {
    query.messageType = filters.messageType;
  }

  return this.find(query)
    .populate('sender', 'fullName email role')
    .sort({ createdAt: -1 });
};

// Static method to get sent messages by a user
staffMessageSchema.statics.getSentMessages = function (userId, filters = {}) {
  const query = { sender: userId };

  if (filters.messageType) {
    query.messageType = filters.messageType;
  }
  if (filters.priority) {
    query.priority = filters.priority;
  }

  return this.find(query)
    .populate('recipient', 'fullName email role')
    .sort({ createdAt: -1 });
};

const StaffMessage = mongoose.model('StaffMessage', staffMessageSchema);

export default StaffMessage;
