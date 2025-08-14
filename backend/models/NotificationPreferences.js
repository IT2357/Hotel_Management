// 📁 backend/models/NotificationPreferences.js
import mongoose from "mongoose";

// Helper function for default preferences
export function getDefaultPreferences(userType) {
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
    Object.assign(defaults, {
      task_assigned: { email: true, inApp: true, sms: true },
      task_reminder: { email: false, inApp: true, sms: true },
      task_overdue: { email: true, inApp: true, sms: true },
      shift_scheduled: { email: true, inApp: true, sms: true },
      shift_reminder: { email: false, inApp: true, sms: true },
      shift_change: { email: true, inApp: true, sms: true },
      manager_message: { email: true, inApp: true, sms: true },
      emergency_alert: { email: true, inApp: true, sms: true },
    });
  }

  if (userType === "manager" || userType === "admin") {
    Object.assign(defaults, {
      staff_alert: { email: true, inApp: true, sms: true },
      guest_complaint: { email: true, inApp: true, sms: true },
      system_alert: { email: true, inApp: true, sms: true },
      inventory_alert: { email: true, inApp: true, sms: false },
      high_occupancy_alert: { email: true, inApp: true, sms: true },
    });
  }

  if (userType === "admin") {
    Object.assign(defaults, {
      system_error: { email: true, inApp: true, sms: true },
      security_alert: { email: true, inApp: true, sms: true },
      financial_alert: { email: true, inApp: true, sms: true },
      audit_log: { email: false, inApp: true, sms: false },
      admin_activity: { email: false, inApp: true, sms: false },
    });
  }

  // System notifications for testing (available to all)
  defaults.test_notification = { email: false, inApp: true, sms: false };
  defaults.admin_message = { email: true, inApp: true, sms: false };

  return defaults;
}

// Schema definition
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
      validate: {
        validator: function (prefs) {
          const allowedKeys = Object.keys(getDefaultPreferences(this.userType));
          return [...prefs.keys()].every((key) => allowedKeys.includes(key));
        },
        message: (props) =>
          `Invalid preference keys for userType "${props.value}".`,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for fast lookup
notificationPreferencesSchema.index({ userId: 1, userType: 1 });

// Pre-save hook to clean up invalid keys
notificationPreferencesSchema.pre("save", function (next) {
  const allowedKeys = Object.keys(getDefaultPreferences(this.userType));
  for (const key of this.preferences.keys()) {
    if (!allowedKeys.includes(key)) {
      this.preferences.delete(key);
    }
  }
  next();
});

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

const NotificationPreferences = mongoose.model(
  "NotificationPreferences",
  notificationPreferencesSchema
);

export default NotificationPreferences;
