import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: "LKR",
      enum: ["LKR", "USD", "EUR", "GBP", "CAD", "AUD", "JPY", "INR"],
    },
    provider: {
      type: String,
      required: true,
      enum: ["payhere", "stripe", "paypal"],
      default: "payhere",
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "success", "failed", "cancelled", "refunded", "charged_back"],
      default: "pending",
    },
    paymentId: {
      type: String,
      index: true,
    },
    paymentData: {
      type: mongoose.Schema.Types.Mixed,
    },
    transactionData: {
      type: mongoose.Schema.Types.Mixed,
    },
    refundAmount: {
      type: Number,
    },
    refundReason: {
      type: String,
    },
    refundedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ provider: 1, status: 1 });
paymentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for formatted amount
paymentSchema.virtual("formattedAmount").get(function () {
  return `${this.currency} ${this.amount.toFixed(2)}`;
});

// Instance method to check if payment is expired
paymentSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt;
};

// Static method to find payments by user
paymentSchema.statics.findByUser = function (userId, status = null) {
  const query = { userId };
  if (status) {
    query.status = status;
  }
  return this.find(query).sort({ createdAt: -1 });
};

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
