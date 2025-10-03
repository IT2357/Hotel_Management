// 📁 backend/models/CustomerFeedback.js
import mongoose from "mongoose";

const dishRatingSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  dishName: {
    type: String,
    required: true // Store name for historical purposes
  },
  rating: {
    type: Number,
    required: true,
    min: [1, "Rating must be at least 1"],
    max: [5, "Rating cannot exceed 5"]
  },
  review: {
    type: String,
    trim: true,
    maxlength: [1000, "Review cannot exceed 1000 characters"]
  }
}, { _id: true });

const customerFeedbackSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  orderNumber: {
    type: String,
    required: true
  },
  customerInfo: {
    name: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    }
  },
  overallRating: {
    type: Number,
    required: true,
    min: [1, "Overall rating must be at least 1"],
    max: [5, "Overall rating cannot exceed 5"]
  },
  dishRatings: [dishRatingSchema],
  serviceRating: {
    type: Number,
    min: [1, "Service rating must be at least 1"],
    max: [5, "Service rating cannot exceed 5"]
  },
  ambianceRating: {
    type: Number,
    min: [1, "Ambiance rating must be at least 1"],
    max: [5, "Ambiance rating cannot exceed 5"]
  },
  valueForMoneyRating: {
    type: Number,
    min: [1, "Value for money rating must be at least 1"],
    max: [5, "Value for money rating cannot exceed 5"]
  },
  generalComments: {
    type: String,
    trim: true,
    maxlength: [2000, "General comments cannot exceed 2000 characters"]
  },
  suggestions: {
    type: String,
    trim: true,
    maxlength: [1000, "Suggestions cannot exceed 1000 characters"]
  },
  wouldRecommend: {
    type: Boolean,
    default: null
  },
  visitType: {
    type: String,
    enum: ['First Time', 'Returning Customer', 'Regular Customer']
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: true // Whether feedback can be displayed publicly
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  moderatorNotes: {
    type: String,
    trim: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: Date,
  response: {
    message: {
      type: String,
      trim: true,
      maxlength: [1000, "Response cannot exceed 1000 characters"]
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // Admin who responded
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for average dish rating
customerFeedbackSchema.virtual('averageDishRating').get(function() {
  if (this.dishRatings && this.dishRatings.length > 0) {
    const total = this.dishRatings.reduce((sum, dish) => sum + dish.rating, 0);
    return Math.round((total / this.dishRatings.length) * 10) / 10;
  }
  return null;
});

// Virtual for feedback age
customerFeedbackSchema.virtual('feedbackAge').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.submittedAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Indexes for better query performance
customerFeedbackSchema.index({ order: 1 });
customerFeedbackSchema.index({ overallRating: -1, submittedAt: -1 });
customerFeedbackSchema.index({ status: 1, isPublic: 1 });
customerFeedbackSchema.index({ 'dishRatings.menuItem': 1 });

export default mongoose.model("CustomerFeedback", customerFeedbackSchema);
