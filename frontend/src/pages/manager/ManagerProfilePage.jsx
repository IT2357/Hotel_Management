import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { ManagerLayout } from "@/components/manager";
import { Button } from "@/components/manager/ManagerButton";
import { ManagerBadge } from "@/components/manager/ManagerBadge";
import { ManagerSeparator } from "@/components/manager/ManagerSeparator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/manager/ManagerAvatar";
import { toast } from "sonner";
import { fetchManagerProfile } from "@/services/managerService";
import { MANAGER_CONTENT_CLASS, MANAGER_PAGE_CONTAINER_CLASS, MANAGER_SECTION_CLASS, MANAGER_CARD_SURFACE_CLASS } from "./managerStyles";

const detailRows = [
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "department", label: "Department" },
  { key: "role", label: "Role" },
  { key: "hotel", label: "Hotel" },
];

const ManagerProfilePage = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const profile = useMemo(() => {
    const fallbackName =
      user?.fullName ||
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      user?.name ||
      user?.email ||
      "Manager";

    if (!profileData) {
      const initials = fallbackName
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase())
        .join("")
        .slice(0, 2) || "MG";

      return {
        name: fallbackName,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fallbackName)}`,
        initials,
        role: "Hotel Manager",
        department: "Operations",
        phone: user?.phone || "N/A",
        email: user?.email || "manager@example.com",
        hotel: "Royal Palm Hotel",
        stats: { tasksCompleted: 0, onTimeRate: "-", satisfaction: "-" },
      };
    }

    return {
      name: profileData.profile.name,
      avatarUrl: profileData.profile.avatarUrl,
      initials: profileData.profile.initials,
      role: profileData.profile.role,
      department: profileData.profile.department,
      phone: profileData.profile.phone,
      email: profileData.profile.email,
      hotel: profileData.profile.hotel,
      stats: profileData.stats,
    };
  }, [profileData, user]);

  const activityTimeline = useMemo(() => profileData?.activity ?? [], [profileData]);

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchManagerProfile();
      const payload = response?.data || response;
      if (!payload?.profile) {
        toast.info("No manager profile in database yet", {
          description: "Using sample metrics until data is added to MongoDB.",
        });
      } else {
        setProfileData(payload);
      }
    } catch (error) {
      console.error("Failed to load manager profile", error);
      toast.error("Unable to load manager profile", {
        description: error?.response?.data?.message || error.message,
      });
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

  return (
    <ManagerLayout
      activeItem="profile"
      onMenuItemSelect={handleMenuItemSelect}
      contentClassName={MANAGER_CONTENT_CLASS}
    >
      <div className={`${MANAGER_PAGE_CONTAINER_CLASS} space-y-6`}>
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`${MANAGER_SECTION_CLASS} relative`}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-amber-300 shadow-[0_0_0_6px_rgba(251,191,36,0.18)] bg-white/[0.03]">
                <AvatarImage src={profile.avatarUrl} />
                <AvatarFallback>{profile.initials}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-white">{profile.name}</h1>
                  <ManagerBadge className="border-amber-300/40 bg-amber-400/10 text-amber-200">
                    {profile.role}
                  </ManagerBadge>
                </div>
                <p className="text-sm text-white/70">{profile.department} • {profile.hotel}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button className="rounded-full bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 text-slate-900 shadow-[0_20px_50px_rgba(251,191,36,0.28)]">Edit Profile</Button>
              <Button variant="outline" className="rounded-full border border-white/20 bg-white/[0.08] text-white backdrop-blur-lg">Download Report</Button>
            </div>
          </div>
          <ManagerSeparator className="my-6 bg-white/8" />

          <div className={`grid gap-4 md:grid-cols-3 ${isLoading ? "animate-pulse" : ""}`}>
            <motion.div
              whileHover={{ translateY: -4 }}
              className={`${MANAGER_CARD_SURFACE_CLASS} p-4 text-white`}
            >
              <p className="text-sm text-white/65">Tasks Completed</p>
              <p className="mt-2 text-3xl font-semibold text-white">{profile.stats.tasksCompleted}</p>
            </motion.div>
            <motion.div
              whileHover={{ translateY: -4 }}
              className={`${MANAGER_CARD_SURFACE_CLASS} p-4 text-white`}
            >
              <p className="text-sm text-white/65">On-time Completion</p>
              <p className="mt-2 text-3xl font-semibold text-amber-200">{profile.stats.onTimeRate}</p>
            </motion.div>
            <motion.div
              whileHover={{ translateY: -4 }}
              className={`${MANAGER_CARD_SURFACE_CLASS} p-4 text-white`}
            >
              <p className="text-sm text-white/65">Guest Satisfaction</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-200">{profile.stats.satisfaction}</p>
            </motion.div>
          </div>
        </motion.section>

        <div className="grid gap-6 lg:grid-cols-12">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`${MANAGER_SECTION_CLASS} space-y-4 lg:col-span-7`}
          >
            <div>
              <h2 className="text-xl font-semibold text-white">Professional Details</h2>
              <p className="text-sm text-white/70">Synchronized with your manager profile in MongoDB.</p>
            </div>

            <div className={`space-y-4 ${isLoading ? "animate-pulse" : ""}`}>
              {detailRows.map((row) => (
                <div
                  key={row.key}
                  className={`${MANAGER_CARD_SURFACE_CLASS} flex flex-col gap-1 p-4 text-white md:flex-row md:items-center md:justify-between`}
                >
                  <span className="text-sm text-white/65">{row.label}</span>
                  <span className="text-sm font-medium text-white">
                    {profile[row.key] || "Not provided"}
                  </span>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={`${MANAGER_SECTION_CLASS} space-y-4 lg:col-span-5`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
                <p className="text-sm text-white/70">Latest actions recorded for your account.</p>
              </div>
              <ManagerBadge className="border-white/15 bg-white/[0.08] text-white/70">Live sync</ManagerBadge>
            </div>

            <div className={`space-y-3 ${isLoading ? "animate-pulse" : ""}`}>
              {activityTimeline.map((activity) => (
                <motion.div
                  key={activity.id}
                  whileHover={{ translateY: isLoading ? 0 : -3 }}
                  className={`${MANAGER_CARD_SURFACE_CLASS} p-4 text-white`}
                >
                  <p className="text-sm font-semibold text-white">{activity.title}</p>
                  <p className="text-xs text-white/65">{activity.timestamp}</p>
                  <p className="text-xs text-white/55">{activity.meta}</p>
                </motion.div>
              ))}
              {!activityTimeline.length && !isLoading && (
                <div className={`${MANAGER_CARD_SURFACE_CLASS} p-4 text-white/70`}>
                  No activity logged for your account yet.
                </div>
              )}
            </div>
          </motion.section>
        </div>
      </div>
    </ManagerLayout>
  );
};

export default ManagerProfilePage;
