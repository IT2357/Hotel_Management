// 📁 backend/models/Room.js
import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    images: [
      {
        url: {
          type: String,
          required: true,
          validate: {
            validator: (v) => /^(http|https):\/\/[^ "]+$/.test(v),
            message: (props) => `${props.value} is not a valid URL!`,
          },
        },
        isPrimary: { type: Boolean, default: false },
        caption: { type: String, trim: true },
      },
    ],
    roomNumber: {
      type: String,
      unique: true,
      index: true,
      required: true,
      uppercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[A-Z0-9-]+$/.test(v);
        },
        message: (props) => `${props.value} is not a valid room number!`,
      },
    },
    status: {
      type: String,
      enum: ["Available", "Booked", "Maintenance", "Cleaning", "OutOfService"],
      default: "Available",
      index: true,
      required: true,
    },
    occupancy: {
      adults: {
        type: Number,
        required: true,
        min: 1,
        max: 10,
      },
      children: {
        type: Number,
        default: 0,
        min: 0,
        max: 10,
      },
    },
    availability: [
      {
        startDate: { type: Date, required: true },
        endDate: {
          type: Date,
          required: true,
          validate: {
            validator: function (v) {
              return v > this.startDate;
            },
            message: "End date must be after start date",
          },
        },
        isAvailable: { type: Boolean, required: true },
      },
    ],
    amenities: [
      {
        type: String,
        trim: true,
        enum: [
          // Standardized list
          "WiFi",
          "TV",
          "AC",
          "Minibar",
          "Safe",
          "Hairdryer",
          "CoffeeMaker",
          "Iron",
          "Desk",
          "Balcony",
          "PoolView",
          "OceanView",
          "RoomService",
          "DailyCleaning",
          "Bathrobes",
          "Slippers",
          "Jacuzzi",
          "Private Pool"
        ],
      },
    ],
    size: {
      type: Number,
      min: 10,
      required: true,
    }, // in square meters
    type: {
      type: String,
      required: true,
      enum: [
        "Standard",
        "Deluxe",
        "Suite",
        "Executive",
        "Presidential",
        "Family",
        "Accessible",
        "Connecting",
      ],
    },
    bedType: {
      type: String,
      required: true,
      enum: ["Single", "Double", "Queen", "King", "Twin", "Bunk"],
    },
    view: {
      type: String,
      enum: ["City", "Garden", "Pool", "Ocean", "Mountain", "None"],
    },
    floor: {
      type: Number,
      required: true,
      min: -2, // Allow for underground floors
      max: 100,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    }, // Renamed from pricePerNight for clarity
    seasonalPricing: [
      {
        name: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: {
          type: Date,
          required: true,
          validate: {
            validator: function (v) {
              return v > this.startDate;
            },
            message: "End date must be after start date",
          },
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        isActive: { type: Boolean, default: true },
      },
    ],
    cancellationPolicy: {
      type: String,
      enum: ["Flexible", "Moderate", "Strict", "NonRefundable"],
      default: "Moderate",
    },
    discounts: [
      {
        name: { type: String, required: true },
        description: String,
        discountType: {
          type: String,
          enum: ["Percentage", "Fixed"],
          required: true,
        },
        value: {
          type: Number,
          required: true,
          min: 0,
        },
        startDate: Date,
        endDate: Date,
        code: String,
        isActive: { type: Boolean, default: true },
      },
    ],
    packages: [
      {
        name: { type: String, required: true },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        description: { type: String, required: true },
        inclusions: [String],
        isActive: { type: Boolean, default: true },
      },
    ],
    rating: {
      // Renamed from statusLabel for clarity
      type: String,
      enum: ["Excellent", "Good", "Average", "Poor"],
      default: "Good",
    },
    reviewSummary: {
      averageRating: { type: Number, min: 1, max: 5 },
      cleanliness: { type: Number, min: 1, max: 5 },
      comfort: { type: Number, min: 1, max: 5 },
      location: { type: Number, min: 1, max: 5 },
      amenities: { type: Number, min: 1, max: 5 },
      service: { type: Number, min: 1, max: 5 },
      totalReviews: { type: Number, default: 0 },
    },
    maintenanceLogs: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
        reportedAt: { type: Date, default: Date.now },
        resolvedAt: Date,
        status: {
          type: String,
          enum: ["Pending", "In Progress", "Resolved", "Reopened"],
          default: "Pending",
        },
        priority: {
          type: String,
          enum: ["Low", "Medium", "High", "Critical"],
          default: "Medium",
        },
        reportedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        images: [String],
        resolutionNotes: String,
      },
    ],
    cleaningSchedule: [
      {
        date: { type: Date, required: true },
        assignedTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        status: {
          type: String,
          enum: ["Scheduled", "In Progress", "Completed", "Skipped"],
          default: "Scheduled",
        },
        notes: String,
        checklist: [
          {
            item: { type: String, required: true },
            completed: { type: Boolean, default: false },
          },
        ],
        supervisorCheck: {
          checked: { type: Boolean, default: false },
          checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          notes: String,
        },
      },
    ],
    metadata: {
      lastBooked: Date,
      lastCleaned: Date,
      views: { type: Number, default: 0 },
      bookingsCount: { type: Number, default: 0 },
      averageStayDuration: Number, // in nights
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
// roomSchema.index({ roomNumber: 1 }, { unique: true });
// roomSchema.index({ status: 1 });
roomSchema.index({ type: 1 });
roomSchema.index({ floor: 1 });
roomSchema.index({ "availability.startDate": 1, "availability.endDate": 1 });

// Virtual for current availability status
roomSchema.virtual("isCurrentlyAvailable").get(function () {
  const now = new Date();
  return (this.availability && this.availability.length > 0) ?
    this.availability.some(
      (avail) =>
        avail.isAvailable && avail.startDate <= now && avail.endDate >= now
    ) : true; // Default to available if no availability data
});

const Room = mongoose.model("Room", roomSchema);
export default Room;
