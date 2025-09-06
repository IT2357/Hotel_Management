// 📁 backend/models/Review.js
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    // Can be either order or menu item review
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      index: true,
    },
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewerName: {
      type: String,
      required: true,
      trim: true
    },
    reviewType: {
      type: String,
      enum: ['restaurant', 'menu-item'],
      required: true,
      default: 'restaurant'
    },
    ratings: {
      overall: { 
        type: Number, 
        required: true,
        min: [1, "Rating must be between 1 and 5"], 
        max: [5, "Rating must be between 1 and 5"] 
      },
      food: { type: Number, min: 1, max: 5 },
      service: { type: Number, min: 1, max: 5 },
      ambiance: { type: Number, min: 1, max: 5 },
      valueForMoney: { type: Number, min: 1, max: 5 },
      cleanliness: { type: Number, min: 1, max: 5 }
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, "Review title cannot exceed 100 characters"]
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, "Review comment cannot exceed 2000 characters"]
    },
    images: [{
      url: String,
      publicId: String, // For Cloudinary
      caption: String
    }],
    visitDate: {
      type: Date,
      required: true
    },
    visitType: {
      type: String,
      enum: ['dine-in', 'takeaway', 'delivery'],
      required: true
    },
    partySize: {
      type: Number,
      min: 1
    },
    wouldRecommend: {
      type: Boolean,
      default: true
    },
    tags: [{
      type: String,
      enum: [
        'excellent-food', 'great-service', 'cozy-atmosphere', 'good-value',
        'fast-service', 'fresh-ingredients', 'authentic-taste', 'clean-place',
        'friendly-staff', 'romantic-setting', 'family-friendly', 'pet-friendly',
        'vegetarian-options', 'vegan-options', 'gluten-free-options', 
        'halal-certified', 'spicy-food', 'mild-flavors', 'large-portions'
      ]
    }],
    restaurantResponse: {
      message: String,
      respondedAt: Date,
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    },
    isVerifiedCustomer: {
      type: Boolean,
      default: false
    },
    isVisible: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    flagged: { type: Boolean, default: false },
    flagReason: String,
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    sentimentLabel: {
      type: String,
      enum: ["Positive", "Neutral", "Negative"],
    },
    helpfulVotes: {
      type: Number,
      default: 0
    },
    totalVotes: {
      type: Number,
      default: 0
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for helpful percentage
reviewSchema.virtual('helpfulPercentage').get(function() {
  if (this.totalVotes > 0) {
    return Math.round((this.helpfulVotes / this.totalVotes) * 100);
  }
  return 0;
});

// Virtual for average rating calculation (for restaurant reviews)
reviewSchema.virtual('averageRating').get(function() {
  const ratings = this.ratings;
  const ratingValues = [ratings.food, ratings.service, ratings.ambiance, ratings.valueForMoney, ratings.cleanliness].filter(r => r != null);
  
  if (ratingValues.length > 0) {
    return Math.round((ratingValues.reduce((sum, rating) => sum + rating, 0) / ratingValues.length) * 10) / 10;
  }
  
  return ratings.overall;
});

// Ensure either orderId or menuItemId is provided, not both
reviewSchema.pre('validate', function(next) {
  if (this.reviewType === 'restaurant' && !this.orderId) {
    this.invalidate('orderId', 'Order ID is required for restaurant reviews');
  }
  if (this.reviewType === 'menu-item' && !this.menuItemId) {
    this.invalidate('menuItemId', 'Menu Item ID is required for menu item reviews');
  }
  if (this.orderId && this.menuItemId) {
    this.invalidate('orderId', 'Cannot review both order and menu item in the same review');
  }
  next();
});

// Compound indexes for better query performance
reviewSchema.index({ orderId: 1, userId: 1 });
reviewSchema.index({ menuItemId: 1, isVisible: 1 });
reviewSchema.index({ 'ratings.overall': -1, createdAt: -1 });
reviewSchema.index({ isVisible: 1, isFeatured: 1 });
reviewSchema.index({ moderationStatus: 1 });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
