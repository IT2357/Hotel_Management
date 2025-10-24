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
        foodId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
        quantity: { type: Number, default: 1 },
        price: { type: Number },
        name: { type: String },
      },
    ],
    scheduledTime: Date,
    deliveryLocation: String,
    totalPrice: Number,
    currency: {
      type: String,
      default: 'LKR',
      enum: ['LKR'],
      required: true
    },
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
    // Dine-in specific fields
    tableNumber: {
      type: String,
      required: function() {
        return this.orderType === 'dine-in';
      }
    },
    // Takeaway specific fields
    pickupTime: {
      type: Number, // minutes from order time
      required: function() {
        return this.orderType === 'takeaway';
      }
    },
    pickupCode: {
      type: String,
      required: function() {
        return this.orderType === 'takeaway';
      }
    },
    // Order priority (dine-in gets higher priority)
    priorityLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: function() {
        return this.orderType === 'dine-in' ? 'high' : 'medium';
      }
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
      enum: ["pending", "paid", "refunded", "failed"],
      default: "pending",
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
      enum: ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled", "modified"],
      default: "pending",
    },
    kitchenStatus: {
      type: String,
      enum: ["pending", "assigned", "preparing", "ready", "delivered", "cancelled"],
      default: "pending",
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    taskHistory: [
      {
        status: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        updatedAt: { type: Date, default: Date.now },
        note: String,
      },
    ],
    modificationHistory: [
      {
        timestamp: { type: Date, default: Date.now },
        changes: { type: Object },
      }
    ],
    notes: { type: String },
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
