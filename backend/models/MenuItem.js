import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Menu item name is required'],
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
  },
  image: {
    data: Buffer,
    contentType: String,
    filename: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  },
  imageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'menu.Images.files', // Reference to GridFS files collection
    required: false
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  isVeg: {
    type: Boolean,
    default: false,
  },
  isSpicy: {
    type: Boolean,
    default: false,
  },
  isPopular: {
    type: Boolean,
    default: false,
  },
  ingredients: [{
    type: String,
    trim: true,
  }],
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
  },
  cookingTime: {
    type: Number, // in minutes
    default: 15,
  },
  customizations: [{
    name: String,
    options: [{
      name: String,
      price: Number,
    }],
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Pre-save middleware to generate slug
menuItemSchema.pre('save', function(next) {
  // Always generate slug if it's missing or if name is modified
  if (!this.slug || this.isModified('name')) {
    // Generate slug from name
    let baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim()
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

    // If slug is empty after cleaning, generate a fallback
    if (!baseSlug) {
      baseSlug = `item-${Date.now()}`;
    }

    // Add timestamp to ensure uniqueness
    this.slug = `${baseSlug}-${Date.now()}`;
  }
  next();
});

// Add text index for search functionality
menuItemSchema.index({ name: 'text', description: 'text', category: 'text' });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

export default MenuItem;
