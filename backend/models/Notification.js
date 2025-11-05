// 📁 backend/models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userType: {
      type: String,
      enum: ["guest", "staff", "manager", "admin"],
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        // Guest notifications
        "booking_confirmation",
        "payment_receipt",
        "payment_failed",
        "checkin_reminder",
        "checkout_reminder",
        "food_order_confirmation",
        "food_order_ready",
        "service_request_update",
        "cancellation_confirmation",
        "refund_update",
        "review_request",
        // Staff notifications
        "task_assigned",
        "task_reminder",
        "task_overdue",
        "shift_scheduled",
        "shift_reminder",
        "shift_change",
        "manager_message",
        "emergency_alert",
        // Manager notifications
        "staff_alert",
        "guest_complaint",
        "system_alert",
        "inventory_alert",
        "high_occupancy_alert",
        // Admin notifications
        "system_error",
        "security_alert",
        "financial_alert",
        "audit_log",
        "admin_activity",
        // System notifications
        "test_notification",
      ],
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    channel: {
      type: String,
      required: true,
      enum: ["email", "inApp", "sms", "push"],
      default: "inApp",
    },
    status: {
      type: String,
      enum: ["pending", "sent", "delivered", "failed", "read"],
      default: "pending",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    error: {
      type: String,
      trim: true,
    },
    readAt: {
      type: Date,
    },
    actionUrl: {
      type: String,
      trim: true,
      validate: {
        validator: (v) => !v || /^(http|https):\/\/[^ "]+$/.test(v),
        message: (props) => `${props.value} is not a valid URL!`,
      },
    },
    expiryDate: {
      type: Date,
      index: true,
      expires: 0, // Auto-delete after this date
    },
    deleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({
  userId: 1,
  userType: 1,
  "metadata.department": 1,
  deleted: 1,
});

// Virtual for days since creation
notificationSchema.virtual("daysOld").get(function () {
  const diff = new Date() - this.createdAt;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
