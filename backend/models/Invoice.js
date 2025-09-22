// 📁 backend/models/Invoice.js
import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    foodOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "FoodOrder" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    invoiceNumber: { type: String, unique: true, index: true },
    amount: Number,
    totalAmount: Number,
    currency: { type: String, default: "LKR" },
    taxRate: Number,
    discountApplied: Number,
    status: {
      type: String,
      enum: ["Draft", "Sent", "Paid", "Overdue", "Cancelled", "Pending"],
      default: "Draft",
    },
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
    issuedAt: { type: Date, default: Date.now },
    dueDate: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, // 7 days from now
    paidAt: Date,
    overdueAt: Date,
    items: [{
      description: String,
      amount: Number,
      quantity: { type: Number, default: 1 }
    }],
    statusNotes: String,
  },
  { timestamps: true }
);

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
