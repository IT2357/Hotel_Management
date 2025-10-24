// 📁 backend/models/Booking.js
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    // Core booking information
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    bookingNumber: { type: String, unique: true, sparse: true, index: true },
    // Booking dates
    checkIn: { type: Date, required: true, index: true },
    checkOut: { type: Date, required: true, index: true },

    // Guest information
    guests: { type: Number, default: 1 }, // For backward compatibility with frontend
    guestCount: {
      adults: { type: Number, default: 1 },
      children: { type: Number, default: 0 }
    },
    specialRequests: String,

    // Food and meals
    foodPlan: {
      type: String,
      enum: ["None", "Breakfast", "Half Board", "Full Board", "À la carte"],
      default: "None",
    },
    selectedMeals: [
      {
        name: String,
        price: Number,
        description: String,
        scheduledTime: Date,
      },
    ],

    // Payment method and tracking
    paymentMethod: {
      type: String,
      enum: ["card", "bank", "cash"],
      default: "cash",
      index: true
    },

    // Consolidated status that combines approval and payment states
    status: {
      type: String,
      enum: [
        "Pending Approval",        // Booking submitted, waiting for admin approval
        "On Hold",                // Booking temporarily held
        "Approved - Payment Pending",    // Approved but payment due at hotel (cash)
        "Approved - Payment Processing", // Approved and payment being processed (card/bank)
        "Confirmed",              // Fully paid and confirmed (ready for check-in)
        "Rejected",               // Booking rejected by admin
        "Cancelled",              // Booking cancelled
        "Completed",              // Stay completed
        "No Show"                 // Guest didn't show up
      ],
      default: "Pending Approval",
      index: true
    },

    // Legacy payment status (deprecated - will be removed after migration)
    paymentStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "cancelled"],
      default: "pending",
      index: true
    },

    // Workflow tracking
    holdUntil: Date, // For On Hold status timeout
    rejectedAt: Date,
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rejectedReason: String,
    cancelledAt: Date,
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cancellationReason: String,
    confirmedAt: Date,
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Admin approval tracking
    approvalNotes: String,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,

    // Payment and invoice tracking
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    totalPrice: Number,
    depositAmount: Number,
    depositPaid: { type: Boolean, default: false },

    // Cost breakdown (for detailed pricing)
    costBreakdown: {
      nights: Number,
      roomRate: Number,
      roomCost: Number,
      subtotal: Number,
      tax: Number,
      serviceFee: Number,
      mealPlanCost: Number,
      total: Number,
      currency: { type: String, default: "LKR" },
      deposit: Number,
      depositRequired: Boolean
    },

    // Booking settings (copied from admin settings at booking time)
    bookingSettings: {
      checkInTime: String,
      checkOutTime: String,
      cancellationPolicy: String,
      operationalHours: {
        startTime: String,
        endTime: String,
        allowedDays: [String]
      }
    },

    // Operational time validation
    operationalHoursValid: { type: Boolean, default: true },
    operationalHoursNotes: String,

    // System flags
    isActive: { type: Boolean, default: true },
    requiresReview: { type: Boolean, default: true },
    autoCancelled: { type: Boolean, default: false },
    
    // Review tracking
    hasReview: { type: Boolean, default: false },
   // reviewId: { type: mongoose.Schema.Types.ObjectId, ref: "HotelReview" },

    // Additional booking details
    roomTitle: String, // Room name/title for reference
    roomBasePrice: Number, // Base price per night
    nights: Number, // Number of nights
    source: { type: String, default: 'website' }, // Booking source
    
    // Metadata for tracking and analytics
    metadata: {
      ip: String,
      userAgent: String,
      timestamp: String,
      bookingSource: String,
      version: String
    },

    // Timestamps with workflow
    lastStatusChange: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Indexes for performance
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ roomId: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ status: 1, holdUntil: 1 });

// Pre-save hook to generate booking number
bookingSchema.pre('save', async function(next) {
  if (!this.bookingNumber) {
    let bookingNumber;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const timestamp = this.createdAt ? this.createdAt.getTime() : Date.now();
      const random = Math.random().toString(36).substr(2, 3).toUpperCase();
      bookingNumber = `BK${timestamp}${random}`;

      // Check if booking number already exists
      const existingBooking = await mongoose.model('Booking').findOne({ bookingNumber }).exec();
      if (!existingBooking) {
        break;
      }
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return next(new Error('Could not generate unique booking number'));
    }

    this.bookingNumber = bookingNumber;
  }
  next();
});

// Virtual for stay duration
bookingSchema.virtual('stayDuration').get(function() {
  if (!this.checkIn || !this.checkOut) return 0;
  return Math.ceil((this.checkOut - this.checkIn) / (1000 * 60 * 60 * 24));
});

// Virtual for booking age (days since created)
bookingSchema.virtual('bookingAge').get(function() {
  return Math.ceil((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Instance method to check if booking requires approval
bookingSchema.methods.requiresApproval = function() {
  return this.status === 'Pending Approval';
};

// Instance method to check if booking is on hold
bookingSchema.methods.isOnHold = function() {
  return this.status === 'On Hold' && this.holdUntil > new Date();
};

// Instance method to check if booking is expired
bookingSchema.methods.isExpired = function() {
  return this.status === 'On Hold' && this.holdUntil <= new Date();
};

// Static method to find bookings requiring approval
bookingSchema.statics.findRequiringApproval = function() {
  return this.find({ status: 'Pending Approval' });
};

// Static method to find expired bookings
bookingSchema.statics.findExpired = function() {
  return this.find({
    status: 'On Hold',
    holdUntil: { $lte: new Date() }
  });
};

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
