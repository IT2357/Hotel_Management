// 📁 backend/models/Food.js
import mongoose from "mongoose";

const foodSchema = new mongoose.Schema(
  {
    name: String,
    category: {
      type: String,
      enum: ["Breakfast", "Lunch", "Dinner", "Snacks", "Beverage", "Dessert"],
      index: true,
    },
    description: String,
    imageUrl: String,
    price: Number,
    preparationTimeMinutes: Number,
    ingredients: [String],
    allergens: [String],
    dietaryTags: [String],
    seasonal: Boolean,
    isAvailable: Boolean,
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // ❌ Removed rating/reviewCount – use aggregation from FoodReview
    sentimentBreakdown: {
      positive: Number,
      neutral: Number,
      negative: Number,
    },
  },
  { timestamps: true }
);

const Food = mongoose.model("Food", foodSchema);
export default Food;
