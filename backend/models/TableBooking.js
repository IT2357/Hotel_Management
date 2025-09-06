// 📁 backend/models/TableBooking.js
import mongoose from "mongoose";

const tableBookingSchema = new mongoose.Schema({
  bookingNumber: {
    type: String,
    unique: true
  },
  customerInfo: {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  bookingDate: {
    type: Date,
    required: [true, "Booking date is required"],
    index: true
  },
  bookingTime: {
    type: String,
    required: [true, "Booking time is required"],
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: "Please provide a valid time in HH:MM format"
    }
  },
  partySize: {
    type: Number,
    required: [true, "Party size is required"],
    min: [1, "Party size must be at least 1"],
    max: [20, "Party size cannot exceed 20"]
  },
  tableNumber: {
    type: String,
    trim: true
  },
  specialRequests: {
    type: String,
    trim: true,
    maxlength: [500, "Special requests cannot exceed 500 characters"]
  },
  dietaryRequirements: [{
    type: String,
    enum: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher']
  }],
  occasion: {
    type: String,
    enum: ['birthday', 'anniversary', 'business', 'date', 'family', 'celebration', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Arrived', 'Seated', 'Completed', 'No Show', 'Cancelled'],
    default: 'Pending',
    index: true
  },
  confirmationSentAt: Date,
  reminderSentAt: Date,
  arrivedAt: Date,
  seatedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, "Notes cannot exceed 1000 characters"]
  },
  estimatedDuration: {
    type: Number, // in minutes
    default: 120 // 2 hours default
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Generate booking number before saving
tableBookingSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.bookingNumber) {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      
      // Find the last booking number for today
      const lastBooking = await this.constructor
        .findOne({ bookingNumber: new RegExp(`^TB${dateStr}`) })
        .sort({ bookingNumber: -1 });
      
      let sequence = 1;
      if (lastBooking) {
        const lastSequence = parseInt(lastBooking.bookingNumber.slice(-3));
        sequence = lastSequence + 1;
      }
      
      this.bookingNumber = `TB${dateStr}${sequence.toString().padStart(3, '0')}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Virtual for full booking datetime
tableBookingSchema.virtual('bookingDateTime').get(function() {
  if (this.bookingDate && this.bookingTime) {
    const [hours, minutes] = this.bookingTime.split(':');
    const date = new Date(this.bookingDate);
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return date;
  }
  return null;
});

// Virtual for estimated end time
tableBookingSchema.virtual('estimatedEndTime').get(function() {
  const startTime = this.bookingDateTime;
  if (startTime && this.estimatedDuration) {
    return new Date(startTime.getTime() + (this.estimatedDuration * 60 * 1000));
  }
  return null;
});

// Compound indexes for better query performance
tableBookingSchema.index({ bookingDate: 1, bookingTime: 1 });
tableBookingSchema.index({ userId: 1, status: 1 });
tableBookingSchema.index({ "customerInfo.email": 1 });

export default mongoose.model("TableBooking", tableBookingSchema);