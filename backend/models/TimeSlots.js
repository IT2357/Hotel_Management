// 📁 backend/models/TimeSlots.js
import mongoose from "mongoose";

const timeSlotSchema = new mongoose.Schema(
  {
    meal: {
      type: String,
      enum: ["Breakfast", "Lunch", "Dinner", "Snacks"],
      required: true,
    },
    start: {
      type: String, // e.g., '06:00'
      required: true,
    },
    end: {
      type: String, // e.g., '11:00'
      required: true,
    },
  },
  { timestamps: true }
);

const TimeSlots = mongoose.model("TimeSlots", timeSlotSchema);
export default TimeSlots;