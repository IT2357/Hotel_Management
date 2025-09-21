// 📁 backend/config/environment.js
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const config = {
  // Server Configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Database Configuration
  MONGODB_URI:
    process.env.MONGODB_URI || "mongodb://localhost:27017/hotel-management",

  // JWT Configuration
  JWT_SECRET:
    process.env.JWT_SECRET || "f885fa53bc37eaab86296f11cada2c2939d4695c822a8bbba6b71ac9516488d",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // PayHere Payment Gateway Configuration
  PAYHERE: {
    MERCHANT_ID: process.env.PAYHERE_MERCHANT_ID || "",
    MERCHANT_SECRET: process.env.PAYHERE_MERCHANT_SECRET || "",
    API_URL:
      process.env.PAYHERE_API_URL || "https://sandbox.payhere.lk/pay/api/v2",
    API_TOKEN: process.env.PAYHERE_API_TOKEN || "",
    WEBHOOK_SECRET: process.env.PAYHERE_WEBHOOK_SECRET || "",
    IS_SANDBOX:
      process.env.PAYHERE_IS_SANDBOX === "true" ||
      process.env.NODE_ENV !== "production",
  },

  // Email Configuration
  EMAIL: {
    SERVICE: process.env.EMAIL_SERVICE || "gmail",
    HOST: process.env.EMAIL_HOST || "smtp.gmail.com",
    PORT: process.env.EMAIL_PORT || 587,
    SECURE: process.env.EMAIL_SECURE === "true",
    USER: process.env.EMAIL_USER || "",
    PASS: process.env.EMAIL_PASS || "",
    FROM_NAME: process.env.EMAIL_FROM_NAME || "Hotel Management System",
    FROM_EMAIL: process.env.EMAIL_FROM_EMAIL || "noreply@hotelmanagement.com",
  },

  // SMS Configuration
  SMS: {
    PROVIDER: process.env.SMS_PROVIDER || "twilio",
    ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || "",
    AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || "",
    PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || "",
  },

  // Redis Configuration
  REDIS: {
    URL: process.env.REDIS_URL || "redis://localhost:6379",
    PASSWORD: process.env.REDIS_PASSWORD || "",
    DB: process.env.REDIS_DB || 0,
  },

  // Cloudinary Configuration
  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
    API_KEY: process.env.CLOUDINARY_API_KEY || "",
    API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
  },

  // Frontend Configuration
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",

  // Security Configuration
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100,

  // File Upload Configuration
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES?.split(",") || [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
  ],

  // Refund Configuration
  REFUND: {
    MAX_REFUND_WINDOW_DAYS: parseInt(process.env.MAX_REFUND_WINDOW_DAYS) || 180,
    AUTO_APPROVE_THRESHOLD: parseFloat(process.env.AUTO_APPROVE_THRESHOLD) || 0, // 0 means no auto-approval
    REQUIRE_MANAGER_APPROVAL_ABOVE:
      parseFloat(process.env.REQUIRE_MANAGER_APPROVAL_ABOVE) || 10000,
    DEFAULT_PROCESSING_TIME_HOURS:
      parseInt(process.env.DEFAULT_PROCESSING_TIME_HOURS) || 24,
  },

  // Notification Configuration
  NOTIFICATIONS: {
    EMAIL_ENABLED: process.env.NOTIFICATIONS_EMAIL_ENABLED !== "false",
    SMS_ENABLED: process.env.NOTIFICATIONS_SMS_ENABLED === "true",
    PUSH_ENABLED: process.env.NOTIFICATIONS_PUSH_ENABLED === "true",
    DEFAULT_LANGUAGE: process.env.DEFAULT_LANGUAGE || "en",
  },

  // Logging Configuration
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  LOG_FILE_PATH: process.env.LOG_FILE_PATH || "./logs",

  // Development Configuration
  DEVELOPMENT: {
    MOCK_PAYMENTS: process.env.MOCK_PAYMENTS === "true",
    SKIP_EMAIL_VERIFICATION: process.env.SKIP_EMAIL_VERIFICATION === "true",
    DEBUG_MODE: process.env.DEBUG_MODE === "true",
  },
};

// Validation function to ensure required environment variables are set
export const validateEnvironment = () => {
  const requiredVars = [];

  if (config.NODE_ENV === "production") {
    if (
      !config.JWT_SECRET ||
      config.JWT_SECRET === "your-default-jwt-secret-change-in-production"
    ) {
      requiredVars.push("JWT_SECRET");
    }

    if (!config.MONGODB_URI) {
      requiredVars.push("MONGODB_URI");
    }

    if (!config.PAYHERE.MERCHANT_ID) {
      requiredVars.push("PAYHERE_MERCHANT_ID");
    }

    if (!config.PAYHERE.MERCHANT_SECRET) {
      requiredVars.push("PAYHERE_MERCHANT_SECRET");
    }
  }

  if (requiredVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${requiredVars.join(", ")}`
    );
  }
};

// Export configuration
export default config;
