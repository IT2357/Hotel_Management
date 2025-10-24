/**
 * Custom Hook: useProfileData
 * Manages profile data fetching and transformation
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import useAuth from "@/hooks/useAuth";
import { fetchManagerProfile, updateManagerProfile } from "@/services/managerService";

export const useProfileData = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const profile = useMemo(() => {
    // Get name from various sources
    const fallbackName =
      user?.fullName ||
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      user?.name ||
      user?.email?.split("@")[0] ||
      "Manager";

    // Generate initials
    const initials = fallbackName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase())
      .join("")
      .slice(0, 2) || "MG";

    // If no backend data, use user auth data as fallback
    if (!profileData || !profileData.profile) {
      return {
        name: fallbackName,
        avatarUrl:
          user?.avatar ||
          user?.profilePicture ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fallbackName)}`,
        initials,
        role: user?.role === "manager" ? "Hotel Manager" : user?.role || "Manager",
        department: user?.department || "Operations",
        phone: user?.phone || user?.phoneNumber || "Not provided",
        email: user?.email || "Not provided",
        hotel: user?.hotel || user?.hotelName || "Royal Palm Hotel",
        stats: {
          tasksCompleted: 0,
          onTimeRate: "0%",
          satisfaction: "N/A",
        },
      };
    }

    // Use backend data when available, with fallbacks
    const backendProfile = profileData.profile;
    const backendStats = profileData.stats || {};

    return {
      name: backendProfile.name || fallbackName,
      avatarUrl:
        backendProfile.avatarUrl ||
        backendProfile.avatar ||
        user?.avatar ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
          backendProfile.name || fallbackName
        )}`,
      initials: backendProfile.initials || initials,
      role: backendProfile.role || user?.role || "Hotel Manager",
      department: backendProfile.department || user?.department || "Operations",
      phone:
        backendProfile.phone ||
        backendProfile.phoneNumber ||
        user?.phone ||
        "Not provided",
      email: backendProfile.email || user?.email || "Not provided",
      hotel:
        backendProfile.hotel ||
        backendProfile.hotelName ||
        user?.hotel ||
        "Royal Palm Hotel",
      stats: {
        tasksCompleted:
          backendStats.tasksCompleted ?? backendStats.completedTasks ?? 0,
        onTimeRate: backendStats.onTimeRate ?? backendStats.onTimeDelivery ?? "0%",
        satisfaction:
          backendStats.satisfaction ?? backendStats.satisfactionScore ?? "N/A",
        notifications:
          backendStats.notifications ?? backendStats.activeNotifications ?? 0,
      },
    };
  }, [profileData, user]);

  const activityTimeline = useMemo(() => profileData?.activity ?? [], [profileData]);

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("🔄 Fetching manager profile from backend...");

      const response = await fetchManagerProfile();
      const payload = response?.data?.data || response?.data || response;

      console.log("✅ Manager Profile Response from MongoDB:", payload);

      if (!payload || !payload.profile) {
        console.warn("⚠️ No profile data in response, using fallback data");
        toast.info("Using default profile", {
          description: "No manager profile found in MongoDB. Displaying user data.",
          duration: 3000,
        });
        setProfileData(null);
      } else {
        console.log("✅ Successfully loaded profile from MongoDB");
        setProfileData(payload);
        toast.success("Profile loaded successfully", {
          description: "Data fetched from MongoDB",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error("❌ Error loading manager profile:", error);

      let errorDescription = "Using fallback data";
      if (error?.response?.status === 401) {
        errorDescription = "Authentication failed. Please login again.";
      } else if (error?.response?.status === 403) {
        errorDescription = "Access denied. User must be a manager role.";
      } else if (error?.response?.status === 404) {
        errorDescription = "Backend endpoint not found.";
      } else if (error.message === "Network Error") {
        errorDescription = "Cannot connect to backend. Is the server running?";
      }

      toast.error("Failed to load profile", {
        description: error?.response?.data?.message || errorDescription,
        duration: 5000,
      });
      setProfileData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const updateProfile = useCallback(
    async (formData) => {
      const payload = {
        profile: {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
        },
        emergencyContact: {
          name: formData.emergencyContactName.trim(),
          relationship: formData.emergencyContactRelationship.trim(),
          phone: formData.emergencyContactPhone.trim(),
        },
        notes: formData.notes.trim(),
      };

      console.log("💾 Saving profile updates...");
      console.log("📤 Sending payload:", JSON.stringify(payload, null, 2));

      const response = await updateManagerProfile(payload);
      console.log("✅ Update response:", response);

      if (response.success || response.data) {
        toast.success("Profile updated successfully! 🎉", {
          description: "Your changes have been saved to MongoDB",
          duration: 3000,
        });

        // Refresh profile data
        await loadProfile();
        return true;
      } else {
        toast.error("Update failed", {
          description: "Server returned an unexpected response",
          duration: 3000,
        });
        return false;
      }
    },
    [loadProfile]
  );

  return {
    profile,
    activityTimeline,
    isLoading,
    loadProfile,
    updateProfile,
    profileData,
  };
};
