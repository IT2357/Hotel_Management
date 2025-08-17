// 📁 backend/models/RefundRequest.js
import mongoose from "mongoose";

const refundRequestSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    guestId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
    amount: Number,
    reason: String,
    evidence: String, // For attaching documents or evidence
    paymentGatewayRef: String, // For storing payment gateway reference
    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Denied",
        "Processing",
        "Failed",
        "Pending - Awaiting Info",
      ],
      default: "Pending",
    },
    processedAt: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const RefundRequest = mongoose.model("RefundRequest", refundRequestSchema);
export default RefundRequest;
