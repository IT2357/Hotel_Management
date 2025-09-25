// 📁 backend/models/StaffNotification.js
import mongoose from "mongoose";

const staffNotificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["task_assigned", "task_updated", "task_completed", "urgent_alert", "system_announcement", "reminder", "approval_required"],
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    department: {
      type: String,
      enum: ["maintenance", "kitchen", "service", "cleaning", "all"],
      required: true,
    },
    recipients: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      readAt: { type: Date },
      acknowledgedAt: { type: Date },
    }],
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    relatedTask: { type: mongoose.Schema.Types.ObjectId, ref: "StaffTask" },
    relatedRoom: { type: String }, // Room number if applicable
    actionRequired: { type: Boolean, default: false },
    actionUrl: { type: String }, // URL to navigate to when notification is clicked
    expiresAt: { type: Date }, // For time-sensitive notifications
    isActive: { type: Boolean, default: true },
    metadata: {
      // Additional data specific to notification type
      taskId: String,
      roomNumber: String,
      guestName: String,
      estimatedTime: String,
      location: String,
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
staffNotificationSchema.index({ department: 1, isActive: 1 });
staffNotificationSchema.index({ "recipients.userId": 1, readAt: 1 });
staffNotificationSchema.index({ type: 1, priority: 1 });
staffNotificationSchema.index({ expiresAt: 1, isActive: 1 });

const StaffNotification = mongoose.model("StaffNotification", staffNotificationSchema);
export default StaffNotification; 