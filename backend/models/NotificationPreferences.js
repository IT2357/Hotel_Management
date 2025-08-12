// 📁 backend/models/NotificationPreferences.js
import mongoose from "mongoose";

const notificationPreferencesSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    userType: {
      type: String,
      enum: ["guest", "staff", "manager", "admin"],
      required: true,
    },
    preferences: {
      type: Map,
      of: new mongoose.Schema({
        email: { type: Boolean, default: true },
        inApp: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      }),
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add index for faster lookups
notificationPreferencesSchema.index({ userId: 1, userType: 1 });

// Static method to get or create preferences
notificationPreferencesSchema.statics.getOrCreate = async function (
  userId,
  userType
) {
  let preferences = await this.findOne({ userId });

  if (!preferences) {
    preferences = await this.create({
      userId,
      userType,
      preferences: getDefaultPreferences(userType),
    });
  }

  return preferences;
};

// Helper function for default preferences
function getDefaultPreferences(userType) {
  const defaults = {
    // Guest defaults
    booking_confirmation: { email: true, inApp: true, sms: false },
    payment_receipt: { email: true, inApp: true, sms: false },
    payment_failed: { email: true, inApp: true, sms: true },
    checkin_reminder: { email: true, inApp: true, sms: true },
    checkout_reminder: { email: false, inApp: true, sms: false },
    food_order_confirmation: { email: false, inApp: true, sms: false },
    food_order_ready: { email: false, inApp: true, sms: false },
    service_request_update: { email: false, inApp: true, sms: false },
    cancellation_confirmation: { email: true, inApp: true, sms: false },
    refund_update: { email: true, inApp: true, sms: false },
    review_request: { email: true, inApp: true, sms: false },
  };

  if (userType === "staff" || userType === "manager") {
    defaults.task_assigned = { email: true, inApp: true, sms: true };
    defaults.task_reminder = { email: false, inApp: true, sms: true };
    defaults.task_overdue = { email: true, inApp: true, sms: true };
    defaults.shift_scheduled = { email: true, inApp: true, sms: true };
    defaults.shift_reminder = { email: false, inApp: true, sms: true };
    defaults.shift_change = { email: true, inApp: true, sms: true };
    defaults.manager_message = { email: true, inApp: true, sms: true };
    defaults.emergency_alert = { email: true, inApp: true, sms: true };
  }

  if (userType === "manager" || userType === "admin") {
    defaults.staff_alert = { email: true, inApp: true, sms: true };
    defaults.guest_complaint = { email: true, inApp: true, sms: true };
    defaults.system_alert = { email: true, inApp: true, sms: true };
    defaults.inventory_alert = { email: true, inApp: true, sms: false };
    defaults.high_occupancy_alert = { email: true, inApp: true, sms: true };
  }

  if (userType === "admin") {
    defaults.system_error = { email: true, inApp: true, sms: true };
    defaults.security_alert = { email: true, inApp: true, sms: true };
    defaults.financial_alert = { email: true, inApp: true, sms: true };
    defaults.audit_log = { email: false, inApp: true, sms: false };
    defaults.admin_activity = { email: false, inApp: true, sms: false };
  }

  // System notifications for testing (available to all)
  defaults.test_notification = { email: false, inApp: true, sms: false };

  return defaults;
}

const NotificationPreferences = mongoose.model(
  "NotificationPreferences",
  notificationPreferencesSchema
);

export default NotificationPreferences;
