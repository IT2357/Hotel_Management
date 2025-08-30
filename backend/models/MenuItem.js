// 📁 backend/models/MenuItem.js
import mongoose from "mongoose";

const portionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true // e.g., "Half", "Full", "Regular", "Large"
  },
  price: {
    type: Number,
    required: true,
    min: [0, "Price cannot be negative"]
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, { _id: true });

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Menu item name is required"],
    trim: true,
    maxlength: [150, "Item name cannot exceed 150 characters"]
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true,
    maxlength: [1000, "Description cannot exceed 1000 characters"]
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, "Category is required"]
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: String, // For Cloudinary
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  portions: [portionSchema],
  // Single price for items without portions
  basePrice: {
    type: Number,
    min: [0, "Price cannot be negative"]
  },
  type: {
    type: String,
    enum: ['Veg', 'Non-Veg', 'Seafood'],
    required: [true, "Food type is required"]
  },
  spiceLevel: {
    type: String,
    enum: ['Mild', 'Medium', 'Hot'],
    required: [true, "Spice level is required"]
  },
  dietaryTags: [{
    type: String,
    enum: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher']
  }],
  foodType: {
    type: String,
    enum: ['veg', 'non-veg', 'seafood'],
    required: true
  },
  isHalal: {
    type: Boolean,
    default: false
  },
  ingredients: [{
    type: String,
    trim: true
  }],
  allergens: [{
    type: String,
    trim: true
  }],
  preparationTime: {
    type: Number, // in minutes
    min: [1, "Preparation time must be at least 1 minute"],
    max: [120, "Preparation time cannot exceed 120 minutes"]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create slug from name before saving
menuItemSchema.pre('save', function(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  next();
});

// Also handle bulk operations
menuItemSchema.pre('insertMany', function(next, docs) {
  if (Array.isArray(docs)) {
    docs.forEach(doc => {
      if (doc.name && !doc.slug) {
        doc.slug = doc.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim('-');
      }
    });
  }
  next();
});

// Virtual for primary image
menuItemSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary || this.images[0];
});

// Virtual for price display
menuItemSchema.virtual('displayPrice').get(function() {
  if (this.portions && this.portions.length > 0) {
    const defaultPortion = this.portions.find(p => p.isDefault);
    if (defaultPortion) return defaultPortion.price;
    return this.portions[0].price;
  }
  return this.basePrice;
});

// Indexes for better query performance
menuItemSchema.index({ category: 1, isActive: 1, isAvailable: 1 });
menuItemSchema.index({ type: 1, spiceLevel: 1 });
menuItemSchema.index({ name: 'text', description: 'text' });
menuItemSchema.index({ displayOrder: 1 });

export default mongoose.model("MenuItem", menuItemSchema);
