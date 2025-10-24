import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ManagerLayout } from "@/components/manager";
import { MANAGER_CONTENT_CLASS } from "./managerStyles";
import { useProfileData } from "./profile/useProfileData";
import { ProfileHeader } from "./profile/ProfileHeader";
import { ProfileStats } from "./profile/ProfileStats";
import {
  ContactInfoCard,
  PermissionsCard,
  ActivityCard,
  QuickActionsCard,
} from "./profile/ProfileCards";
import { EditProfileModal } from "./profile/EditProfileModal";

/**
 * Manager Profile Page
 * Displays and manages manager profile information
 * 
 * Note: This is a refactored version split into modular components for better maintainability.
 * Components are in the ./profile/ directory.
 */
const ManagerProfilePage = () => {
  const { profile, activityTimeline, isLoading, updateProfile, profileData } = useProfileData();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleMenuItemSelect = useCallback((item) => {
    if (item.id === "profile") {
      toast.success("You're already on your profile", {
        duration: 1500,
      });
      return false;
    }

    if (
      item.id === "dashboard" ||
      item.id === "tasks" ||
      item.id === "staff" ||
      item.id === "feedback" ||
      item.id === "reports"
    ) {
      return undefined;
    }

    toast.info(`${item.label} is coming soon`, {
      description: "We're polishing the manager experience",
      duration: 1800,
    });

    return false;
  }, []);

  const handleEditProfile = useCallback(() => {
    setIsEditModalOpen(true);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setIsEditModalOpen(false);
  }, []);

  const handleSaveProfile = useCallback(
    async (formData) => {
      const success = await updateProfile(formData);
      return success;
    },
    [updateProfile]
  );

  // Loading state
  if (isLoading) {
    return (
      <ManagerLayout
        activeItem="profile"
        onMenuItemSelect={handleMenuItemSelect}
        contentClassName={MANAGER_CONTENT_CLASS}
      >
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 border-4 border-violet-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-violet-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-lg font-semibold text-gray-700">Loading Profile...</p>
            <p className="text-sm text-gray-500 mt-1">Fetching data from MongoDB</p>
          </div>
        </div>
      </ManagerLayout>
    );
  }

  return (
    <ManagerLayout
      activeItem="profile"
      onMenuItemSelect={handleMenuItemSelect}
      contentClassName={MANAGER_CONTENT_CLASS}
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 relative overflow-hidden">
        {/* Animated Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-violet-300/40 via-fuchsia-200/30 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        <div
          className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-300/40 via-cyan-200/30 to-transparent rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-br from-purple-300/30 via-pink-200/20 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/4 right-1/4 w-48 h-48 bg-gradient-to-br from-rose-200/20 to-transparent rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "1.5s" }}
        />

        {/* Floating particles */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-violet-400/40 rounded-full animate-ping" />
        <div
          className="absolute top-40 right-32 w-2 h-2 bg-blue-400/40 rounded-full animate-ping"
          style={{ animationDelay: "0.5s" }}
        />
        <div
          className="absolute bottom-32 left-40 w-2 h-2 bg-purple-400/40 rounded-full animate-ping"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-20 right-20 w-2 h-2 bg-pink-400/40 rounded-full animate-ping"
          style={{ animationDelay: "1.5s" }}
        />

        {/* Profile Header */}
        <ProfileHeader profile={profile} onEditProfile={handleEditProfile} />

        {/* Performance Stats */}
        <ProfileStats stats={profile.stats} />

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          <ContactInfoCard profile={profile} />
          <PermissionsCard />
          <ActivityCard activityTimeline={activityTimeline} />
        </div>

        {/* Quick Actions */}
        <QuickActionsCard />

        {/* Edit Profile Modal */}
        {isEditModalOpen && (
          <EditProfileModal
            profile={profile}
            profileData={profileData}
            onClose={handleCloseEdit}
            onSave={handleSaveProfile}
          />
        )}
      </div>
    </ManagerLayout>
  );
};

export default ManagerProfilePage;
