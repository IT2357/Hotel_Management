import mongoose from "mongoose";

const checkInOutSchema = new mongoose.Schema(
  {
    booking: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Booking", 
      required: true 
    },
    guest: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    room: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Room", 
      required: true 
    },
    checkInTime: { type: Date },
    checkOutTime: { type: Date },
    checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    checkedOutBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    documentScan: {
      type: {
        documentType: { type: String, enum: ["passport", "id", "driver_license", "other"] },
        frontImage: String,
        backImage: String,
        verified: { type: Boolean, default: false },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        verifiedAt: { type: Date }
      },
      required: true
    },
    keyCardNumber: { type: String },
    keyCardAssignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    keyCard: { type: mongoose.Schema.Types.ObjectId, ref: "KeyCard" },
    keyCardReturned: { type: Boolean, default: false },
    preferences: {
      roomService: { type: Boolean, default: false },
      housekeeping: { type: String, enum: ["morning", "evening", "both", "none"], default: "morning" },
      doNotDisturb: { type: Boolean, default: false },
      specialRequests: String
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
      email: String
    },
    status: {
      type: String,
      enum: ["pre_checkin", "checked_in", "checked_out", "no_show"],
      default: "pre_checkin"
    },
    notes: [{
      content: String,
      addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      addedAt: { type: Date, default: Date.now }
    }],
    earlyCheckIn: { type: Boolean, default: false },
    lateCheckOut: { type: Boolean, default: false },
    depositAmount: { type: Number },
    depositReturned: { type: Boolean, default: false },
    damageReport: String
  },
  { timestamps: true }
);

// Indexes for better query performance
checkInOutSchema.index({ guest: 1, status: 1 });
checkInOutSchema.index({ room: 1, status: 1 });
checkInOutSchema.index({ checkInTime: 1 });
checkInOutSchema.index({ checkOutTime: 1 });

const CheckInOut = mongoose.model("CheckInOut", checkInOutSchema);
export default CheckInOut;
