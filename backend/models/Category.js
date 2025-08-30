// 📁 backend/models/Category.js
import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Category name is required"],
    unique: true,
    trim: true,
    maxlength: [100, "Category name cannot exceed 100 characters"]
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, "Description cannot exceed 500 characters"]
  },
  displayOrder: {
    type: Number,
    default: 0,
    min: [0, "Display order cannot be negative"]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  image: {
    url: String,
    publicId: String // For Cloudinary
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
categorySchema.pre('save', function(next) {
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
categorySchema.pre('insertMany', function(next, docs) {
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

// Virtual for menu items count
categorySchema.virtual('itemCount', {
  ref: 'MenuItem',
  localField: '_id',
  foreignField: 'category',
  count: true
});

// Index for better query performance
categorySchema.index({ name: 1, isActive: 1 });
categorySchema.index({ displayOrder: 1, isActive: 1 });

export default mongoose.model("Category", categorySchema);
