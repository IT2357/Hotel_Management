// 📁 backend/models/Food.js
import mongoose from "mongoose";

const foodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Food name is required'],
      trim: true
    },
    category: {
      type: String,
      enum: ["Breakfast", "Lunch", "Dinner", "Snacks", "Beverage", "Dessert"],
      required: [true, 'Category is required'],
      index: true,
    },
    description: {
      type: String,
      trim: true
    },
    imageUrl: String,
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    preparationTimeMinutes: Number,
    ingredients: [String],
    allergens: [String],
    dietaryTags: [String],
    seasonal: {
      type: Boolean,
      default: false
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // ❌ Removed rating/reviewCount – use aggregation from FoodReview
    sentimentBreakdown: {
      positive: { type: Number, default: 0 },
      neutral: { type: Number, default: 0 },
      negative: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const Food = mongoose.model("Food", foodSchema);
export default Food;
