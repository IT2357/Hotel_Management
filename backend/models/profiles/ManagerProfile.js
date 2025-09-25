import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "Daily",
        "Weekly",
        "Monthly",
        "Quarterly",
        "Annual",
        "AdHoc",
        "Performance",
        "Financial",
      ],
    },
    generatedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    periodStart: Date,
    periodEnd: Date,
    fileUrl: {
      type: String,
      validate: {
        validator: (v) => /^(http|https):\/\/[^ "]+$/.test(v),
        message: (props) => `${props.value} is not a valid URL!`,
      },
    },
    summary: { type: String, trim: true },
    isApproved: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false }
);

const managerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },
    departments: [
      {
        type: String,
        required: true,
        enum: [
          "FrontDesk",
          "Housekeeping",
          "FoodBeverage",
          "Maintenance",
          "Sales",
          "HR",
          "Finance",
        ],
      },
    ],
    employees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    reports: [reportSchema],
    permissions: {
      canApproveLeave: { type: Boolean, default: false },
      canAuthorizePayments: { type: Boolean, default: false },
      canManageInventory: { type: Boolean, default: false },
      canOverridePricing: { type: Boolean, default: false },
      canViewFinancials: { type: Boolean, default: false },
    },
    shift: {
      startTime: { type: String, match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      endTime: { type: String, match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ },
    },
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
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
managerProfileSchema.virtual("fullName").get(function () {
  return this.userId?.name;
});

// Indexes
managerProfileSchema.index({ departments: 1 });

const ManagerProfile = mongoose.model("ManagerProfile", managerProfileSchema);
export default ManagerProfile;
