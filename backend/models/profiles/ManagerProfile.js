// 📁 backend/models/profiles/ManagerProfile.js
import mongoose from "mongoose";

const managerProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
    managesDepartments: [String],
    managesEmployees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    reports: [
      {
        title: String,
        generatedAt: Date,
        fileUrl: String,
      },
    ],
    lastLogin: Date,
  },
  { timestamps: true }
);

const ManagerProfile = mongoose.model("ManagerProfile", managerProfileSchema);
export default ManagerProfile;
