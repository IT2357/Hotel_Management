import mongoose from "mongoose";

const identityDocumentSchema = new mongoose.Schema(
  {
    documentType: {
      type: String,
      enum: ["passport", "national_id", "driver_license", "other"],
      required: true,
    },
    documentNumber: {
      type: String,
      required: true,
      trim: true,
    },
    issuingCountry: {
      type: String,
      required: true,
      trim: true,
    },
    expiryDate: {
      type: Date,
      validate: {
        validator: function (v) {
          return !v || v > new Date();
        },
        message: "Document must not be expired",
      },
    },
    frontImage: {
      type: String,
      required: true,
      validate: {
        validator: (v) => /^(http|https):\/\/[^ "]+$/.test(v),
        message: (props) => `${props.value} is not a valid URL!`,
      },
    },
    backImage: {
      type: String,
      validate: {
        validator: (v) => !v || /^(http|https):\/\/[^ "]+$/.test(v),
        message: (props) => `${props.value} is not a valid URL!`,
      },
    },
    verified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verifiedAt: Date,
  },
  { _id: false }
);

const roomPreferenceSchema = new mongoose.Schema(
  {
    smoking: { type: Boolean, default: false },
    floor: { type: String, trim: true },
    bedType: { type: String, trim: true },
    accessibilityNeeds: [{ type: String, trim: true }],
  },
  { _id: false }
);

const guestProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },
    dateOfBirth: {
      type: Date,
      validate: {
        validator: function (v) {
          const age = new Date().getFullYear() - v.getFullYear();
          return age >= 18;
        },
        message: "Guest must be at least 18 years old",
      },
    },
    nationality: { type: String, trim: true },
    identityDocuments: [identityDocumentSchema],
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
    },
    isFoodOnlyCustomer: { type: Boolean, default: false },

    favoriteRooms: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
      },
    ],
    
    bookings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
      },
    ],
    foodOrders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FoodOrder",
      },
    ],
    serviceRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ServiceRequest",
      },
    ],
    preferences: {
      preferredLanguage: {
        type: String,
        default: "en",
        enum: ["en", "fr", "es", "de", "it", "zh", "ja", "ar"],
      },
      allergies: [{ type: String, trim: true }],
      dietaryRestrictions: [{ type: String, trim: true }],
      roomPreferences: roomPreferenceSchema,
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    membershipLevel: {
      type: String,
      enum: ["standard", "silver", "gold", "platinum"],
      default: "standard",
    },
    specialRequests: [{ type: String, trim: true }],
    blacklisted: { type: Boolean, default: false },
    blacklistReason: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
guestProfileSchema.virtual("fullName").get(function () {
  return this.userId?.name;
});
guestProfileSchema.virtual("email").get(function () {
  return this.userId?.email;
});
guestProfileSchema.virtual("phone").get(function () {
  return this.userId?.phone;
});

// Indexes (keep non-duplicate indexes)
guestProfileSchema.index({ verificationStatus: 1 });
guestProfileSchema.index({ isFoodOnlyCustomer: 1 });
guestProfileSchema.index({ loyaltyPoints: -1 });
guestProfileSchema.index({ blacklisted: 1 });

const GuestProfile = mongoose.model("GuestProfile", guestProfileSchema);
export default GuestProfile;
