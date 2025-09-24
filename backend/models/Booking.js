// 📁 backend/models/Booking.js
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    checkIn: Date,
    checkOut: Date,
    // ❌ Removed durationHours – can be computed via checkOut - checkIn
    foodPlan: {
      type: String,
      enum: ["None", "Breakfast", "Half Board", "Full Board", "À la carte"],
      default: "None",
    },
    specialMealRequests: String,
    selectedMeals: [
      {
        name: String,
        price: Number,
        description: String,
        scheduledTime: Date,
      },
    ],
    totalPrice: Number,
    
    // Revenue tracking
    basePrice: Number,
    taxes: { type: Number, default: 0 },
    serviceCharges: { type: Number, default: 0 },
    discounts: { type: Number, default: 0 },
    
    // Booking channel for analytics
    bookingChannel: {
      type: String,
      enum: ["direct", "online", "phone", "walk-in", "agent", "corporate"],
      default: "direct",
      index: true,
    },
    
    // Payment information
    paymentMethod: {
      type: String,
      enum: ["cash", "credit_card", "debit_card", "digital_wallet", "bank_transfer"],
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "refunded", "partially_refunded"],
      default: "pending",
    },
    
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Cancelled"],
      default: "Pending",
      index: true,
    },
    cancelledAt: Date,
    confirmedAt: Date,
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
