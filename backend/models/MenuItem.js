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
    enum: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher', 'keto', 'paleo', 'low-carb', 'sugar-free']
  }],
  cuisineType: {
    type: String,
    enum: ['Sri Lankan', 'Indian', 'Chinese', 'Italian', 'Continental', 'Thai', 'Japanese', 'Mexican', 'Mediterranean', 'Fusion'],
    default: 'Sri Lankan'
  },
  spiceLevel: {
    type: String,
    enum: ['None', 'Mild', 'Medium', 'Hot', 'Extra Hot'],
    default: 'Mild'
  },
  servingSize: {
    type: String,
    enum: ['Individual', 'Sharing (2-3)', 'Family (4-6)', 'Large (6+)'],
    default: 'Individual'
  },
  foodType: {
    type: String,
    enum: ['veg', 'non-veg', 'seafood', 'vegan'],
    required: true
  },
  isSignatureDish: {
    type: Boolean,
    default: false
  },
  isChefSpecial: {
    type: Boolean,
    default: false
  },
  isNewItem: {
    type: Boolean,
    default: false
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  isSeasonalItem: {
    type: Boolean,
    default: false
  },
  seasonalAvailability: {
    startMonth: Number, // 1-12
    endMonth: Number   // 1-12
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
    fiber: Number,
    sodium: Number,
    sugar: Number
  },
  reviews: {
    totalReviews: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    lastReviewDate: Date
  },
  inventory: {
    stockLevel: {
      type: Number,
      default: 0,
      min: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 5
    },
    isLowStock: {
      type: Boolean,
      default: false
    }
  },
  pricing: {
    costPrice: Number, // Cost to make the dish
    markupPercentage: Number, // Profit margin
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    isOnSale: {
      type: Boolean,
      default: false
    },
    saleStartDate: Date,
    saleEndDate: Date
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

// Virtual for display price with discount
menuItemSchema.virtual('displayPrice').get(function() {
  let price;
  
  if (this.portions && this.portions.length > 0) {
    const defaultPortion = this.portions.find(p => p.isDefault);
    price = defaultPortion ? defaultPortion.price : this.portions[0].price;
  } else {
    price = this.basePrice;
  }

  // Apply discount if on sale
  if (this.pricing && this.pricing.isOnSale && this.pricing.discountPercentage > 0) {
    const discount = (this.pricing.discountPercentage / 100) * price;
    return Math.round((price - discount) * 100) / 100; // Round to 2 decimal places
  }

  return price;
});

// Virtual for original price (before discount)
menuItemSchema.virtual('originalPrice').get(function() {
  if (this.portions && this.portions.length > 0) {
    const defaultPortion = this.portions.find(p => p.isDefault);
    return defaultPortion ? defaultPortion.price : this.portions[0].price;
  }
  return this.basePrice;
});

// Virtual for checking if item is currently seasonal
menuItemSchema.virtual('isCurrentlySeasonal').get(function() {
  if (!this.isSeasonalItem || !this.seasonalAvailability) return false;
  
  const currentMonth = new Date().getMonth() + 1; // getMonth() returns 0-11
  const { startMonth, endMonth } = this.seasonalAvailability;
  
  if (startMonth <= endMonth) {
    return currentMonth >= startMonth && currentMonth <= endMonth;
  } else {
    // Handle cases where season spans across year (e.g., Nov-Feb)
    return currentMonth >= startMonth || currentMonth <= endMonth;
  }
});

// Method to update stock level and check if low stock
menuItemSchema.methods.updateStock = function(quantity, operation = 'subtract') {
  if (operation === 'subtract') {
    this.inventory.stockLevel = Math.max(0, this.inventory.stockLevel - quantity);
  } else if (operation === 'add') {
    this.inventory.stockLevel += quantity;
  }
  
  this.inventory.isLowStock = this.inventory.stockLevel <= this.inventory.lowStockThreshold;
  return this.save();
};

// Indexes for better query performance
menuItemSchema.index({ category: 1, isActive: 1, isAvailable: 1 });
menuItemSchema.index({ type: 1, spiceLevel: 1 });
menuItemSchema.index({ name: 'text', description: 'text' });
menuItemSchema.index({ displayOrder: 1 });

export default mongoose.model("MenuItem", menuItemSchema);
