// 📁 backend/models/NotificationTemplate.js
import mongoose from "mongoose";

const notificationTemplateSchema = new mongoose.Schema(
  {
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
        "refund_request_submitted",
        "refund_approved",
        "refund_denied",
        "refund_processed",
        "refund_failed",
        "refund_info_requested",
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
      index: true,
    },
    channel: {
      type: String,
      required: true,
      enum: ["email", "inApp", "sms", "push"],
      index: true,
    },
    subject: {
      type: String,
      required: function () {
        return this.channel === "email";
      },
    },
    body: {
      type: String,
      required: true,
    },
    variables: {
      type: [String],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    defaultPriority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Ensure unique combination of type and channel
notificationTemplateSchema.index({ type: 1, channel: 1 }, { unique: true });

const NotificationTemplate = mongoose.model(
  "NotificationTemplate",
  notificationTemplateSchema
);

export default NotificationTemplate;
