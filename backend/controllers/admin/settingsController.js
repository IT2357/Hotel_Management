import EmailService from "../../services/notification/emailService.js";
import settingsService from "../../services/admin/settingsService.js";
import { handleError, sendSuccess } from "../../utils/responseFormatter.js";

export const getAdminSettings = async (req, res) => {
  try {
    const settings = await settingsService.getAdminSettings();
    sendSuccess(res, settings, "Settings retrieved successfully");
  } catch (error) {
    console.error("Get settings error:", {
      message: error.message,
      stack: error.stack,
    });
    handleError(res, error, "Failed to fetch settings");
  }
};

export const updateAdminSettings = async (req, res) => {
  try {
    const updates = req.body;
    const adminId = req.user?.id;
    if (!adminId) {
      throw new Error("Unauthorized: User ID not found in request");
    }
    console.log("Updating settings with:", updates);
    console.log("Admin ID:", adminId);
    const updatedSettings = await settingsService.updateAdminSettings(
      updates,
      adminId
    );
    sendSuccess(res, updatedSettings, "Settings updated successfully");
  } catch (error) {
    console.error("Update settings error:", {
      message: error.message,
      stack: error.stack,
      updates: req.body,
    });
    if (error.message.includes("Failed to encrypt SMTP password")) {
      return res.status(400).json({
        success: false,
        message:
          "Failed to encrypt SMTP password. Ensure the ENCRYPTION_KEY is a valid 64-character hexadecimal string and the Node.js environment is correctly configured.",
        error: error.message,
      });
    }
    handleError(res, error, "Failed to update settings");
  }
};

export const testEmailConfig = async (req, res) => {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPassword, smtpFrom, smtpSecure } =
      req.body;
    console.log("Testing email config:", {
      smtpHost,
      smtpPort,
      smtpUser,
      smtpFrom,
      smtpSecure,
    });
    await EmailService.testEmailConfig({
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      smtpFrom,
      smtpSecure,
    });
    sendSuccess(res, null, "Test email sent successfully");
  } catch (error) {
    console.error("Test email config error:", {
      message: error.message,
      stack: error.stack,
    });
    handleError(res, error, "Failed to send test email");
  }
};
