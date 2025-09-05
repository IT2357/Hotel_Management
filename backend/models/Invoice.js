// 📁 backend/models/Invoice.js
import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    foodOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "FoodOrder" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    invoiceNumber: { type: String, unique: true, index: true },
    amount: Number,
    currency: { type: String, default: "LKR" },
    taxRate: Number,
    discountApplied: Number,
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Refunded", "Failed"],
      default: "Pending",
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Credit Card", "Online", "Wallet"],
      default: "Cash",
    },
    transactionId: String,
    issuedAt: Date,
    paidAt: Date,
  },
  { timestamps: true }
);

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
