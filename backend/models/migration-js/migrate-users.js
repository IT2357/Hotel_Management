import mongoose from "mongoose";
import { User, Guest, Staff, Manager, Admin } from "../User.js";
import GuestProfile from "../profiles/GuestProfile.js";
import StaffProfile from "../profiles/StaffProfile.js";
import ManagerProfile from "../profiles/ManagerProfile.js";
import AdminProfile from "../profiles/AdminProfile.js";

async function migrateUsers() {
  try {
    await mongoose.connect("mongodb://localhost:27017/hotel-management");
    console.log("Connected to MongoDB");

    const users = await User.find({});

    for (const user of users) {
      // Prepare update object for user fields
      const update = {
        $set: {
          tokenVersion: user.tokenVersion ?? 0,
          notificationPreferences: user.notificationPreferences ?? {
            email: true,
            inApp: true,
            sms: false,
          },
          authProviders: user.authProviders ?? [],
          loginHistory: user.loginHistory ?? [],
          lastLogin: user.lastLogin ?? user.updatedAt,
          address: user.address ?? {},
          otp: user.otp ?? { code: undefined, expiresAt: undefined },
        },
        $unset: { socialLogins: 1 }, // Explicitly remove socialLogins
      };

      // Update user document
      await User.findOneAndUpdate({ _id: user._id }, update, {
        new: true,
        versionKey: false,
      });

      // Create/link role-specific profile
      let DiscriminatorModel;
      let ProfileModel;
      let profileField;
      let profileData;

      switch (user.role) {
        case "guest":
          DiscriminatorModel = Guest;
          ProfileModel = GuestProfile;
          profileField = "guestProfile";
          profileData = {
            userId: user._id,
            preferences: {
              preferredLanguage: "en",
              allergies: [],
              dietaryRestrictions: [],
              roomPreferences: {},
            },
            loyaltyPoints: 0,
            membershipLevel: "standard",
            verificationStatus: "unverified",
            blacklisted: false,
          };
          break;
        case "staff":
          DiscriminatorModel = Staff;
          ProfileModel = StaffProfile;
          profileField = "staffProfile";
          profileData = {
            userId: user._id,
            department: "Maintenance", // Default value
            position: "Staff Member", // Default value
            isActive: true,
            shifts: [],
            assignedRooms: [],
            assignedTasks: [],
            qualifications: [],
            performanceReviews: [],
          };
          break;
        case "manager":
          DiscriminatorModel = Manager;
          ProfileModel = ManagerProfile;
          profileField = "managerProfile";
          profileData = {
            userId: user._id,
            departments: ["HR"], // Default value
            employees: [],
            reports: [],
            permissions: {
              canApproveLeave: false,
              canAuthorizePayments: false,
              canManageInventory: false,
              canOverridePricing: false,
              canViewFinancials: false,
            },
            loginHistory: [],
          };
          break;
        case "admin":
          DiscriminatorModel = Admin;
          ProfileModel = AdminProfile;
          profileField = "adminProfile";
          profileData = {
            userId: user._id,
            accessLevel: "Limited", // Default value
            permissions: [
              { module: "users", actions: ["create", "read", "update"] },
              { module: "rooms", actions: ["read", "update", "delete"] },
              { module: "reports", actions: ["read"] },
              { module: "system", actions: ["read", "manage"] },
            ],
            activityLogs: [],
            loginHistory: [],
            twoFactorEnabled: false,
          };
          break;
        default:
          console.warn(`Unknown role for user ${user._id}: ${user.role}`);
          continue;
      }

      const discriminatorUser = await DiscriminatorModel.findById(user._id);
      if (!discriminatorUser[profileField]) {
        let profile = await ProfileModel.findOne({ userId: user._id });

        if (!profile) {
          // Special handling for admin permissions conversion
          if (user.role === "admin") {
            const existingProfile = await AdminProfile.findOne({
              userId: user._id,
            });
            if (existingProfile) {
              if (Array.isArray(existingProfile.permissions)) {
                profileData.permissions = existingProfile.permissions
                  .map((perm) => {
                    if (typeof perm === "string") {
                      const parts = perm.split("-");
                      const action = parts[0] || "read";
                      const module = parts[1] || "system";
                      return { module, actions: [action] };
                    }
                    // If it's already an object, return it as-is
                    return perm;
                  })
                  .filter(Boolean); // Filter out any invalid entries
              }

              // Preserve other existing profile data
              profileData.accessLevel =
                existingProfile.accessLevel || profileData.accessLevel;
              profileData.activityLogs =
                existingProfile.activityLogs || profileData.activityLogs;
              profileData.twoFactorEnabled =
                existingProfile.twoFactorEnabled ||
                profileData.twoFactorEnabled;
            }
          }

          profile = await ProfileModel.create(profileData);
        }

        await DiscriminatorModel.findOneAndUpdate(
          { _id: user._id },
          { $set: { [profileField]: profile._id } },
          { new: true, versionKey: false }
        );
        console.log(
          `Created/linked profile for user ${user._id} (${user.role})`
        );
      }
    }

    // Fix existing admin profiles with incorrect permissions format
    const adminProfiles = await AdminProfile.find({
      $or: [
        { "permissions.0": { $type: "string" } },
        { permissions: { $exists: false } },
        { permissions: null },
      ],
    });

    for (const profile of adminProfiles) {
      let newPermissions = [];

      if (Array.isArray(profile.permissions)) {
        newPermissions = profile.permissions
          .map((perm) => {
            if (typeof perm === "string") {
              const parts = perm.split("-");
              const action = parts[0] || "read";
              const module = parts[1] || "system";
              return { module, actions: [action] };
            }
            return perm;
          })
          .filter(Boolean); // Filter out any invalid entries
      }

      // If we still have no valid permissions, set default permissions
      if (newPermissions.length === 0) {
        newPermissions = [
          { module: "users", actions: ["read"] },
          { module: "system", actions: ["read"] },
        ];
      }

      await AdminProfile.findOneAndUpdate(
        { _id: profile._id },
        {
          $set: {
            permissions: newPermissions,
            accessLevel: profile.accessLevel || "Limited",
          },
        },
        { new: true }
      );
      console.log(`Fixed permissions for AdminProfile ${profile._id}`);
    }

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

migrateUsers();
