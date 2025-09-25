// 📁 backend/models/FoodOrder.js
import mongoose from "mongoose";

const foodOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
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
    subtotal: Number,
    tax: Number,
    serviceCharge: Number,
    deliveryFee: Number,
    orderType: {
      type: String,
      enum: ["dine-in", "takeaway", "delivery"],
      default: "dine-in",
    },
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
      enum: ["CASH", "CARD", "WALLET", "ONLINE"],
      default: "CASH",
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
    review: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String },
      submittedAt: { type: Date },
      isVisible: { type: Boolean, default: true },
      flagged: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

const FoodOrder = mongoose.model("FoodOrder", foodOrderSchema);
export default FoodOrder;
