// 📁 backend/models/Review.js
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    overallRating: { type: Number, min: 0, max: 5 },
    cleanliness: Number,
    service: Number,
    location: Number,
    amenities: Number,
    comment: String,
    images: [String],
    isVisible: { type: Boolean, default: true },
    flagged: { type: Boolean, default: false },
    sentimentLabel: {
      type: String,
      enum: ["Positive", "Neutral", "Negative"],
    },
  },
  { timestamps: true }
);

const Review = mongoose.model("Review", reviewSchema);
export default Review;
