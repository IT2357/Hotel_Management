// 📁 backend/models/Room.js
import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    imageUrl: String,
    roomNumber: { type: String, unique: true, index: true },
    status: {
      type: String,
      enum: ["Available", "Booked", "Maintenance", "Cleaning"],
      default: "Available",
      index: true,
    },
    maxOccupancy: { adults: Number, children: Number },
    availability: [
      {
        startDateTime: Date,
        endDateTime: Date,
        isAvailable: Boolean,
      },
    ],
    amenities: [String],
    size: String,
    type: String,
    bedType: String,
    view: String,
    floor: Number,
    pricePerNight: Number,
    seasonalPricing: [{ startDate: Date, endDate: Date, price: Number }],
    cancellationPolicy: String,
    discount: Number,
    packages: [{ name: String, price: Number, description: String }],
    statusLabel: {
      type: String,
      enum: ["Excellent", "Good", "Average", "Poor"],
    },
    reviewSummary: {
      averageCleanliness: Number,
      averageService: Number,
      averageLocation: Number,
      averageAmenities: Number,
      sentimentBreakdown: {
        positive: Number,
        neutral: Number,
        negative: Number,
      },
    },
    recentReviewImages: [String],
    maintenanceLogs: [
      {
        description: String,
        reportedAt: Date,
        resolvedAt: Date,
        status: {
          type: String,
          enum: ["Pending", "In Progress", "Resolved"],
          default: "Pending",
        },
        reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
    cleaningSchedule: [
      {
        date: Date,
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: {
          type: String,
          enum: ["Scheduled", "In Progress", "Completed"],
          default: "Scheduled",
        },
        notes: String,
      },
    ],
    views: { type: Number, default: 0 },
    bookingsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Room = mongoose.model("Room", roomSchema);
export default Room;
