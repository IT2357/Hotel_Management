import mongoose from "mongoose";

const revenueSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      enum: [
        "room_booking",
        "food_order",
        "event_service",
        "laundry_service",
        "spa_service",
        "transportation",
        "room_service",
        "conference_room",
        "parking",
        "minibar",
        "other_service"
      ],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    baseAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    serviceCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Reference to the source document
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    sourceModel: {
      type: String,
      enum: ["Booking", "FoodOrder", "Service"],
      required: true,
    },
    
    // Customer information
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    customerType: {
      type: String,
      enum: ["guest", "walk-in", "corporate", "event"],
      default: "guest",
    },
    
    // Payment information
    paymentMethod: {
      type: String,
      enum: ["cash", "credit_card", "debit_card", "digital_wallet", "bank_transfer", "corporate_account"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "refunded", "partially_refunded", "failed"],
      default: "completed",
      index: true,
    },
    transactionId: String,
    
    // Booking channel (for bookings)
    bookingChannel: {
      type: String,
      enum: ["direct", "online", "phone", "walk-in", "agent", "corporate"],
    },
    
    // Date tracking
    serviceDate: {
      type: Date,
      required: true,
      index: true,
    },
    receivedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    
    // Additional metadata
    roomNumber: String,
    description: String,
    notes: String,
    
    // Refund information
    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    refundReason: String,
    refundedAt: Date,
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient querying
revenueSchema.index({ source: 1, receivedAt: -1 });
revenueSchema.index({ customerId: 1, receivedAt: -1 });
revenueSchema.index({ serviceDate: -1 });
revenueSchema.index({ paymentStatus: 1, receivedAt: -1 });
revenueSchema.index({ bookingChannel: 1, receivedAt: -1 });

// Compound indexes for analytics
revenueSchema.index({ source: 1, serviceDate: -1, paymentStatus: 1 });
revenueSchema.index({ customerType: 1, receivedAt: -1 });

// Virtual for net revenue (amount - refundAmount)
revenueSchema.virtual('netRevenue').get(function() {
  return this.amount - this.refundAmount;
});

// Virtual for getting revenue month/year
revenueSchema.virtual('revenueMonth').get(function() {
  return {
    year: this.receivedAt.getFullYear(),
    month: this.receivedAt.getMonth() + 1,
  };
});

const Revenue = mongoose.model("Revenue", revenueSchema);
export default Revenue;