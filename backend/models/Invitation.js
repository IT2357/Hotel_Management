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

const invitationSchema = new mongoose.Schema({
  email: { type: String, required: true },
  role: {
    type: String,
    required: true,
    enum: ["staff", "manager", "admin"],
  },
  // Optional staff-specific fields
  department: {
    type: String,
    enum: ["Housekeeping", "Kitchen", "Maintenance", "Service"],
  },
  position: {
    type: String,
    trim: true,
  },
  // Optional granular permissions for admin invites
  permissions: { type: [permissionSchema], default: undefined },
  token: { type: String, required: true, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Invitation", invitationSchema);
