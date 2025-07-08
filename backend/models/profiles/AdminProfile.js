// 📁 backend/models/profiles/AdminProfile.js
import mongoose from "mongoose";

const adminProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
    permissions: [
      {
        type: String,
        enum: [
          "create-user",
          "delete-room",
          "update-booking",
          "view-reports",
          "manage-system",
          "issue-invoice",
          "assign-tasks",
        ],
      },
    ],
    activityLogs: [
      {
        action: String,
        entityType: String, // E.g., 'Room', 'User', 'Invoice'
        entityId: { type: mongoose.Schema.Types.ObjectId },
        description: String,
        timestamp: Date,
      },
    ],
  },
  { timestamps: true }
);

const AdminProfile = mongoose.model("AdminProfile", adminProfileSchema);
export default AdminProfile;
