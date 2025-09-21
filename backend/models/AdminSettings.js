import mongoose from "mongoose";
import crypto from "crypto";

const encryptionKey = process.env.ENCRYPTION_KEY || "development_default_key_32_chars_long_for_encryption_testing_only";

// Validate encryption key only if SMTP is configured
let encryptionKeyValid = false;
let keyBuffer = null;

try {
  if (encryptionKey) {
    keyBuffer = Buffer.from(encryptionKey, "hex");
    if (keyBuffer.length === 32) {
      encryptionKeyValid = true;
      console.log("✅ ENCRYPTION_KEY validated successfully, length:", keyBuffer.length, "bytes");
    } else {
      console.warn("⚠️ ENCRYPTION_KEY must be a 64-character hexadecimal string (32 bytes). Using fallback for development.");
    }
  } else {
    console.log("⚠️ ENCRYPTION_KEY not defined - SMTP password encryption disabled for development");
  }
} catch (error) {
  console.error("❌ Invalid ENCRYPTION_KEY format:", error.message);
  console.log("⚠️ Using fallback for development - SMTP password encryption disabled");
}

const adminSettingsSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: "Hotel Management System", trim: true },
    hotelName: { type: String, default: "Grand Hotel", trim: true },
    description: {
      type: String,
      default: "A luxury hotel experience",
      trim: true,
    },
    contactEmail: {
      type: String,
      default: "info@grandhotel.com",
      trim: true,
      lowercase: true,
    },
    contactPhone: { type: String, default: "+1 (555) 123-4567", trim: true },
    address: {
      type: String,
      default: "123 Hotel Street, City, State 12345",
      trim: true,
    },
    timezone: { type: String, default: "UTC", trim: true },
    currency: {
      type: String,
      default: "USD",
      enum: ["LKR", "USD", "EUR", "GBP", "CAD"],
    },
    smtpHost: { type: String, default: "smtp.gmail.com", trim: true },
    smtpPort: { type: Number, default: 587, min: 1, max: 65535 },
    smtpUser: { type: String, default: "", trim: true },
    smtpPassword: {
      type: String,
      default: "",
      trim: true,
      set: function (value) {
        if (!value) {
          console.log("smtpPassword is empty, skipping encryption");
          return "";
        }

        // Only encrypt if we have a valid encryption key
        if (!encryptionKeyValid || !keyBuffer) {
          console.log("⚠️ SMTP password encryption disabled - storing as plain text");
          return value;
        }

        try {
          console.log("Preparing to encrypt smtpPassword");
          const iv = crypto.randomBytes(16);
          const cipher = crypto.createCipheriv("aes-256-cbc", keyBuffer, iv);
          let encrypted = cipher.update(value, "utf8", "hex");
          encrypted += cipher.final("hex");
          const result = `${iv.toString("hex")}:${encrypted}`;
          console.log("✅ smtpPassword encrypted successfully");
          return result;
        } catch (error) {
          console.error("❌ Encryption failed for smtpPassword:", error.message);
          // Store as plain text if encryption fails
          return value;
        }
      },
      get: function (value) {
        if (!value) {
          console.log("smtpPassword is empty, skipping decryption");
          return "";
        }

        // Only decrypt if we have a valid encryption key and the value looks encrypted
        if (!encryptionKeyValid || !keyBuffer || !value.includes(":")) {
          console.log("⚠️ SMTP password decryption disabled or value not encrypted");
          return value;
        }

        try {
          console.log("Preparing to decrypt smtpPassword");
          const [iv, encrypted] = value.split(":");
          if (!iv || !encrypted) {
            console.warn("Invalid encrypted smtpPassword format");
            return value;
          }
          const decipher = crypto.createDecipheriv(
            "aes-256-cbc",
            keyBuffer,
            Buffer.from(iv, "hex")
          );
          let decrypted = decipher.update(encrypted, "hex", "utf8");
          decrypted += decipher.final("utf8");
          console.log("✅ smtpPassword decrypted successfully");
          return decrypted;
        } catch (error) {
          console.error("❌ Decryption failed for smtpPassword:", error.message);
          // Return the value as-is if decryption fails
          return value;
        }
      },
    },
    smtpFrom: {
      type: String,
      default: "noreply@grandhotel.com",
      trim: true,
      lowercase: true,
    },
    smtpSecure: { type: Boolean, default: false },
    enableEmailNotifications: { type: Boolean, default: true },
    enableSMSNotifications: { type: Boolean, default: false },
    bookingConfirmations: { type: Boolean, default: true },
    promotionalEmails: { type: Boolean, default: true },
    adminNotifications: { type: Boolean, default: true },
    passwordMinLength: { type: Number, default: 8, min: 6, max: 20 },
    requireSpecialCharacters: { type: Boolean, default: true },
    sessionTimeout: { type: Number, default: 30, min: 5, max: 120 },
    maxLoginAttempts: { type: Number, default: 5, min: 3, max: 10 },
    twoFactorRequired: { type: Boolean, default: false },
    allowGuestBooking: { type: Boolean, default: true },
    requireApproval: { type: Boolean, default: false },
    maxAdvanceBooking: { type: Number, default: 365, min: 1, max: 730 },
    cancellationPolicy: {
      type: String,
      default: "24 hours before check-in",
      trim: true,
    },
    defaultCheckInTime: { type: String, default: "15:00" },
    defaultCheckOutTime: { type: String, default: "11:00" },
    maxGuestsPerRoom: { type: Number, default: 4 },
    maintenanceMode: { type: Boolean, default: false },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastUpdatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, toJSON: { getters: true }, toObject: { getters: true } }
);

const AdminSettings = mongoose.model("AdminSettings", adminSettingsSchema);
export default AdminSettings;
