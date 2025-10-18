/**
 * 🍽️ Menu Item Validation Schemas (2025 Best Practices)
 * Joi validation for Tamil/English bilingual Jaffna restaurant menus
 * Supports real-world constraints: LKR pricing, dietary tags, multilingual
 */

import Joi from 'joi';

// Dietary tags enum for Jaffna cuisine
const DIETARY_TAGS = ['veg', 'non-veg', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'spicy', 'halal', 'jain'];
const ORDER_TYPES = ['dine-in', 'takeaway'];
const MEAL_TIMES = ['breakfast', 'lunch', 'dinner', 'snacks'];

/**
 * Create Menu Item Schema
 * Requires: Tamil name, English name, price (LKR 50-5000), category
 * Optional: Ingredients, allergens, dietary tags, cultural context
 */
export const createMenuItemSchema = Joi.object({
  // Bilingual names (required for Jaffna authenticity)
  name_tamil: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .pattern(/^[\u0B80-\u0BFF\s\d()\-/]+$/) // Tamil Unicode range + punctuation
    .required()
    .messages({
      'string.pattern.base': 'Tamil name must use Tamil script (e.g., நண்டு கறி)',
      'any.required': 'Tamil name is required for bilingual menu'
    }),
  
  name_english: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-Z\s\d()\-/&']+$/)
    .required()
    .messages({
      'any.required': 'English name is required for international guests'
    }),

  // Description (bilingual optional)
  description_tamil: Joi.string()
    .trim()
    .max(500)
    .pattern(/^[\u0B80-\u0BFF\s\d.,!?()\-/]+$/)
    .allow('', null),
  
  description_english: Joi.string()
    .trim()
    .min(10)
    .max(500)
    .required()
    .messages({
      'any.required': 'English description required for accessibility'
    }),

  // Pricing (LKR with -5% Jaffna adjustment applied on frontend)
  price: Joi.number()
    .min(50) // Minimum LKR 50 (tea/water)
    .max(5000) // Maximum LKR 5000 (premium seafood)
    .precision(2)
    .required()
    .messages({
      'number.min': 'Price must be at least LKR 50',
      'number.max': 'Price cannot exceed LKR 5000',
      'any.required': 'Price is required'
    }),

  currency: Joi.string()
    .valid('LKR')
    .default('LKR')
    .messages({
      'any.only': 'Only LKR currency supported for Jaffna restaurant'
    }),

  // Category (must exist in categories collection)
  category: Joi.string()
    .hex()
    .length(24) // MongoDB ObjectId
    .required()
    .messages({
      'any.required': 'Category is required (Breakfast, Seafood, etc.)'
    }),

  // Ingredients (array for allergen tracking)
  ingredients: Joi.array()
    .items(Joi.string().trim().min(2).max(50))
    .max(20)
    .default([])
    .messages({
      'array.max': 'Maximum 20 ingredients allowed'
    }),

  // Allergens (critical for guest safety)
  allergens: Joi.array()
    .items(Joi.string().trim().valid(
      'milk', 'eggs', 'fish', 'shellfish', 'tree nuts', 'peanuts', 
      'wheat', 'soybeans', 'sesame', 'mustard'
    ))
    .default([]),

  // Dietary tags (filterable)
  dietaryTags: Joi.array()
    .items(Joi.string().valid(...DIETARY_TAGS))
    .default([])
    .messages({
      'any.only': `Dietary tags must be one of: ${DIETARY_TAGS.join(', ')}`
    }),

  // Boolean flags for quick filters
  isVeg: Joi.boolean().default(false),
  isSpicy: Joi.boolean().default(false),
  isPopular: Joi.boolean().default(false),
  isAvailable: Joi.boolean().default(true),

  // Meal time availability
  isBreakfast: Joi.boolean().default(false),
  isLunch: Joi.boolean().default(true),
  isDinner: Joi.boolean().default(true),
  isSnacks: Joi.boolean().default(false),

  // Operational
  cookingTime: Joi.number()
    .min(5)
    .max(120) // 5 min (tea) to 120 min (biryani)
    .default(20)
    .messages({
      'number.min': 'Cooking time must be at least 5 minutes',
      'number.max': 'Cooking time cannot exceed 120 minutes'
    }),

  // Cultural context (for AI training)
  culturalOrigin: Joi.string()
    .trim()
    .max(200)
    .allow('', null),

  culturalContext: Joi.string()
    .valid('jaffna', 'colombo', 'kandy', 'fusion')
    .default('jaffna'),

  // Customizations (e.g., "Extra spicy", "No onion")
  customizations: Joi.array()
    .items(Joi.object({
      name: Joi.string().required(),
      options: Joi.array().items(Joi.string()).required(),
      priceAdjustment: Joi.number().default(0)
    }))
    .default([]),

  // Image (URL or GridFS path - handled by Multer)
  image: Joi.string()
    .uri()
    .allow('', null),

  imageId: Joi.string()
    .hex()
    .length(24)
    .allow(null)
}).options({ stripUnknown: true });

/**
 * Update Menu Item Schema
 * All fields optional (partial updates)
 */
export const updateMenuItemSchema = Joi.object({
  name_tamil: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .pattern(/^[\u0B80-\u0BFF\s\d()\-/]+$/),
  
  name_english: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-Z\s\d()\-/&']+$/),

  description_tamil: Joi.string()
    .trim()
    .max(500)
    .allow('', null),
  
  description_english: Joi.string()
    .trim()
    .min(10)
    .max(500),

  price: Joi.number().min(50).max(5000).precision(2),
  category: Joi.string().hex().length(24),
  ingredients: Joi.array().items(Joi.string().trim()).max(20),
  allergens: Joi.array().items(Joi.string().trim()),
  dietaryTags: Joi.array().items(Joi.string().valid(...DIETARY_TAGS)),
  
  isVeg: Joi.boolean(),
  isSpicy: Joi.boolean(),
  isPopular: Joi.boolean(),
  isAvailable: Joi.boolean(),
  isBreakfast: Joi.boolean(),
  isLunch: Joi.boolean(),
  isDinner: Joi.boolean(),
  isSnacks: Joi.boolean(),
  
  cookingTime: Joi.number().min(5).max(120),
  culturalOrigin: Joi.string().trim().max(200),
  culturalContext: Joi.string().valid('jaffna', 'colombo', 'kandy', 'fusion'),
  customizations: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    options: Joi.array().items(Joi.string()).required(),
    priceAdjustment: Joi.number().default(0)
  })),
  
  image: Joi.string().uri().allow('', null),
  imageId: Joi.string().hex().length(24).allow(null)
}).min(1).options({ stripUnknown: true });

/**
 * Query/Filter Schema for Menu Listing
 * Supports: search, category filter, dietary filter, pagination, sorting
 */
export const menuQuerySchema = Joi.object({
  // Search (fuzzy match on Tamil/English names, ingredients)
  search: Joi.string()
    .trim()
    .max(100)
    .allow(''),

  // Filters
  category: Joi.string().hex().length(24),
  dietaryTags: Joi.alternatives().try(
    Joi.string().valid(...DIETARY_TAGS),
    Joi.array().items(Joi.string().valid(...DIETARY_TAGS))
  ),
  isVeg: Joi.boolean(),
  isSpicy: Joi.boolean(),
  isPopular: Joi.boolean(),
  isAvailable: Joi.boolean(),
  mealTime: Joi.string().valid(...MEAL_TIMES),

  // Pagination (default: page 1, limit 20)
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),

  // Sorting (default: sortOrder asc, then name)
  sortBy: Joi.string()
    .valid('name_english', 'price', 'cookingTime', 'createdAt', 'sortOrder', 'popularity')
    .default('sortOrder'),
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('asc')
}).options({ stripUnknown: true });

/**
 * Review Schema (for US-FO-006)
 */
export const createReviewSchema = Joi.object({
  orderId: Joi.string().hex().length(24).required(),
  menuItemId: Joi.string().hex().length(24).required(),
  
  // Ratings (1-5 stars)
  foodRating: Joi.number().integer().min(1).max(5).required(),
  serviceRating: Joi.number().integer().min(1).max(5).required(),
  
  // Optional text review
  comment: Joi.string()
    .trim()
    .max(500)
    .allow('', null),

  // Type-specific feedback
  orderType: Joi.string()
    .valid(...ORDER_TYPES)
    .required(),

  // Tags for common feedback
  tags: Joi.array()
    .items(Joi.string().valid(
      'delicious', 'authentic', 'too-spicy', 'not-spicy-enough', 
      'portion-small', 'portion-large', 'fast-service', 'slow-service',
      'friendly-staff', 'clean', 'would-recommend'
    ))
    .default([])
}).options({ stripUnknown: true });

export default {
  createMenuItemSchema,
  updateMenuItemSchema,
  menuQuerySchema,
  createReviewSchema
};
