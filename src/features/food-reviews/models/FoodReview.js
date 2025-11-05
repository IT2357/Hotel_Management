const mongoose = require('mongoose');

const foodReviewSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodOrder',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderType: {
    type: String,
    enum: ['dine-in', 'takeaway', 'room-service'],
    required: true
  },
  ratings: {
    food: {
      taste: { type: Number, min: 1, max: 5 },
      freshness: { type: Number, min: 1, max: 5 },
      presentation: { type: Number, min: 1, max: 5 }
    },
    service: {
      staff: { type: Number, min: 1, max: 5 },
      speed: { type: Number, min: 1, max: 5 },
      ambiance: { type: Number, min: 1, max: 5 }
    },
    overall: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    }
  },
  feedback: {
    type: String,
    maxlength: 500
  },
  photos: [{
    type: String // URLs to uploaded images
  }],
  isAnonymous: {
    type: Boolean,
    default: false
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking' // For room service orders
  }
}, {
  timestamps: true
});

// Index for faster queries
foodReviewSchema.index({ orderId: 1 });
foodReviewSchema.index({ userId: 1 });
foodReviewSchema.index({ 'ratings.overall': 1 });

module.exports = mongoose.model('FoodReview', foodReviewSchema);