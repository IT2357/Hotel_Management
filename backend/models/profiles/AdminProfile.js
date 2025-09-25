import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema(
  {
    module: {
      type: String,
      required: true,
      enum: [
        "invitations",
        "notification",
        "users",
        "rooms",
        "bookings",
        "inventory",
        "staff",
        "finance",
        "reports",
        "system",
        "settings"
      ],
    },
    actions: [
      {
        type: String,
        enum: [
          "create",
          "read",
          "update",
          "delete",
          "approve",
          "reject",
          "export",
          "manage",
        ],
      },
    ],
  },
  { _id: false }
);

const adminProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },
    permissions: [permissionSchema],
    accessLevel: {
      type: String,
      enum: ["Full", "Departmental", "Limited"],
      default: "Limited",
    },
    activityLogs: [
      {
        action: {
          type: String,
          required: true,
          enum: [
            "create",
            "update",
            "delete",
            "login",
            "logout",
            "approve",
            "reject",
            "export",
          ],
        },
        entityType: {
          type: String,
          required: true,
          enum: [
            "User",
            "Room",
            "Booking",
            "Invoice",
            "Payment",
            "Report",
            "SystemSetting",
          ],
        },
        entityId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        description: { type: String, trim: true },
        ipAddress: { type: String, trim: true },
        userAgent: { type: String, trim: true },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    lastLogin: {
      timestamp: Date,
      ipAddress: String,
      device: String,
    },
    loginHistory: [
      {
        timestamp: Date,
        ipAddress: String,
        device: String,
        location: String,
      },
    ],
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    restrictedAccessHours: {
      start: { type: String, match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      end: { type: String, match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ },
    },
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
adminProfileSchema.index({ "permissions.module": 1 });

const AdminProfile = mongoose.model("AdminProfile", adminProfileSchema);
export default AdminProfile;
