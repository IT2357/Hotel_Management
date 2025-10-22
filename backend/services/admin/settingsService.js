import AdminSettings from "../../models/AdminSettings.js";
import EmailService from "../notification/emailService.js";
import { clearSettingsCache } from "../../middleware/auth.js";
import BookingService from "../booking/bookingService.js";
import NotificationService from "../notification/notificationService.js";
import mongoose from "mongoose";

const settingsService = {
  async getAdminSettings() {
    try {
      if (mongoose.connection.readyState !== 1) {
        throw new Error("MongoDB connection not ready");
      }
      let settings = await AdminSettings.findOne().lean();
      if (!settings) {
        settings = await AdminSettings.create({});
      }
      return settings;
    } catch (error) {
      console.error("Error fetching admin settings:", {
        message: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to fetch settings: ${error.message}`);
    }
  },

  async updateAdminSettings(updates, adminId) {
    try {
      if (mongoose.connection.readyState !== 1) {
        throw new Error("MongoDB connection not ready");
      }

      const allowedFields = [
        // Basic settings
        "siteName",
        "hotelName",
        "description",
        "contactEmail",
        "contactPhone",
        "address",
        "timezone",
        "currency",
        
        // Email settings
        "smtpHost",
        "smtpPort",
        "smtpUser",
        "smtpPassword",
        "smtpFrom",
        "smtpSecure",
        
        // Notification settings
        "enableEmailNotifications",
        "enableSMSNotifications",
        "bookingConfirmations",
        "promotionalEmails",
        "adminNotifications",
        "smsProvider",
        "smsAccountSid",
        "smsAuthToken",
        "smsPhoneNumber",
        "enableGoogleAuth",
        "enableFacebookAuth",
        "enableSocialRegistration",
        "autoApprovalThreshold",
        "approvalTimeoutHours",
        
        // Security settings
        "passwordMinLength",
        "requireSpecialCharacters",
        "sessionTimeout",
        "maxLoginAttempts",
        "twoFactorRequired",
        "allowGuestBooking",
        "requireApprovalForAllBookings",
        "maxAdvanceBooking",
        "cancellationPolicy",
        "defaultCheckInTime",
        "defaultCheckOutTime",
        "maxGuestsPerRoom",
        "maintenanceMode",
        
        // Operational settings
        "operationalSettings",
        
        // Payment Gateway settings
        "paymentGateway",
        
        // Room Management settings
        "roomSettings",
        
        // Staff Management settings
        "staffSettings",
        
        // Financial settings
        "financialSettings",
        
        // Reporting settings
        "reportingSettings",
        
        // Integration settings
        "integrationSettings",
        
        // System settings
        "systemSettings",
        
        // Customization settings
        "customizationSettings",
        
        // Guest Experience settings
        "guestSettings",
      ];

      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([key]) => allowedFields.includes(key))
      );

      if (Object.keys(filteredUpdates).length === 0) {
        throw new Error("No valid fields for update");
      }

      console.log("Filtered updates:", filteredUpdates);

      // Validate numeric fields
      if (filteredUpdates.smtpPort && isNaN(filteredUpdates.smtpPort)) {
        throw new Error("smtpPort must be a number");
      }
      if (
        filteredUpdates.passwordMinLength &&
        isNaN(filteredUpdates.passwordMinLength)
      ) {
        throw new Error("passwordMinLength must be a number");
      }
      if (
        filteredUpdates.sessionTimeout &&
        isNaN(filteredUpdates.sessionTimeout)
      ) {
        throw new Error("sessionTimeout must be a number");
      }
      if (
        filteredUpdates.maxLoginAttempts &&
        isNaN(filteredUpdates.maxLoginAttempts)
      ) {
        throw new Error("maxLoginAttempts must be a number");
      }
      if (
        filteredUpdates.maxAdvanceBooking &&
        isNaN(filteredUpdates.maxAdvanceBooking)
      ) {
        throw new Error("maxAdvanceBooking must be a number");
      }
      if (
        filteredUpdates.maxGuestsPerRoom &&
        isNaN(filteredUpdates.maxGuestsPerRoom)
      ) {
        throw new Error("maxGuestsPerRoom must be a number");
      }
      if (
        filteredUpdates.autoApprovalThreshold &&
        isNaN(filteredUpdates.autoApprovalThreshold)
      ) {
        throw new Error("autoApprovalThreshold must be a number");
      }
      if (
        filteredUpdates.approvalTimeoutHours &&
        isNaN(filteredUpdates.approvalTimeoutHours)
      ) {
        throw new Error("approvalTimeoutHours must be a number");
      }

      const settings = await AdminSettings.findOneAndUpdate(
        {},
        {
          ...filteredUpdates,
          lastUpdatedBy: adminId,
          lastUpdatedAt: new Date(),
        },
        { new: true, runValidators: true, upsert: true }
      );

      // Reinitialize transporter only if SMTP settings are updated
      const smtpFields = [
        "smtpHost",
        "smtpPort",
        "smtpUser",
        "smtpPassword",
        "smtpFrom",
        "smtpSecure",
      ];
      if (
        Object.keys(filteredUpdates).some((key) => smtpFields.includes(key))
      ) {
        console.log("SMTP settings updated, reinitializing transporter");
        try {
          await EmailService.reinitializeTransporter();
        } catch (transporterError) {
          console.warn("Failed to reinitialize email transporter:", {
            message: transporterError.message,
            stack: transporterError.stack,
          });
        }
      }

      // Clear all service caches when settings are updated
      clearSettingsCache();
      BookingService.clearSettingsCache();
      NotificationService.settingsCache = null;
      NotificationService.settingsCacheTime = 0;

      return settings;
    } catch (error) {
      console.error("Error updating admin settings:", {
        message: error.message,
        stack: error.stack,
        updates,
        adminId,
      });
      throw new Error(`Failed to update settings: ${error.message}`);
    }
  },

  // Backup settings
  async backupSettings() {
    try {
      const settings = await AdminSettings.findOne().lean();
      if (!settings) {
        throw new Error("No settings found to backup");
      }
      
      // Remove sensitive data from backup
      const backup = { ...settings };
      delete backup.smtpPassword;
      if (backup.paymentGateway) {
        delete backup.paymentGateway.secretKey;
      }
      
      return {
        ...backup,
        backupDate: new Date(),
        version: "1.0"
      };
    } catch (error) {
      console.error("Error backing up settings:", error);
      throw new Error(`Failed to backup settings: ${error.message}`);
    }
  },

  // Restore settings from backup
  async restoreSettings(backupData, adminId) {
    try {
      if (!backupData || typeof backupData !== 'object') {
        throw new Error("Invalid backup data provided");
      }

      // Remove backup metadata
      const { backupDate, version, _id, createdAt, updatedAt, __v, ...settingsData } = backupData;
      
      const settings = await AdminSettings.findOneAndUpdate(
        {},
        {
          ...settingsData,
          lastUpdatedBy: adminId,
          lastUpdatedAt: new Date(),
        },
        { new: true, runValidators: true, upsert: true }
      );

      return settings;
    } catch (error) {
      console.error("Error restoring settings:", error);
      throw new Error(`Failed to restore settings: ${error.message}`);
    }
  },

  // Reset settings to defaults
  async resetToDefaults(adminId) {
    try {
      await AdminSettings.deleteMany({});
      const defaultSettings = await AdminSettings.create({
        lastUpdatedBy: adminId,
        lastUpdatedAt: new Date(),
      });
      return defaultSettings;
    } catch (error) {
      console.error("Error resetting settings:", error);
      throw new Error(`Failed to reset settings: ${error.message}`);
    }
  },

  // Validate payment gateway configuration
  async validatePaymentGateway(config) {
    try {
      const { provider, publicKey, secretKey, testMode } = config;
      
      if (!provider || !publicKey || !secretKey) {
        throw new Error("Missing required payment gateway configuration");
      }

      // Basic validation based on provider
      switch (provider) {
        case 'stripe':
          if (!publicKey.startsWith(testMode ? 'pk_test_' : 'pk_live_')) {
            throw new Error("Invalid Stripe public key format");
          }
          if (!secretKey.startsWith(testMode ? 'sk_test_' : 'sk_live_')) {
            throw new Error("Invalid Stripe secret key format");
          }
          break;
        case 'paypal':
          // PayPal validation logic
          break;
        default:
          console.warn(`No specific validation for provider: ${provider}`);
      }

      return { valid: true, message: "Payment gateway configuration is valid" };
    } catch (error) {
      return { valid: false, message: error.message };
    }
  },

  // Get settings by category
  async getSettingsByCategory(category) {
    try {
      const settings = await this.getAdminSettings();
      
      switch (category) {
        case 'general':
          return {
            siteName: settings.siteName,
            hotelName: settings.hotelName,
            description: settings.description,
            contactEmail: settings.contactEmail,
            contactPhone: settings.contactPhone,
            address: settings.address,
            timezone: settings.timezone,
            currency: settings.currency,
          };
        case 'email':
          return {
            smtpHost: settings.smtpHost,
            smtpPort: settings.smtpPort,
            smtpUser: settings.smtpUser,
            smtpFrom: settings.smtpFrom,
            smtpSecure: settings.smtpSecure,
          };
        case 'notifications':
          return {
            enableEmailNotifications: settings.enableEmailNotifications,
            enableSMSNotifications: settings.enableSMSNotifications,
            bookingConfirmations: settings.bookingConfirmations,
            promotionalEmails: settings.promotionalEmails,
            adminNotifications: settings.adminNotifications,
          };
        case 'security':
          return {
            passwordMinLength: settings.passwordMinLength,
            requireSpecialCharacters: settings.requireSpecialCharacters,
            sessionTimeout: settings.sessionTimeout,
            maxLoginAttempts: settings.maxLoginAttempts,
            twoFactorRequired: settings.twoFactorRequired,
          };
        case 'operational':
          return settings.operationalSettings || {};
        case 'booking':
          return {
            allowGuestBooking: settings.allowGuestBooking,
            requireApproval: settings.requireApproval,
            maxAdvanceBooking: settings.maxAdvanceBooking,
            cancellationPolicy: settings.cancellationPolicy,
            defaultCheckInTime: settings.defaultCheckInTime,
            defaultCheckOutTime: settings.defaultCheckOutTime,
            maxGuestsPerRoom: settings.maxGuestsPerRoom,
          };
        case 'payment':
          return settings.paymentGateway || {};
        case 'rooms':
          return settings.roomSettings || {};
        case 'staff':
          return settings.staffSettings || {};
        case 'financial':
          return settings.financialSettings || {};
        case 'reporting':
          return settings.reportingSettings || {};
        case 'integrations':
          return settings.integrationSettings || {};
        case 'system':
          return settings.systemSettings || {};
        case 'customization':
          return settings.customizationSettings || {};
        case 'guest':
          return settings.guestSettings || {};
      }
    } catch (error) {
      console.error(`Error getting settings for category ${category}:`, error);
      throw new Error(`Failed to get settings for category: ${error.message}`);
    }
  },
};

export default settingsService;
