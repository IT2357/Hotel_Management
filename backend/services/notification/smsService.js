// 📁 backend/services/notification/smsService.js
import twilio from "twilio";

// Check if SMS service is enabled
const isSmsEnabled = process.env.SMS_ENABLED === "true";

// Initialize Twilio client only if SMS is enabled and all required vars are present
let client = null;

if (isSmsEnabled) {
  // Validate required environment variables
  const requiredEnvVars = [
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_PHONE_NUMBER",
  ];

  const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missingVars.length > 0) {
    console.error(
      `❌ Missing required SMS configuration: ${missingVars.join(", ")}`
    );
    console.warn(
      "⚠️ SMS service will be disabled due to missing configuration"
    );
  } else {
    try {
      client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      console.log("✅ Twilio SMS client initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize Twilio client:", error);
      client = null;
    }
  }
} else {
  console.log("📱 SMS service is disabled (SMS_ENABLED=false)");
}

export const sendSMS = async ({ to, message }) => {
  if (!client) {
    throw new Error("SMS service is not available - client not initialized");
  }

  if (!to || !message) {
    throw new Error("SMS requires both 'to' and 'message' parameters");
  }

  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    console.log("📱 SMS sent successfully:", result.sid);
    return result;
  } catch (error) {
    console.error("❌ Error sending SMS:", error);
    throw error;
  }
};
