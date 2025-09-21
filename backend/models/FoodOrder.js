// 📁 backend/models/FoodOrder.js
import mongoose from "mongoose";

const foodOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        foodId: { type: mongoose.Schema.Types.ObjectId, ref: "Food" },
        quantity: { type: Number, default: 1 },
        price: { type: Number },
        name: { type: String },
      },
    ],
    scheduledTime: Date,
    deliveryLocation: String,
    totalPrice: Number,
    isTakeaway: {
      type: Boolean,
      default: false,
    },
    customerDetails: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
      deliveryAddress: { type: String },
      specialInstructions: { type: String },
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Refunded", "Failed"],
      default: "Pending",
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Card", "Wallet", "Online"],
      default: "Cash",
    },
    paymentId: {
      type: String,
      required: false,
    },
    transactionId: {
      type: String,
      required: false,
    },
    paymentGateway: {
      type: String,
      enum: ["PayHere", "Stripe", "PayPal", "Other"],
      default: "PayHere",
    },
    status: {
      type: String,
      enum: ["Pending", "Preparing", "Delivered", "Cancelled"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

const FoodOrder = mongoose.model("FoodOrder", foodOrderSchema);
export default FoodOrder;
