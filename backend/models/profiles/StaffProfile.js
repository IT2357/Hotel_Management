import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    task: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Failed"],
      default: "Pending",
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      validate: {
        validator: function (v) {
          return v >= this.date;
        },
        message: "Due date must be after creation date",
      },
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
  },
  { _id: true }
);

const staffProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },
    department: {
      type: String,
      enum: ["Housekeeping", "Kitchen", "Maintenance", "Service"],
      required: true,
    },
    position: {
      type: String,
      trim: true,
      required: true,
    },
    shifts: [
      {
        day: {
          type: String,
          enum: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
          required: true,
        },
        startTime: {
          type: String,
          required: true,
          match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        endTime: {
          type: String,
          required: true,
          match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
      },
    ],
    assignedRooms: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
      },
    ],
    assignedTasks: [taskSchema],
    qualifications: [
      {
        name: { type: String, trim: true },
        issuingAuthority: { type: String, trim: true },
        issueDate: Date,
        expiryDate: Date,
        document: String,
      },
    ],
    emergencyContact: {
      name: { type: String, trim: true },
      relationship: { type: String, trim: true },
      phone: {
        type: String,
        validate: {
          validator: function (v) {
            return /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/.test(v);
          },
          message: (props) => `${props.value} is not a valid phone number!`,
        },
      },
    },
    isActive: { type: Boolean, default: true },
    joinedDate: {
      type: Date,
      default: Date.now,
    },
    performanceReviews: [
      {
        date: { type: Date, default: Date.now },
        reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        rating: { type: Number, min: 1, max: 5 },
        comments: { type: String, trim: true },
      },
    ],
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
staffProfileSchema.virtual("fullName").get(function () {
  return this.userId?.name;
});
staffProfileSchema.virtual("email").get(function () {
  return this.userId?.email;
});
staffProfileSchema.virtual("phone").get(function () {
  return this.userId?.phone;
});

// Indexes
staffProfileSchema.index({ department: 1 });
staffProfileSchema.index({ position: 1 });
staffProfileSchema.index({ isActive: 1 });

const StaffProfile = mongoose.model("StaffProfile", staffProfileSchema);
export default StaffProfile;
