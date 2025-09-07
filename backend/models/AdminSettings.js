import mongoose from "mongoose";
import crypto from "crypto";

const encryptionKey = process.env.ENCRYPTION_KEY;

if (!encryptionKey) {
  console.error("❌ ENCRYPTION_KEY is not defined in environment variables");
  throw new Error("ENCRYPTION_KEY is required for SMTP password encryption");
}

try {
  console.log(
    "Validating ENCRYPTION_KEY at module load:",
    `${encryptionKey.slice(0, 4)}...${encryptionKey.slice(-4)}`
  );
  const keyBuffer = Buffer.from(encryptionKey, "hex");
  if (keyBuffer.length !== 32) {
    console.error(
      `❌ ENCRYPTION_KEY must be a 64-character hexadecimal string (32 bytes). Current length: ${encryptionKey.length} characters`
    );
    throw new Error("ENCRYPTION_KEY must be a 32-byte hex string");
  }
  console.log(
    "✅ ENCRYPTION_KEY validated successfully, length:",
    keyBuffer.length,
    "bytes"
  );
} catch (error) {
  console.error("❌ Invalid ENCRYPTION_KEY format:", {
    message: error.message,
    key: encryptionKey
      ? `${encryptionKey.slice(0, 4)}...${encryptionKey.slice(-4)}`
      : "undefined",
  });
  throw new Error("ENCRYPTION_KEY must contain valid hexadecimal characters");
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
        try {
          console.log(
            "Preparing to encrypt smtpPassword, input length:",
            value.length
          );
          console.log(
            "Using ENCRYPTION_KEY:",
            `${encryptionKey.slice(0, 4)}...${encryptionKey.slice(-4)}`
          );
          const keyBuffer = Buffer.from(encryptionKey, "hex");
          console.log("Key buffer length:", keyBuffer.length, "bytes");
          if (keyBuffer.length !== 32) {
            throw new Error(
              "ENCRYPTION_KEY is invalid at encryption time (not 32 bytes)"
            );
          }
          const iv = crypto.randomBytes(16);
          const cipher = crypto.createCipheriv("aes-256-cbc", keyBuffer, iv);
          let encrypted = cipher.update(value, "utf8", "hex");
          encrypted += cipher.final("hex");
          const result = `${iv.toString("hex")}:${encrypted}`;
          console.log(
            "✅ smtpPassword encrypted successfully, output length:",
            result.length
          );
          return result;
        } catch (error) {
          console.error("❌ Encryption failed for smtpPassword:", {
            message: error.message,
            stack: error.stack,
            valueLength: value.length,
            encryptionKey: `${encryptionKey.slice(
              0,
              4
            )}...${encryptionKey.slice(-4)}`,
            keyBufferLength: Buffer.from(encryptionKey, "hex").length,
          });
          throw new Error(`Failed to encrypt SMTP password: ${error.message}`);
        }
      },
      get: function (value) {
        if (!value) {
          console.log("smtpPassword is empty, skipping decryption");
          return "";
        }
        try {
          console.log(
            "Preparing to decrypt smtpPassword, input length:",
            value.length
          );
          console.log(
            "Using ENCRYPTION_KEY:",
            `${encryptionKey.slice(0, 4)}...${encryptionKey.slice(-4)}`
          );
          const keyBuffer = Buffer.from(encryptionKey, "hex");
          console.log("Key buffer length:", keyBuffer.length, "bytes");
          if (keyBuffer.length !== 32) {
            throw new Error(
              "ENCRYPTION_KEY is invalid at decryption time (not 32 bytes)"
            );
          }
          const [iv, encrypted] = value.split(":");
          if (!iv || !encrypted) {
            console.warn(
              "Invalid encrypted smtpPassword format, returning empty string"
            );
            return "";
          }
          const decipher = crypto.createDecipheriv(
            "aes-256-cbc",
            keyBuffer,
            Buffer.from(iv, "hex")
          );
          let decrypted = decipher.update(encrypted, "hex", "utf8");
          decrypted += decipher.final("utf8");
          console.log(
            "✅ smtpPassword decrypted successfully, output length:",
            decrypted.length
          );
          return decrypted;
        } catch (error) {
          console.error("❌ Decryption failed for smtpPassword:", {
            message: error.message,
            stack: error.stack,
            valueLength: value.length,
            encryptionKey: `${encryptionKey.slice(
              0,
              4
            )}...${encryptionKey.slice(-4)}`,
          });
          return "";
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
