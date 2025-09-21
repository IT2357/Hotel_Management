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

export const testSMSConfig = async (req, res) => {
  try {
    const { smsProvider, smsAccountSid, smsAuthToken, smsPhoneNumber } = req.body;
    
    console.log("Testing SMS config:", {
      smsProvider,
      smsAccountSid: smsAccountSid ? "***" : "",
      smsPhoneNumber,
    });

    // For now, we'll just validate the configuration
    // In production, you would integrate with actual SMS providers
    
    if (!smsProvider || !smsAccountSid || !smsAuthToken || !smsPhoneNumber) {
      return res.status(400).json({
        success: false,
        message: "SMS configuration is incomplete. Please provide all required fields."
      });
    }

    // Mock SMS sending for testing
    console.log("Mock SMS test sent to:", smsPhoneNumber);
    
    sendSuccess(res, null, "SMS configuration test completed successfully");
  } catch (error) {
    console.error("Test SMS config error:", {
      message: error.message,
      stack: error.stack,
    });
    handleError(res, error, "Failed to test SMS configuration");
  }
};

export const testSocialAuthConfig = async (req, res) => {
  try {
    const { 
      googleClientId, 
      googleClientSecret, 
      facebookAppId, 
      facebookAppSecret,
      enableGoogleAuth,
      enableFacebookAuth 
    } = req.body;

    console.log("Testing social auth config:", {
      googleConfigured: !!(googleClientId && googleClientSecret && enableGoogleAuth),
      facebookConfigured: !!(facebookAppId && facebookAppSecret && enableFacebookAuth),
    });

    const issues = [];

    if (enableGoogleAuth && (!googleClientId || !googleClientSecret)) {
      issues.push("Google authentication is enabled but client credentials are missing");
    }

    if (enableFacebookAuth && (!facebookAppId || !facebookAppSecret)) {
      issues.push("Facebook authentication is enabled but app credentials are missing");
    }

    if (!enableGoogleAuth && !enableFacebookAuth) {
      issues.push("No social authentication providers are enabled");
    }

    if (issues.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Social authentication configuration issues found",
        issues
      });
    }

    sendSuccess(res, {
      googleConfigured: !!(googleClientId && googleClientSecret && enableGoogleAuth),
      facebookConfigured: !!(facebookAppId && facebookAppSecret && enableFacebookAuth),
    }, "Social authentication configuration is valid");
  } catch (error) {
    console.error("Test social auth config error:", {
      message: error.message,
      stack: error.stack,
    });
    handleError(res, error, "Failed to test social authentication configuration");
  }
};

export const getSettingsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const settings = await settingsService.getSettingsByCategory(category);
    sendSuccess(res, settings, `${category} settings retrieved successfully`);
  } catch (error) {
    console.error("Get settings by category error:", {
      message: error.message,
      stack: error.stack,
      category: req.params.category,
    });
    handleError(res, error, "Failed to fetch settings by category");
  }
};

export const backupSettings = async (req, res) => {
  try {
    const backup = await settingsService.backupSettings();
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="settings-backup-${new Date().toISOString().split('T')[0]}.json"`);
    
    res.json({
      success: true,
      message: "Settings backup created successfully",
      data: backup
    });
  } catch (error) {
    console.error("Backup settings error:", {
      message: error.message,
      stack: error.stack,
    });
    handleError(res, error, "Failed to backup settings");
  }
};

export const restoreSettings = async (req, res) => {
  try {
    const backupData = req.body;
    const adminId = req.user?.id;
    
    if (!adminId) {
      throw new Error("Unauthorized: User ID not found in request");
    }
    
    const restoredSettings = await settingsService.restoreSettings(backupData, adminId);
    sendSuccess(res, restoredSettings, "Settings restored successfully");
  } catch (error) {
    console.error("Restore settings error:", {
      message: error.message,
      stack: error.stack,
    });
    handleError(res, error, "Failed to restore settings");
  }
};

export const resetToDefaults = async (req, res) => {
  try {
    const adminId = req.user?.id;
    
    if (!adminId) {
      throw new Error("Unauthorized: User ID not found in request");
    }
    
    const defaultSettings = await settingsService.resetToDefaults(adminId);
    sendSuccess(res, defaultSettings, "Settings reset to defaults successfully");
  } catch (error) {
    console.error("Reset settings error:", {
      message: error.message,
      stack: error.stack,
    });
    handleError(res, error, "Failed to reset settings");
  }
};

export const validatePaymentGateway = async (req, res) => {
  try {
    const config = req.body;
    const validation = await settingsService.validatePaymentGateway(config);
    
    if (validation.valid) {
      sendSuccess(res, validation, "Payment gateway configuration is valid");
    } else {
      res.status(400).json({
        success: false,
        message: validation.message,
        error: "Invalid payment gateway configuration"
      });
    }
  } catch (error) {
    console.error("Validate payment gateway error:", {
      message: error.message,
      stack: error.stack,
    });
    handleError(res, error, "Failed to validate payment gateway");
  }
};
