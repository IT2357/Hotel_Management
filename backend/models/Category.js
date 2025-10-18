import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true,
    minlength: [2, 'Category name must be at least 2 characters'],
    maxlength: [50, 'Category name must be less than 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Category description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [200, 'Description must be less than 200 characters']
  },
  color: {
    type: String,
    default: '#FF9933',
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: 'Color must be a valid hex color code'
    }
  },
  icon: {
    type: String,
    default: '🍽️',
    maxlength: [10, 'Icon must be less than 10 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0,
    min: [0, 'Sort order must be 0 or greater']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better performance
categorySchema.index({ name: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ sortOrder: 1 });

// Virtual for menu items count
categorySchema.virtual('menuItemsCount', {
  ref: 'Menu',
  localField: '_id',
  foreignField: 'category',
  count: true
});

// Pre-save middleware to ensure unique name (case insensitive)
categorySchema.pre('save', async function(next) {
  if (this.isModified('name')) {
    const existingCategory = await this.constructor.findOne({
      name: { $regex: new RegExp(`^${this.name}$`, 'i') },
      _id: { $ne: this._id }
    });
    
    if (existingCategory) {
      const error = new Error('Category with this name already exists');
      error.statusCode = 400;
      return next(error);
    }
  }
  next();
});

// Static method to get active categories
categorySchema.statics.getActiveCategories = function() {
  return this.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
};

// Static method to get categories with menu items count
categorySchema.statics.getCategoriesWithCount = function() {
  return this.aggregate([
    {
      $lookup: {
        from: 'menus',
        localField: '_id',
        foreignField: 'category',
        as: 'menuItems'
      }
    },
    {
      $addFields: {
        menuItemsCount: { $size: '$menuItems' }
      }
    },
    {
      $project: {
        menuItems: 0
      }
    },
    {
      $sort: { sortOrder: 1, name: 1 }
    }
  ]);
};

export default mongoose.model('Category', categorySchema);