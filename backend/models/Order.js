// 📁 backend/models/Order.js
import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  name: {
    type: String,
    required: true // Store name for historical purposes
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, "Quantity must be at least 1"]
  },
  price: {
    type: Number,
    required: true,
    min: [0, "Price cannot be negative"]
  },
  selectedPortion: {
    type: String,
    trim: true
  },
  specialInstructions: {
    type: String,
    trim: true,
    maxlength: [500, "Special instructions cannot exceed 500 characters"]
  },
  itemTotal: {
    type: Number,
    required: true,
    min: [0, "Item total cannot be negative"]
  }
}, { _id: true });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  orderType: {
    type: String,
    enum: ['dine-in', 'takeaway'],
    required: [true, "Order type is required"]
  },
  tableNumber: {
    type: String,
    trim: true
    // Only required for dine-in orders
  },
  customerInfo: {
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: [0, "Subtotal cannot be negative"]
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, "Tax cannot be negative"]
  },
  serviceCharge: {
    type: Number,
    default: 0,
    min: [0, "Service charge cannot be negative"]
  },
  total: {
    type: Number,
    required: true,
    min: [0, "Total cannot be negative"]
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Processing', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    enum: ['Card', 'Cash', 'Mobile Wallet']
  },
  paymentId: String, // Payment gateway transaction ID
  estimatedPrepTime: {
    type: Number, // in minutes
    min: [1, "Estimated prep time must be at least 1 minute"]
  },
  actualPrepTime: Number, // in minutes
  orderPlacedAt: {
    type: Date,
    default: Date.now
  },
  confirmedAt: Date,
  readyAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, "Notes cannot exceed 1000 characters"]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.orderNumber) {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      
      // Find the last order number for today
      const lastOrder = await this.constructor
        .findOne({ orderNumber: new RegExp(`^CC${dateStr}`) })
        .sort({ orderNumber: -1 });
      
      let sequence = 1;
      if (lastOrder) {
        const lastSequence = parseInt(lastOrder.orderNumber.slice(-3));
        sequence = lastSequence + 1;
      }
      
      this.orderNumber = `CC${dateStr}${sequence.toString().padStart(3, '0')}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Virtual for order duration
orderSchema.virtual('duration').get(function() {
  if (this.completedAt && this.orderPlacedAt) {
    return Math.round((this.completedAt - this.orderPlacedAt) / (1000 * 60)); // in minutes
  }
  return null;
});

// Indexes for better query performance
// Note: "orderNumber" already has a unique index via the schema field definition
orderSchema.index({ status: 1, orderType: 1 });
orderSchema.index({ orderPlacedAt: -1 });
orderSchema.index({ paymentStatus: 1 });

export default mongoose.model("Order", orderSchema);
