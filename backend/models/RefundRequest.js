import mongoose from "mongoose";

const refundRequestSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    guestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },

    amount: { type: Number, required: true },
    currency: { type: String, default: "LKR" },

    reason: { type: String },
    evidence: [
      {
        type: {
          type: String,
          enum: ["receipt", "email", "document", "photo", "other"],
        },
        description: { type: String },
        fileUrl: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    paymentGatewayRef: { type: String },

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "denied",
        "processed",
        "failed",
        "info_requested",
      ],
      default: "pending",
      required: true,
    },

    // Approval tracking
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    approvedAt: { type: Date },

    // Denial tracking
    deniedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    deniedAt: { type: Date },
    denialReason: { type: String },

    // Info request tracking
    infoRequested: { type: String },
    infoRequestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    infoRequestedAt: { type: Date },

    // Refund processing
    processedAt: { type: Date },
    failureReason: { type: String },
    gatewayResponse: { type: mongoose.Schema.Types.Mixed },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const RefundRequest = mongoose.model("RefundRequest", refundRequestSchema);
export default RefundRequest;
