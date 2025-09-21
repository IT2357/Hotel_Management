import mongoose from "mongoose";

const smsLogSchema = new mongoose.Schema(
  {
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SMSTemplate",
    },
    templateType: {
      type: String,
      enum: [
        'booking_confirmation',
        'payment_confirmation',
        'checkin_reminder',
        'checkout_reminder',
        'booking_cancellation',
        'payment_failed',
        'custom_notification',
        'welcome_message',
        'feedback_request',
        'test_sms'
      ],
    },
    to: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 160,
    },
    provider: {
      type: String,
      required: true,
      enum: ['twilio', 'aws-sns', 'nexmo', 'dialog', 'mobitel'],
    },
    messageId: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['sent', 'delivered', 'failed', 'pending'],
      default: 'sent',
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    deliveredAt: {
      type: Date,
    },
    failedAt: {
      type: Date,
    },
    failureReason: {
      type: String,
    },
    cost: {
      type: Number,
      min: 0,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    retryCount: {
      type: Number,
      default: 0,
      max: 3,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
smsLogSchema.index({ to: 1, createdAt: -1 });
smsLogSchema.index({ status: 1, createdAt: -1 });
smsLogSchema.index({ provider: 1, createdAt: -1 });
smsLogSchema.index({ templateType: 1, createdAt: -1 });
smsLogSchema.index({ sentBy: 1, createdAt: -1 });
smsLogSchema.index({ messageId: 1 });

// Virtual for delivery time
smsLogSchema.virtual('deliveryTime').get(function() {
  if (this.deliveredAt && this.sentAt) {
    return this.deliveredAt - this.sentAt;
  }
  return null;
});

// Static methods
smsLogSchema.statics.getDeliveryStats = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalCost: { $sum: '$cost' }
      }
    }
  ]);
};

smsLogSchema.statics.getProviderStats = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$provider',
        total: { $sum: 1 },
        sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
        delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        totalCost: { $sum: '$cost' }
      }
    }
  ]);
};

// Instance method to mark as delivered
smsLogSchema.methods.markDelivered = function() {
  this.status = 'delivered';
  this.deliveredAt = new Date();
  return this.save();
};

// Instance method to mark as failed
smsLogSchema.methods.markFailed = function(reason) {
  this.status = 'failed';
  this.failedAt = new Date();
  this.failureReason = reason;
  return this.save();
};

const SMSLog = mongoose.model("SMSLog", smsLogSchema);

export default SMSLog;
