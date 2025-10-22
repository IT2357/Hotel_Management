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
    damageReport: String,
    // ⚠️ SECURITY: Track overstay violations
    overstay: {
      detected: { type: Boolean, default: false },
      daysOverstayed: { type: Number, default: 0 },
      detectedAt: Date,
      scheduledCheckoutDate: Date,
      actualCheckoutDate: Date,
      chargeAmount: Number,
      chargePending: { type: Boolean, default: true },
      // NEW: Invoice tracking for overstay
      invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
      paymentMethod: String, // 'cash', 'bank', 'card'
      paymentStatus: {
        type: String,
        enum: ['pending_payment', 'pending_approval', 'approved', 'paid', 'rejected'],
        default: 'pending_payment'
      },
      paymentReference: String,
      // Track if guest can checkout (only after payment approval/completion)
      canCheckout: { type: Boolean, default: false },
      approvalNotes: String
    },
    // Early check-in details (if allowed by management)
    earlyCheckInApproved: { type: Boolean, default: false },
    earlyCheckInApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    earlyCheckInApprovedAt: Date,
    earlyCheckInReason: String,
    // Late checkout details (if allowed by management)
    lateCheckOutApproved: { type: Boolean, default: false },
    lateCheckOutApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lateCheckOutApprovedAt: Date,
    lateCheckOutReason: String,
    // Booking period reference for validation
    bookedCheckInDate: Date,
    bookedCheckOutDate: Date
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
