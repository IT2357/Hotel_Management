// 📁 backend/models/profiles/GuestProfile.js
import mongoose from "mongoose";

const guestProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
    favoriteRooms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Room" }],
    bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Booking" }],
    foodOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: "FoodOrder" }],
    preferences: {
      preferredLanguage: String,
      allergies: [String],
    },
    loyaltyPoints: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const GuestProfile = mongoose.model("GuestProfile", guestProfileSchema);
export default GuestProfile;
