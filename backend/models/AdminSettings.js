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
    timezone: { type: String, default: "Asia/Colombo", trim: true },
    currency: {
      type: String,
      default: "LKR",
      enum: ["LKR", "USD", "EUR", "GBP", "CAD", "AUD", "JPY", "INR"],
    },
    smtpHost: { type: String, default: "smtp.gmail.com", trim: true },
    smtpPort: { type: Number, default: 587, min: 1, max: 65535 },
    smtpUser: { type: String, default: "", trim: true },
    smtpPassword: {
      type: String,
      default: "",
      set: function(value) {
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
      get: function(value) {
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
      }
    },
    smtpFrom: {
      type: String,
      default: "noreply@grandhotel.com",
      trim: true,
      lowercase: true,
    },
    smtpSecure: { type: Boolean, default: false },
    
    // SMS Settings
    smsProvider: { type: String, default: "twilio", enum: ["twilio", "aws-sns", "nexmo", "dialog", "mobitel"] },
    smsAccountSid: { type: String, default: "", trim: true },
    smsAuthToken: { type: String, default: "", trim: true },
    smsPhoneNumber: { type: String, default: "", trim: true },
    
    // Social Authentication Settings
    googleClientId: { type: String, default: "", trim: true },
    googleClientSecret: { type: String, default: "", trim: true },
    facebookAppId: { type: String, default: "", trim: true },
    facebookAppSecret: { type: String, default: "", trim: true },
    enableGoogleAuth: { type: Boolean, default: false },
    enableFacebookAuth: { type: Boolean, default: false },
    enableSocialRegistration: { type: Boolean, default: true },
    
    enableEmailNotifications: { type: Boolean, default: true },
    autoApprovalThreshold: { type: Number, default: 5000, min: 0 }, // Auto-approve bookings below this amount
    bookingConfirmations: { type: Boolean, default: true },
    promotionalEmails: { type: Boolean, default: true },
    approvalTimeoutHours: { type: Number, default: 24, min: 1, max: 168 }, // Hours after which pending bookings auto-expire
    passwordMinLength: { type: Number, default: 8, min: 6, max: 20 },
    requireSpecialCharacters: { type: Boolean, default: true },
    sessionTimeout: { type: Number, default: 30, min: 5, max: 120 },
    maxLoginAttempts: { type: Number, default: 5, min: 3, max: 10 },
    twoFactorRequired: { type: Boolean, default: false },
    allowGuestBooking: { type: Boolean, default: true },
    requireApprovalForAllBookings: { type: Boolean, default: false },
    maxAdvanceBooking: { type: Number, default: 365, min: 1, max: 730 },
    cancellationPolicy: {
      type: String,
      default: "24 hours before check-in",
      trim: true,
    },
    
    // Booking Settings
    bookingSettings: {
      autoApprovalEnabled: { type: Boolean, default: false },
      autoApprovalThreshold: { type: Number, default: 5000, min: 0 },
      requireCashApproval: { type: Boolean, default: true }, // Always require approval for cash payments
      requireBankApproval: { type: Boolean, default: true }, // Require approval for bank transfers
      requireCardApproval: { type: Boolean, default: false }, // Auto-approve card payments below threshold
      approvalTimeoutHours: { type: Number, default: 24, min: 1, max: 168 }
    },
    // Auto-approval settings
    autoApprovalSettings: {
      enabled: { type: Boolean, default: false },
      allowGuestBookingModifications: { type: Boolean, default: true },
      maxGuests: { type: Number, default: 4, min: 1, max: 20 }, // Maximum guests for auto-approval
      maxNights: { type: Number, default: 7, min: 1, max: 30 }, // Maximum nights for auto-approval
      allowedRoomTypes: [{ type: String }], // Specific room types that can be auto-approved
      requireApprovalForNewGuests: { type: Boolean, default: true }, // Require approval for first-time guests
      requireApprovalOutsideHours: { type: Boolean, default: true }, // Require approval for out-of-hours bookings
      reminderHoursBeforeCheckIn: { type: Number, default: 48, min: 1, max: 168 },
    },
    // Operational Time Settings
    operationalSettings: {
      enabled: { type: Boolean, default: true },
      startTime: { type: String, default: "06:00" }, // HH:MM format
      endTime: { type: String, default: "23:00" }, // HH:MM format
      allowedDays: {
        type: [String],
        default: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
        enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
      },
      checkInWindowStart: { type: String, default: "14:00" }, // Check-in window start
      checkInWindowEnd: { type: String, default: "22:00" }, // Check-in window end
      checkOutWindowStart: { type: String, default: "07:00" }, // Check-out window start
      checkOutWindowEnd: { type: String, default: "12:00" }, // Check-out window end
      advanceBookingDays: { type: Number, default: 365, min: 1, max: 730 }, // Max days in advance
      minStayHours: { type: Number, default: 24, min: 1, max: 168 }, // Minimum stay in hours
      maxStayDays: { type: Number, default: 30, min: 1, max: 365 }, // Maximum stay in days
      cleaningBufferHours: { type: Number, default: 2, min: 0, max: 24 }, // Hours between bookings for cleaning
      maintenanceDays: [{ // Days when hotel is closed for maintenance
        date: Date,
        reason: String,
        isActive: { type: Boolean, default: true }
      }],
      specialClosures: [{ // Special closure periods
        startDate: Date,
        endDate: Date,
        reason: String,
        isActive: { type: Boolean, default: true }
      }],
      allowBookingsOutsideHours: { type: Boolean, default: false }, // Allow bookings even outside operational hours
      requireApprovalOutsideHours: { type: Boolean, default: true }, // Require admin approval for out-of-hours bookings
      autoCancelOutsideHours: { type: Boolean, default: false }, // Auto-cancel bookings outside operational hours
      notificationThresholdMinutes: { type: Number, default: 60, min: 0, max: 1440 } // Notify admin X minutes before operational hours
    },
    
    // Payment Gateway Settings
    paymentGateway: {
      provider: { type: String, default: "payhere", enum: ["payhere", "stripe", "paypal", "square", "razorpay"] },
      publicKey: { type: String, default: "", trim: true },
      secretKey: { 
        type: String, 
        default: "", 
        trim: true,
        set: function(value) {
          if (!value) return "";
          try {
            const keyBuffer = Buffer.from(encryptionKey, "hex");
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv("aes-256-cbc", keyBuffer, iv);
            let encrypted = cipher.update(value, "utf8", "hex");
            encrypted += cipher.final("hex");
            return `${iv.toString("hex")}:${encrypted}`;
          } catch (error) {
            console.error("Payment key encryption failed:", error);
            throw new Error(`Failed to encrypt payment key: ${error.message}`);
          }
        },
        get: function(value) {
          if (!value) return "";
          try {
            const keyBuffer = Buffer.from(encryptionKey, "hex");
            const [iv, encrypted] = value.split(":");
            if (!iv || !encrypted) return "";
            const decipher = crypto.createDecipheriv("aes-256-cbc", keyBuffer, Buffer.from(iv, "hex"));
            let decrypted = decipher.update(encrypted, "hex", "utf8");
            decrypted += decipher.final("utf8");
            return decrypted;
          } catch (error) {
            console.error("Payment key decryption failed:", error);
            return "";
          }
        }
      },
      webhookSecret: { type: String, default: "", trim: true },
      testMode: { type: Boolean, default: true },
      supportedCurrencies: [{ type: String, default: ["USD", "EUR", "GBP"] }],
      autoCapture: { type: Boolean, default: true },
      refundPolicy: { type: String, default: "full", enum: ["full", "partial", "none"] }
    },

    // Room Management Settings
    roomSettings: {
      autoAssignment: { type: Boolean, default: true },
      overbookingAllowed: { type: Boolean, default: false },
      overbookingPercentage: { type: Number, default: 0, min: 0, max: 20 },
      housekeepingBuffer: { type: Number, default: 30, min: 0, max: 120 }, // minutes
      maintenanceMode: { type: Boolean, default: false },
      roomBlockingEnabled: { type: Boolean, default: true },
      seasonalPricing: { type: Boolean, default: false },
      dynamicPricing: { type: Boolean, default: false },
      minimumStay: { type: Number, default: 1, min: 1, max: 30 },
      maximumStay: { type: Number, default: 30, min: 1, max: 365 }
    },

    // Staff Management Settings
    staffSettings: {
      shiftDuration: { type: Number, default: 8, min: 4, max: 12 }, // hours
      overtimeThreshold: { type: Number, default: 40, min: 30, max: 60 }, // hours per week
      autoScheduling: { type: Boolean, default: false },
      breakDuration: { type: Number, default: 30, min: 15, max: 60 }, // minutes
      clockInGracePeriod: { type: Number, default: 15, min: 0, max: 30 }, // minutes
      performanceTracking: { type: Boolean, default: true },
      reminderHoursBeforeCheckIn: { type: Number, default: 48, min: 1, max: 168 },
      certificationTracking: { type: Boolean, default: true }
    },

    // Financial Settings
    financialSettings: {
      taxRate: { type: Number, default: 0, min: 0, max: 50 }, // percentage
      serviceFee: { type: Number, default: 0, min: 0, max: 30 }, // percentage
      approvalNotificationChannels: [{ type: String, enum: ['email', 'sms', 'push'], default: ['email'] }],
      depositAmount: { type: Number, default: 100, min: 0 }, // amount or percentage
      depositType: { type: String, default: "fixed", enum: ["fixed", "percentage"] },
      lateFeeEnabled: { type: Boolean, default: true },
      lateFeeAmount: { type: Number, default: 50, min: 0 },
      invoicePrefix: { type: String, default: "INV", trim: true },
      invoiceNumbering: { type: String, default: "sequential", enum: ["sequential", "random", "date-based"] },
      fiscalYearStart: { type: String, default: "01-01" }, // MM-DD format
      multiCurrencyEnabled: { type: Boolean, default: false }
    },

    // Reporting Settings
    reportingSettings: {
      autoReports: { type: Boolean, default: true },
      reportFrequency: { type: String, default: "daily", enum: ["daily", "weekly", "monthly"] },
      reportRecipients: [{ type: String, trim: true, lowercase: true }],
      includeFinancials: { type: Boolean, default: true },
      includeOccupancy: { type: Boolean, default: true },
      includeStaffMetrics: { type: Boolean, default: false },
      dataRetention: { type: Number, default: 365, min: 30, max: 2555 }, // days
      exportFormats: [{ type: String, default: ["pdf", "excel", "csv"] }],
      dashboardRefresh: { type: Number, default: 300, min: 60, max: 3600 } // seconds
    },

    // Integration Settings
    integrationSettings: {
      channelManager: {
        enabled: { type: Boolean, default: false },
        provider: { type: String, default: "", trim: true },
        apiKey: { type: String, default: "", trim: true },
        syncFrequency: { type: Number, default: 15, min: 5, max: 60 } // minutes
      },
      pms: {
        enabled: { type: Boolean, default: false },
        provider: { type: String, default: "", trim: true },
        endpoint: { type: String, default: "", trim: true }
      },
      accounting: {
        enabled: { type: Boolean, default: false },
        provider: { type: String, default: "", trim: true },
        syncBookings: { type: Boolean, default: true },
        syncPayments: { type: Boolean, default: true }
      }
    },

    // System Settings
    systemSettings: {
      backupEnabled: { type: Boolean, default: true },
      backupFrequency: { type: String, default: "daily", enum: ["hourly", "daily", "weekly"] },
      backupRetention: { type: Number, default: 30, min: 7, max: 365 }, // days
      auditLogging: { type: Boolean, default: true },
      performanceMonitoring: { type: Boolean, default: true },
      errorReporting: { type: Boolean, default: true },
      maintenanceWindow: { type: String, default: "02:00-04:00" },
      systemAlerts: { type: Boolean, default: true },
      resourceLimits: {
        maxUsers: { type: Number, default: 100, min: 1, max: 1000 },
        maxRooms: { type: Number, default: 500, min: 1, max: 5000 },
        maxBookings: { type: Number, default: 10000, min: 100, max: 100000 }
      }
    },

    // Customization Settings
    customizationSettings: {
      theme: { type: String, default: "default", enum: ["default", "dark", "light", "custom"] },
      primaryColor: { type: String, default: "#4F46E5", trim: true },
      secondaryColor: { type: String, default: "#7C3AED", trim: true },
      logo: { type: String, default: "", trim: true }, // URL or base64
      favicon: { type: String, default: "", trim: true },
      customCSS: { type: String, default: "", trim: true },
      language: { type: String, default: "en", enum: ["en", "es", "fr", "de", "it", "pt", "zh", "ja"] },
      dateFormat: { type: String, default: "MM/DD/YYYY", enum: ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"] },
      timeFormat: { type: String, default: "12", enum: ["12", "24"] },
      weekStart: { type: String, default: "sunday", enum: ["sunday", "monday"] }
    },

    guestSettings: {
      guestPortal: { type: Boolean, default: true },
      mobileKeys: { type: Boolean, default: false },
      loyaltyProgram: { type: Boolean, default: false },
      conciergeServices: { type: Boolean, default: true },
      roomServiceOrdering: { type: Boolean, default: false },
      wifiCredentials: {
        network: { type: String, default: '', trim: true },
        password: { type: String, default: '', trim: true }
      },
      welcomeMessage: { type: String, default: 'Welcome to our hotel!', trim: true },
      checkoutInstructions: { type: String, default: '', trim: true }
    },

    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastUpdatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, toJSON: { getters: true }, toObject: { getters: true } }
);

const AdminSettings = mongoose.model("AdminSettings", adminSettingsSchema);
export default AdminSettings;
