import AdminSettings from "../../models/AdminSettings.js";
import EmailService from "../notification/emailService.js";
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
        "siteName",
        "hotelName",
        "description",
        "contactEmail",
        "contactPhone",
        "address",
        "timezone",
        "currency",
        "smtpHost",
        "smtpPort",
        "smtpUser",
        "smtpPassword",
        "smtpFrom",
        "smtpSecure",
        "enableEmailNotifications",
        "enableSMSNotifications",
        "bookingConfirmations",
        "promotionalEmails",
        "adminNotifications",
        "passwordMinLength",
        "requireSpecialCharacters",
        "sessionTimeout",
        "maxLoginAttempts",
        "twoFactorRequired",
        "allowGuestBooking",
        "requireApproval",
        "maxAdvanceBooking",
        "cancellationPolicy",
        "defaultCheckInTime",
        "defaultCheckOutTime",
        "maxGuestsPerRoom",
        "maintenanceMode",
      ];

      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([key]) => allowedFields.includes(key))
      );

      if (Object.keys(filteredUpdates).length === 0) {
        throw new Error("No valid fields provided for update");
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
};

export default settingsService;
