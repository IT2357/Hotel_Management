import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { ManagerLayout } from "@/components/manager";
import { Button } from "@/components/manager/ManagerButton";
import { ManagerBadge } from "@/components/manager/ManagerBadge";
import { ManagerSeparator } from "@/components/manager/ManagerSeparator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/manager/ManagerAvatar";
import { toast } from "sonner";
import { fetchManagerProfile, updateManagerProfile } from "@/services/managerService";
import { MANAGER_CONTENT_CLASS, MANAGER_PAGE_CONTAINER_CLASS, MANAGER_SECTION_CLASS, MANAGER_CARD_SURFACE_CLASS } from "./managerStyles";
import { 
  User, Mail, Phone, Building2, Briefcase, Shield, 
  Award, Clock, TrendingUp, Settings, Download, 
  Edit3, CheckCircle2, Bell, Key, FileText 
} from "lucide-react";

const detailRows = [
  { key: "email", label: "Email", icon: Mail },
  { key: "phone", label: "Phone", icon: Phone },
  { key: "department", label: "Department", icon: Briefcase },
  { key: "role", label: "Role", icon: Shield },
  { key: "hotel", label: "Hotel", icon: Building2 },
];

const permissions = [
  { id: 1, name: "Manage Staff", granted: true },
  { id: 2, name: "Assign Tasks", granted: true },
  { id: 3, name: "View Reports", granted: true },
  { id: 4, name: "Approve Bookings", granted: true },
  { id: 5, name: "Manage Inventory", granted: false },
  { id: 6, name: "Financial Access", granted: false },
];

const quickActions = [
  { id: 1, label: "Create Task", icon: FileText, color: "blue" },
  { id: 2, label: "View Reports", icon: TrendingUp, color: "purple" },
  { id: 3, label: "Manage Staff", icon: User, color: "emerald" },
  { id: 4, label: "Settings", icon: Settings, color: "orange" },
];

/**
 * Manager Profile Page Component
 * 
 * Fetches and displays manager profile data from MongoDB backend.
 * 
 * Expected backend response structure:
 * {
 *   profile: {
 *     name: string,
 *     email: string,
 *     phone: string,
 *     role: string,
 *     department: string,
 *     hotel: string,
 *     avatarUrl: string (optional),
 *     initials: string (optional)
 *   },
 *   stats: {
 *     tasksCompleted: number,
 *     onTimeRate: string (e.g., "95%"),
 *     satisfaction: string (e.g., "4.8/5"),
 *     notifications: number
 *   },
 *   activity: [
 *     {
 *       id: string,
 *       title: string,
 *       timestamp: string,
 *       meta: string (optional)
 *     }
 *   ]
 * }
 * 
 * Falls back to user auth data if MongoDB profile is not available.
 */
const ManagerProfilePage = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    email: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    notes: ''
  });

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
        avatarUrl: user?.avatar || user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fallbackName)}`,
        initials,
        role: user?.role === "manager" ? "Hotel Manager" : (user?.role || "Manager"),
        department: user?.department || "Operations",
        phone: user?.phone || user?.phoneNumber || "Not provided",
        email: user?.email || "Not provided",
        hotel: user?.hotel || user?.hotelName || "Royal Palm Hotel",
        stats: { 
          tasksCompleted: 0, 
          onTimeRate: "0%", 
          satisfaction: "N/A" 
        },
      };
    }

    // Use backend data when available, with fallbacks
    const backendProfile = profileData.profile;
    const backendStats = profileData.stats || {};

    return {
      name: backendProfile.name || fallbackName,
      avatarUrl: backendProfile.avatarUrl || backendProfile.avatar || user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(backendProfile.name || fallbackName)}`,
      initials: backendProfile.initials || initials,
      role: backendProfile.role || user?.role || "Hotel Manager",
      department: backendProfile.department || user?.department || "Operations",
      phone: backendProfile.phone || backendProfile.phoneNumber || user?.phone || "Not provided",
      email: backendProfile.email || user?.email || "Not provided",
      hotel: backendProfile.hotel || backendProfile.hotelName || user?.hotel || "Royal Palm Hotel",
      stats: {
        tasksCompleted: backendStats.tasksCompleted ?? backendStats.completedTasks ?? 0,
        onTimeRate: backendStats.onTimeRate ?? backendStats.onTimeDelivery ?? "0%",
        satisfaction: backendStats.satisfaction ?? backendStats.satisfactionScore ?? "N/A",
        notifications: backendStats.notifications ?? backendStats.activeNotifications ?? 0,
      },
    };
  }, [profileData, user]);

  const activityTimeline = useMemo(() => profileData?.activity ?? [], [profileData]);

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("🔄 Fetching manager profile from backend...");
      console.log("📍 API Endpoint: /api/manager/profile/overview");
      console.log("🔑 Token:", localStorage.getItem('token') ? 'Present' : 'Missing');
      
      const response = await fetchManagerProfile();
      
      // Handle different response structures from backend
      const payload = response?.data?.data || response?.data || response;
      
      console.log("✅ Manager Profile Response from MongoDB:", payload);
      console.log("📊 Stats:", payload?.stats);
      console.log("👤 Profile:", payload?.profile);
      console.log("📝 Activity:", payload?.activity);
      
      if (!payload || !payload.profile) {
        console.warn("⚠️ No profile data in response, using fallback data");
        console.warn("Response structure:", response);
        toast.info("Using default profile", {
          description: "No manager profile found in MongoDB. Displaying user data.",
          duration: 3000,
        });
        setProfileData(null); // Will trigger fallback in useMemo
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
      console.error("Error details:", {
        message: error.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
      });
      
      // More detailed error messages
      let errorDescription = "Using fallback data";
      if (error?.response?.status === 401) {
        errorDescription = "Authentication failed. Please login again.";
        console.error("🔒 Unauthorized: Token may be invalid or expired");
      } else if (error?.response?.status === 403) {
        errorDescription = "Access denied. User must be a manager role.";
        console.error("🚫 Forbidden: User is not authorized as manager");
      } else if (error?.response?.status === 404) {
        errorDescription = "Backend endpoint not found.";
        console.error("🔍 Not Found: Check if backend server is running");
      } else if (error.message === "Network Error") {
        errorDescription = "Cannot connect to backend. Is the server running?";
        console.error("🌐 Network Error: Backend server may not be running on port 5000");
      }
      
      toast.error("Failed to load profile", {
        description: error?.response?.data?.message || errorDescription,
        duration: 5000,
      });
      setProfileData(null); // Use fallback data on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleMenuItemSelect = useCallback((item) => {
    if (item.id === "profile") {
      toast.success("You're already on your profile", {
        duration: 1500,
      });
      return false;
    }

    if (item.id === "dashboard" || item.id === "tasks" || item.id === "staff" || item.id === "feedback" || item.id === "reports") {
      return undefined;
    }

    toast.info(`${item.label} is coming soon`, {
      description: "We're polishing the manager experience",
      duration: 1800,
    });

    return false;
  }, []);

  const handleEditProfile = useCallback(() => {
    // Populate form with current data
    setEditFormData({
      name: profile.name || '',
      phone: profile.phone || '',
      email: profile.email || '',
      emergencyContactName: profile.emergencyContact?.name || '',
      emergencyContactRelationship: profile.emergencyContact?.relationship || '',
      emergencyContactPhone: profile.emergencyContact?.phone || '',
      notes: profileData?.notes || ''
    });
    setIsEditModalOpen(true);
  }, [profile, profileData]);

  const handleCancelEdit = useCallback(() => {
    setIsEditModalOpen(false);
    // Reset form data to prevent showing stale data next time
    setEditFormData({
      name: '',
      phone: '',
      email: '',
      emergencyContactName: '',
      emergencyContactRelationship: '',
      emergencyContactPhone: '',
      notes: ''
    });
  }, []);

  const handleSaveProfile = useCallback(async () => {
    try {
      setIsSaving(true);
      
      // Basic validation
      if (!editFormData.name || editFormData.name.trim().length < 2) {
        toast.error('Validation Error', {
          description: 'Name must be at least 2 characters',
          duration: 3000,
        });
        setIsSaving(false);
        return;
      }
      
      // Email validation removed - email field is now read-only
      
      console.log('💾 Saving profile updates...');
      console.log('Form data:', editFormData);
      
      const payload = {
        profile: {
          name: editFormData.name.trim(),
          phone: editFormData.phone.trim()
          // Email is intentionally excluded - cannot be changed
        },
        emergencyContact: {
          name: editFormData.emergencyContactName.trim(),
          relationship: editFormData.emergencyContactRelationship.trim(),
          phone: editFormData.emergencyContactPhone.trim()
        },
        notes: editFormData.notes.trim()
      };
      
      console.log('📤 Sending payload:', JSON.stringify(payload, null, 2));
      console.log('🔗 API endpoint: PUT /api/manager/profile/update');

      const response = await updateManagerProfile(payload);
      console.log('📥 Raw response:', response);
      
      console.log('✅ Update response:', response);
      
      if (response.success || response.data) {
        toast.success('Profile updated successfully! 🎉', {
          description: 'Your changes have been saved to MongoDB',
          duration: 3000,
        });
        
        // Refresh profile data to show updates
        console.log('🔄 Refreshing profile data...');
        await loadProfile();
        
        // Close modal and reset form
        handleCancelEdit();
      } else {
        toast.error('Update failed', {
          description: 'Server returned an unexpected response',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      console.error('Error details:', {
        message: error.message,
        status: error?.response?.status,
        data: error?.response?.data
      });
      
      toast.error('Failed to update profile', {
        description: error?.response?.data?.message || error.message || 'Please try again',
        duration: 4000,
      });
    } finally {
      setIsSaving(false);
    }
  }, [editFormData, loadProfile, handleCancelEdit]);

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
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-300/40 via-cyan-200/30 to-transparent rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-br from-purple-300/30 via-pink-200/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-gradient-to-br from-rose-200/20 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        
        {/* Floating particles */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-violet-400/40 rounded-full animate-ping" />
        <div className="absolute top-40 right-32 w-2 h-2 bg-blue-400/40 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-32 left-40 w-2 h-2 bg-purple-400/40 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 right-20 w-2 h-2 bg-pink-400/40 rounded-full animate-ping" style={{ animationDelay: '1.5s' }} />
        {/* Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 p-8 shadow-2xl border-2 border-violet-200/50 backdrop-blur-sm before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-1000"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-fuchsia-500/5 to-blue-500/5" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-violet-200/40 via-blue-200/40 to-transparent rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-200/30 to-transparent rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" />
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-pink-300/30 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDuration: '3s' }} />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="absolute -inset-3 bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 rounded-full blur-xl opacity-40 group-hover:opacity-60 animate-pulse transition-opacity" style={{ animationDuration: '2s' }} />
                <div className="absolute -inset-1.5 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full blur opacity-50 animate-spin" style={{ animationDuration: '8s' }} />
                <Avatar className="relative h-28 w-28 border-4 border-white shadow-2xl ring-4 ring-violet-300/50">
                  <AvatarImage src={profile.avatarUrl} />
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 text-2xl font-bold text-white">
                    {profile.initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-violet-900 to-purple-900 bg-clip-text text-transparent drop-shadow-sm">{profile.name}</h1>
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-400 rounded-full blur-md opacity-50 animate-pulse" />
                    <CheckCircle2 className="relative h-7 w-7 text-emerald-500 drop-shadow-lg" />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <ManagerBadge className="border-violet-300 bg-gradient-to-r from-violet-100 via-purple-100 to-fuchsia-100 text-violet-700 font-bold shadow-md">
                    {profile.role}
                  </ManagerBadge>
                  <span className="text-violet-400 text-lg font-bold">•</span>
                  <p className="text-gray-700 font-bold">{profile.department}</p>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <div className="rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 p-1.5 shadow-sm">
                    <Building2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="font-semibold text-gray-700">{profile.hotel}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleEditProfile} className="gap-2 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-2xl hover:shadow-violet-500/50 hover:scale-105 transition-all duration-300 border-0 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <Edit3 className="h-4 w-4 relative z-10" />
                <span className="relative z-10 font-bold">Edit Profile</span>
              </Button>
              <Button variant="outline" className="gap-2 border-2 border-violet-200 bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-violet-50 hover:border-violet-300 hover:scale-105 shadow-lg hover:shadow-xl transition-all duration-300">
                <Download className="h-4 w-4" />
                <span className="font-bold">Export Data</span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Performance Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 grid gap-5 md:grid-cols-4"
        >
          <motion.div 
            whileHover={{ scale: 1.05, y: -8 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="group rounded-2xl bg-gradient-to-br from-white via-blue-50/30 to-blue-100/30 p-6 shadow-xl border-2 border-blue-200/50 hover:border-blue-400/70 hover:shadow-blue-500/30 hover:shadow-2xl transition-all backdrop-blur-sm relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-300/30 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 p-3.5 shadow-lg group-hover:scale-110 transition-transform">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div className="rounded-full bg-blue-100 p-2 shadow-md">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-cyan-700 bg-clip-text text-transparent">{profile.stats.tasksCompleted}</p>
              <p className="mt-2 text-sm font-bold text-gray-700">Tasks Completed</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05, y: -8 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="group rounded-2xl bg-gradient-to-br from-white via-emerald-50/30 to-emerald-100/30 p-6 shadow-xl border-2 border-emerald-200/50 hover:border-emerald-400/70 hover:shadow-emerald-500/30 hover:shadow-2xl transition-all backdrop-blur-sm relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-300/30 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 p-3.5 shadow-lg group-hover:scale-110 transition-transform">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="rounded-full bg-emerald-100 p-2 shadow-md">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-green-700 bg-clip-text text-transparent">{profile.stats.onTimeRate}</p>
              <p className="mt-2 text-sm font-bold text-gray-700">On-Time Rate</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05, y: -8 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="group rounded-2xl bg-gradient-to-br from-white via-purple-50/30 to-purple-100/30 p-6 shadow-xl border-2 border-purple-200/50 hover:border-purple-400/70 hover:shadow-purple-500/30 hover:shadow-2xl transition-all backdrop-blur-sm relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-fuchsia-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-300/30 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 p-3.5 shadow-lg group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="rounded-full bg-purple-100 p-2 shadow-md">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-fuchsia-700 bg-clip-text text-transparent">{profile.stats.satisfaction}</p>
              <p className="mt-2 text-sm font-bold text-gray-700">Satisfaction Score</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05, y: -8 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="group rounded-2xl bg-gradient-to-br from-white via-amber-50/30 to-orange-100/30 p-6 shadow-xl border-2 border-amber-200/50 hover:border-amber-400/70 hover:shadow-amber-500/30 hover:shadow-2xl transition-all backdrop-blur-sm relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-300/30 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 p-3.5 shadow-lg group-hover:scale-110 transition-transform">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <span className="rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg animate-pulse">NEW</span>
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-amber-700 to-orange-800 bg-clip-text text-transparent">{profile.stats.notifications || 0}</p>
              <p className="mt-2 text-sm font-bold text-gray-700">Active Notifications</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-white p-6 shadow-lg border border-gray-200"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-indigo-100 p-2.5">
                <User className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Contact Information</h2>
            </div>
            <div className="space-y-3">
              {detailRows.map((row) => {
                const Icon = row.icon;
                return (
                  <div
                    key={row.key}
                    className="flex items-center gap-4 rounded-xl bg-gray-50 p-4 transition-all hover:bg-gray-100 hover:shadow-sm"
                  >
                    <div className="rounded-lg bg-white p-2.5 shadow-sm">
                      <Icon className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{row.label}</p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {profile[row.key] || "Not provided"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Permissions & Access */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-white p-6 shadow-lg border border-gray-200"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-100 p-2.5">
                <Key className="h-5 w-5 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Permissions</h2>
            </div>
            <div className="space-y-2.5">
              {permissions.map((permission) => (
                <div
                  key={permission.id}
                  className="flex items-center justify-between rounded-xl bg-gray-50 p-3.5 transition-all hover:bg-gray-100"
                >
                  <span className="text-sm font-medium text-gray-700">{permission.name}</span>
                  {permission.granted ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl bg-white p-6 shadow-lg border border-gray-200"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-cyan-100 p-2.5">
                  <Clock className="h-5 w-5 text-cyan-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
              </div>
              <ManagerBadge className="border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold">
                Live
              </ManagerBadge>
            </div>
            <div className="space-y-3">
              {activityTimeline.length > 0 ? (
                activityTimeline.map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-xl border-l-4 border-indigo-500 bg-gray-50 p-4 transition-all hover:bg-indigo-50 hover:shadow-sm"
                  >
                    <p className="text-sm font-semibold text-gray-900">{activity.title}</p>
                    <p className="mt-1 text-xs text-gray-600">{activity.timestamp}</p>
                    {activity.meta && (
                      <p className="mt-1 text-xs text-gray-500">{activity.meta}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-gray-50 p-10 text-center">
                  <div className="mx-auto w-fit rounded-full bg-gray-100 p-4">
                    <Clock className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-gray-600">No recent activity</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 rounded-2xl bg-white p-6 shadow-lg border border-gray-200"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-purple-100 p-2.5">
              <Settings className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              const colorClasses = {
                blue: "bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300",
                purple: "bg-purple-50 border-purple-200 hover:bg-purple-100 hover:border-purple-300",
                emerald: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300",
                orange: "bg-orange-50 border-orange-200 hover:bg-orange-100 hover:border-orange-300",
              };
              const iconColors = {
                blue: "text-blue-600",
                purple: "text-purple-600",
                emerald: "text-emerald-600",
                orange: "text-orange-600",
              };
              return (
                <button
                  key={action.id}
                  className={`flex items-center gap-4 rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-md border-2 ${colorClasses[action.color]}`}
                  onClick={() => toast.info(`${action.label} clicked`)}
                >
                  <div className="rounded-lg bg-white p-3 shadow-sm">
                    <Icon className={`h-5 w-5 ${iconColors[action.color]}`} />
                  </div>
                  <span className="font-semibold text-gray-900">{action.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Edit Profile Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
            >
              <div className="sticky top-0 z-10 bg-gradient-to-r from-violet-600 to-purple-600 p-6 rounded-t-2xl">
                <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
                <p className="text-violet-100 mt-1">Update your profile information</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User className="h-5 w-5 text-violet-600" />
                    Basic Information
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                        placeholder="+94 11 234 5678"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={editFormData.email}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-600"
                      placeholder="your.email@example.com"
                      title="Email cannot be changed as it's used for authentication"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed (used for login)</p>
                  </div>
                </div>

                <ManagerSeparator />

                {/* Emergency Contact */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-violet-600" />
                    Emergency Contact
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
                      <input
                        type="text"
                        value={editFormData.emergencyContactName}
                        onChange={(e) => setEditFormData({ ...editFormData, emergencyContactName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                        placeholder="Contact name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                      <input
                        type="text"
                        value={editFormData.emergencyContactRelationship}
                        onChange={(e) => setEditFormData({ ...editFormData, emergencyContactRelationship: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                        placeholder="e.g., Manager, Supervisor"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                    <input
                      type="tel"
                      value={editFormData.emergencyContactPhone}
                      onChange={(e) => setEditFormData({ ...editFormData, emergencyContactPhone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                      placeholder="+94 77 456 1122"
                    />
                  </div>
                </div>

                <ManagerSeparator />

                {/* Notes */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-violet-600" />
                    Notes
                  </h3>
                  <textarea
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
                    placeholder="Add any additional notes or information..."
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl flex gap-3 justify-end border-t">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="border-gray-300 hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </ManagerLayout>
  );
};

export default ManagerProfilePage;
