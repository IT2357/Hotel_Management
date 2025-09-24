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
      enum: [
        "Draft",                    // Invoice created but not sent
        "Sent - Payment Pending",   // Invoice sent, waiting for payment
        "Sent - Payment Processing", // Invoice sent, payment in progress
        "Paid",                     // Invoice fully paid
        "Overdue",                  // Payment past due date
        "Cancelled",                // Invoice cancelled
        "Refunded",                 // Payment refunded
        "Failed"                    // Payment failed
      ],
      default: "Draft",
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
      quantity: { type: Number, default: 1 },
      unitPrice: Number,
      amount: Number,
      type: {
        type: String,
        enum: ['room', 'meal', 'meal_plan', 'tax', 'service_fee', 'additional', 'discount'],
        default: 'room'
      },
      metadata: mongoose.Schema.Types.Mixed // For storing additional item-specific data
    }],
    statusNotes: String,
  },
  { timestamps: true }
);

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
