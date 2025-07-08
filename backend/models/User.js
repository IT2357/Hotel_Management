// 📁 backend/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    profilePicture: { type: String, default: "" },
    phone: String,
    address: {
      country: String,
      city: String,
      street: String,
      postalCode: String,
    },
    emailVerified: { type: Boolean, default: false },
    otp: { code: String, expiresAt: Date },
    socialLogins: [
      {
        provider: String,
        providerId: String,
        accessToken: String,
      },
    ],
    role: {
      type: String,
      enum: ["guest", "staff", "manager", "admin"],
      default: "guest",
    },
    guestProfile: { type: mongoose.Schema.Types.ObjectId, ref: "GuestProfile" },
    staffProfile: { type: mongoose.Schema.Types.ObjectId, ref: "StaffProfile" },
    managerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ManagerProfile",
    },
    adminProfile: { type: mongoose.Schema.Types.ObjectId, ref: "AdminProfile" },
    isActive: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: Date,
    passwordResetToken: { type: String },
    passwordResetExpiry: { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
