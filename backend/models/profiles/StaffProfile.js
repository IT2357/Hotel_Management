// 📁 backend/models/profiles/StaffProfile.js
import mongoose from "mongoose";

const staffProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
    department: {
      type: String,
      enum: ["Reception", "Housekeeping", "Kitchen", "Maintenance"],
    },
    shift: { type: String, enum: ["Morning", "Evening", "Night"] },
    assignedRooms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Room" }],
    assignedTasks: [
      {
        task: String,
        status: {
          type: String,
          enum: ["Pending", "In Progress", "Completed"],
          default: "Pending",
        },
        date: Date,
        notes: String,
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const StaffProfile = mongoose.model("StaffProfile", staffProfileSchema);
export default StaffProfile;
