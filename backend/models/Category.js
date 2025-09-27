// 📁 backend/models/Category.js
import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    image: {
      type: String,
      default: null,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    metadata: {
      color: {
        type: String,
        default: '#6366f1',
      },
      icon: {
        type: String,
        default: 'utensils',
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Create slug from name before saving
categorySchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Virtual for item count
categorySchema.virtual('itemCount', {
  ref: 'MenuItem',
  localField: '_id',
  foreignField: 'category',
  count: true,
});

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategory',
});

// Indexes
// Note: slug index is automatically created by unique: true constraint
categorySchema.index({ displayOrder: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ parentCategory: 1 });

const Category = mongoose.model('Category', categorySchema);

export default Category;
