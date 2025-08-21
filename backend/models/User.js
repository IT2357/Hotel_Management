import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        message: (props) => `${props.value} is not a valid email address!`,
      },
    },
    password: {
      type: String,
      minlength: 8,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    profilePicture: {
      type: String,
      default: "",
      validate: {
        validator: (v) => v === "" || /^(http|https):\/\/[^ "]+$/.test(v),
        message: (props) => `${props.value} is not a valid URL!`,
      },
    },
    address: {
      country: { type: String, trim: true },
      city: { type: String, trim: true },
      street: { type: String, trim: true },
      postalCode: { type: String, trim: true },
    },
    emailVerified: { type: Boolean, default: false },
    otpCode: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },
    role: {
      type: String,
      enum: ["guest", "staff", "manager", "admin"],
      default: "guest",
      required: true,
    },
    isActive: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: false },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
    passwordResetToken: { type: String, select: false },
    passwordResetExpiry: { type: Date, select: false },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
    },
    passwordResetPending: {
      type: Boolean,
      default: false,
    },
    tokenVersion: {
      type: Number,
      default: 0,
      select: false,
    },
    lastLogin: Date,
    loginHistory: [
      {
        ipAddress: String,
        device: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    authProviders: [
      {
        provider: { type: String, enum: ["google", "apple"] },
        providerId: { type: String },
        email: { type: String },
      },
    ],
  },
  {
    timestamps: true,
    discriminatorKey: "role",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save hook for password handling
userSchema.pre("save", async function (next) {
  if (this.isNew || this.isModified("password")) {
    if (this.authProviders.length === 0) {
      if (!this.password) {
        return next(new Error("Password is required for local authentication"));
      }
      this.password = await bcrypt.hash(this.password, 12);
    } else {
      this.password = undefined;
    }
  }
  next();
});

// Indexes (remove explicit email index; handled by unique: true)
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Base User model
const User = mongoose.model("User", userSchema);

// Discriminators
const Guest = User.discriminator(
  "guest",
  new mongoose.Schema({
    guestProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GuestProfile",
    },
  })
);
const Staff = User.discriminator(
  "staff",
  new mongoose.Schema({
    staffProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffProfile",
    },
  })
);
const Manager = User.discriminator(
  "manager",
  new mongoose.Schema({
    managerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ManagerProfile",
    },
  })
);
const Admin = User.discriminator(
  "admin",
  new mongoose.Schema({
    adminProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminProfile",
    },
  })
);

export { User, Guest, Staff, Manager, Admin };
