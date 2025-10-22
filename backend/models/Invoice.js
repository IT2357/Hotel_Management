// 📁 backend/models/Invoice.js
import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    checkInOutId: { type: mongoose.Schema.Types.ObjectId, ref: "CheckInOut" }, // NEW: For overstay invoices
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
        "Failed",                   // Payment failed
        "Awaiting Approval"         // NEW: For overstay cash payments awaiting admin approval
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
        enum: ['room', 'meal', 'meal_plan', 'tax', 'service_fee', 'additional', 'discount', 'overstay_charge'],
        default: 'room'
      },
      metadata: mongoose.Schema.Types.Mixed // For storing additional item-specific data
    }],
    statusNotes: String,
    
    // NEW: Overstay tracking fields
    overstayTracking: {
      isOverstayInvoice: { type: Boolean, default: false },
      originalCheckOutDate: Date,
      currentCheckOutDate: Date,
      daysOverstayed: Number,
      dailyRate: Number, // Room rate for overstay calculation (typically 1.5x base rate)
      chargeBreakdown: {
        baseCharges: Number,
        accumulatedCharges: Number
      },
      lastUpdatedAt: Date,
      updatedByAdmin: Boolean, // Tracks if charges were manually adjusted
      adjustmentNotes: String // Admin notes for any manual adjustments
    },
    
    // NEW: Payment approval tracking for cash payments
    paymentApproval: {
      approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin who approved
      approvalNotes: String,
      approvedAt: Date,
      rejectionReason: String,
      rejectionDate: Date
    }
  },
  { timestamps: true }
);

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
