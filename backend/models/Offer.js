import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  code: {
    type: String,
    unique: true,
    sparse: true
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed_amount', 'free_item'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true
  },
  target: {
    minOrders: {
      type: Number,
      default: 1
    },
    itemType: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      trim: true
    }
  },
  // Jaffna-specific items
  jaffnaItems: [{
    type: String,
    enum: [
      'kottu', 'curry', 'seafood', 'mutton', 'chicken', 
      'vegetable', 'dessert', 'beverage', 'appetizer',
      'ஆட்டுக்கறி', 'கறிக்கோசு', 'நீர் கறக்கை', 'கொத்து'
    ]
  }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  maxRedemptions: {
    type: Number,
    default: null // null means unlimited
  },
  redemptions: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
offerSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
offerSchema.index({ code: 1 });
offerSchema.index({ 'target.itemType': 1 });
offerSchema.index({ 'target.category': 1 });

export default mongoose.model('Offer', offerSchema);