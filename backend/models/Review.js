import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Menu',
    required: [true, 'Menu item is required']
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer is required']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating must be at most 5']
  },
  title: {
    type: String,
    required: [true, 'Review title is required'],
    trim: true,
    maxlength: [100, 'Title must be less than 100 characters']
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    trim: true,
    minlength: [10, 'Comment must be at least 10 characters'],
    maxlength: [500, 'Comment must be less than 500 characters']
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  helpful: {
    type: Boolean,
    default: true
  },
  helpfulVotes: {
    type: Number,
    default: 0,
    min: [0, 'Helpful votes cannot be negative']
  },
  notHelpfulVotes: {
    type: Number,
    default: 0,
    min: [0, 'Not helpful votes cannot be negative']
  },
  voters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reports: [{
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      required: true,
      enum: [
        'Inappropriate content',
        'Spam',
        'Fake review',
        'Offensive language',
        'Other'
      ]
    },
    description: {
      type: String,
      maxlength: [200, 'Report description must be less than 200 characters']
    },
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isApproved: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
reviewSchema.index({ menuItem: 1, createdAt: -1 });
reviewSchema.index({ customer: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ isApproved: 1, isDeleted: 1 });

// Compound index for unique review per customer per menu item
reviewSchema.index({ menuItem: 1, customer: 1 }, { unique: true });

// Virtual for total votes
reviewSchema.virtual('totalVotes').get(function() {
  return this.helpfulVotes + this.notHelpfulVotes;
});

// Virtual for helpful percentage
reviewSchema.virtual('helpfulPercentage').get(function() {
  if (this.totalVotes === 0) return 0;
  return Math.round((this.helpfulVotes / this.totalVotes) * 100);
});

// Pre-save middleware to ensure one review per customer per menu item
reviewSchema.pre('save', async function(next) {
  if (this.isNew) {
    const existingReview = await this.constructor.findOne({
      menuItem: this.menuItem,
      customer: this.customer
    });
    
    if (existingReview) {
      const error = new Error('You have already reviewed this item');
      error.statusCode = 400;
      return next(error);
    }
  }
  next();
});

// Static method to get reviews by menu item
reviewSchema.statics.getByMenuItem = function(menuItemId, options = {}) {
  const {
    page = 1,
    limit = 10,
    sort = 'recent',
    rating,
    isApproved = true
  } = options;

  let query = { 
    menuItem: menuItemId, 
    isApproved, 
    isDeleted: false 
  };

  if (rating) {
    query.rating = parseInt(rating);
  }

  let sortOptions = {};
  switch (sort) {
    case 'recent':
      sortOptions = { createdAt: -1 };
      break;
    case 'oldest':
      sortOptions = { createdAt: 1 };
      break;
    case 'highest':
      sortOptions = { rating: -1, createdAt: -1 };
      break;
    case 'lowest':
      sortOptions = { rating: 1, createdAt: -1 };
      break;
    case 'most_helpful':
      sortOptions = { helpfulVotes: -1, createdAt: -1 };
      break;
    default:
      sortOptions = { createdAt: -1 };
  }

  const skip = (page - 1) * limit;

  return this.find(query)
    .populate('customer', 'firstName lastName email')
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);
};

// Static method to get review statistics
reviewSchema.statics.getStats = function(menuItemId) {
  return this.aggregate([
    { $match: { menuItem: menuItemId, isApproved: true, isDeleted: false } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalReviews: 1,
        averageRating: { $round: ['$averageRating', 1] },
        ratingDistribution: {
          $reduce: {
            input: '$ratingDistribution',
            initialValue: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            in: {
              $cond: {
                if: { $eq: ['$$this', 5] },
                then: { $mergeObjects: ['$$value', { 5: { $add: [{ $ifNull: ['$$value.5', 0] }, 1] } }] },
                else: {
                  $cond: {
                    if: { $eq: ['$$this', 4] },
                    then: { $mergeObjects: ['$$value', { 4: { $add: [{ $ifNull: ['$$value.4', 0] }, 1] } }] },
                    else: {
                      $cond: {
                        if: { $eq: ['$$this', 3] },
                        then: { $mergeObjects: ['$$value', { 3: { $add: [{ $ifNull: ['$$value.3', 0] }, 1] } }] },
                        else: {
                          $cond: {
                            if: { $eq: ['$$this', 2] },
                            then: { $mergeObjects: ['$$value', { 2: { $add: [{ $ifNull: ['$$value.2', 0] }, 1] } }] },
                            else: { $mergeObjects: ['$$value', { 1: { $add: [{ $ifNull: ['$$value.1', 0] }, 1] } }] }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  ]);
};

export default mongoose.model('Review', reviewSchema);