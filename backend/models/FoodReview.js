// 📁 backend/models/FoodReview.js
import mongoose from "mongoose";

const foodReviewSchema = new mongoose.Schema(
  {
    foodId: { type: mongoose.Schema.Types.ObjectId, ref: "Food", index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rating: { type: Number, min: 0, max: 5 },
    comment: String,
    sentimentLabel: {
      type: String,
      enum: ["Positive", "Neutral", "Negative"],
    },
    isVisible: { type: Boolean, default: true },
    flagged: { type: Boolean, default: false },
    images: [String],
  },
  { timestamps: true }
);

const FoodReview = mongoose.model("FoodReview", foodReviewSchema);
export default FoodReview;
