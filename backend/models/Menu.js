import mongoose from 'mongoose';

const MenuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(v) {
        return typeof v === 'number' && v >= 0;
      },
      message: 'Price must be a positive number'
    }
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  image: {
    type: String, // gridfs:<id> | base64:<shortprefix> | url:<http...>
    default: ''
  }
}, { _id: false });

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  items: [MenuItemSchema]
}, { _id: false });

const MenuSchema = new mongoose.Schema({
  source: {
    type: {
      type: String,
      enum: ['image', 'url', 'path'],
      required: true
    },
    value: {
      type: String,
      required: true
    }
  },
  categories: [CategorySchema],
  rawText: {
    type: String,
    default: ''
  },
  imageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'fs.files', // Reference to GridFS files collection
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Legacy fields for backward compatibility
  title: {
    type: String,
    trim: true,
    default: 'Extracted Menu'
  },
  extractionMethod: {
    type: String,
    enum: ['google-vision', 'openai-vision', 'tesseract', 'web-scraping', 'html-parsing', 'ai-vision-openai', 'ai-vision-google', 'ai-vision-fallback'],
    default: 'tesseract'
  },
  processingStatus: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'completed'
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to calculate totals and update timestamps
MenuSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Validate categories and items
  if (this.categories) {
    this.categories.forEach(category => {
      if (category.items) {
        category.items.forEach(item => {
          if (typeof item.price !== 'number' || item.price < 0) {
            throw new Error(`Invalid price for item "${item.name}": ${item.price}`);
          }
        });
      }
    });
  }
  
  next();
});

// Virtual for total items count
MenuSchema.virtual('totalItems').get(function() {
  if (!this.categories) return 0;
  return this.categories.reduce((total, category) => total + (category.items ? category.items.length : 0), 0);
});

// Virtual for total categories count
MenuSchema.virtual('totalCategories').get(function() {
  return this.categories ? this.categories.length : 0;
});

// Virtual for formatted creation date
MenuSchema.virtual('formattedCreatedAt').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Static method to validate menu structure
MenuSchema.statics.validateMenuStructure = function(menuData) {
  const errors = [];
  
  if (!menuData.source || !menuData.source.type || !menuData.source.value) {
    errors.push('Source information is required');
  }
  
  if (!menuData.categories || !Array.isArray(menuData.categories)) {
    errors.push('Categories must be an array');
  } else {
    menuData.categories.forEach((category, catIndex) => {
      if (!category.name || typeof category.name !== 'string') {
        errors.push(`Category ${catIndex + 1}: name is required`);
      }
      
      if (!category.items || !Array.isArray(category.items)) {
        errors.push(`Category "${category.name}": items must be an array`);
      } else {
        category.items.forEach((item, itemIndex) => {
          if (!item.name || typeof item.name !== 'string') {
            errors.push(`Category "${category.name}", Item ${itemIndex + 1}: name is required`);
          }
          
          if (typeof item.price !== 'number' || item.price < 0) {
            errors.push(`Category "${category.name}", Item "${item.name}": price must be a positive number`);
          }
        });
      }
    });
  }
  
  return errors;
};

// Instance method to convert to API response format
MenuSchema.methods.toAPIResponse = function() {
  return {
    id: this._id,
    title: this.title,
    source: this.source,
    categories: this.categories,
    rawText: this.rawText,
    createdAt: this.createdAt,
    totalItems: this.totalItems,
    totalCategories: this.totalCategories,
    confidence: this.confidence,
    extractionMethod: this.extractionMethod,
    processingStatus: this.processingStatus,
    imageId: this.imageId,
    imageUrl: this.imageId ? `/api/menu/image/${this.imageId}` : null
  };
};

// Index for better query performance
MenuSchema.index({ 'source.type': 1 });
MenuSchema.index({ createdAt: -1 });
MenuSchema.index({ createdBy: 1, createdAt: -1 });
MenuSchema.index({ processingStatus: 1 });

// Ensure virtuals are included in JSON output
MenuSchema.set('toJSON', { virtuals: true });
MenuSchema.set('toObject', { virtuals: true });

const Menu = mongoose.model('Menu', MenuSchema);

export default Menu;
