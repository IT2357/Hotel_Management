import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { ManagerNavbar } from "@/components/manager/ManagerNavbar";
import { Sidebar } from "@/components/manager/Sidebar";
import { Button } from "@/components/manager/ManagerButton";
import { ManagerBadge } from "@/components/manager/ManagerBadge";
import { ManagerSeparator } from "@/components/manager/ManagerSeparator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/manager/ManagerAvatar";
import { toast } from "sonner";

const detailRows = [
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "department", label: "Department" },
  { key: "role", label: "Role" },
  { key: "hotel", label: "Hotel" },
];

const activityTimeline = [
  { id: 1, title: "Approved VIP room upgrade", timestamp: "Today, 2:30 PM", meta: "Reservation #RM-482" },
  { id: 2, title: "Reviewed task backlog", timestamp: "Today, 11:10 AM", meta: "12 tasks delegated" },
  { id: 3, title: "Checked revenue performance", timestamp: "Today, 9:00 AM", meta: "Occupancy at 92%" },
];

const ManagerProfilePage = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("profile");
  const { user } = useAuth();

  const profile = useMemo(() => {
    const fullName =
      user?.fullName ||
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      user?.name ||
      user?.email ||
      "Manager";

    const avatarUrl =
      user?.profile?.avatar ||
      user?.avatarUrl ||
      user?.photo ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`;

    const initials = fullName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase())
      .join("")
      .slice(0, 2) || "MG";

    return {
      name: fullName,
      avatarUrl,
      initials,
      role: user?.profile?.jobTitle || user?.designation || user?.role || "Hotel Manager",
      department: user?.profile?.department || "Operations",
      phone: user?.profile?.phone || user?.phone || "N/A",
      email: user?.email || "manager@example.com",
      hotel: user?.profile?.hotel || "Valdor Hotel",
      stats: {
        tasksCompleted: user?.profile?.metrics?.tasksCompleted || 128,
        onTimeRate: user?.profile?.metrics?.onTimeRate || "94%",
        satisfaction: user?.profile?.metrics?.satisfaction || "4.8 / 5",
      },
    };
  }, [user]);

  const handleToggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  const handleMenuItemClick = (item) => {
    setActiveMenuItem(item.id);

    if (item.id === "profile") {
      toast.success("You're already on your profile", {
        duration: 1500,
      });
      return;
    }

    toast.info(`${item.label} is coming soon`, {
      description: "We're polishing the manager experience",
      duration: 1800,
    });
  };

  return (
    <div className="min-h-screen navy-gradient">
      <ManagerNavbar onToggleSidebar={handleToggleSidebar} />

      <div className="mt-[88px] flex w-full">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={handleToggleSidebar}
          activeItem={activeMenuItem}
          onItemClick={handleMenuItemClick}
        />

        <main className="flex-1 space-y-6 overflow-y-auto p-6">
          <motion.section
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-3xl border border-[#1b335f] bg-gradient-to-b from-[#14284d] via-[#112244] to-[#0b1c36] p-6 shadow-[0_22px_50px_rgba(8,14,29,0.6)]"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-2 border-[#facc15] shadow-[0_0_0_4px_rgba(250,204,21,0.25)]">
                  <AvatarImage src={profile.avatarUrl} />
                  <AvatarFallback>{profile.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-[#f5f7ff]">{profile.name}</h1>
                    <ManagerBadge className="border-[#facc15]/50 bg-[#2a230d] text-[#facc15]">
                      {profile.role}
                    </ManagerBadge>
                  </div>
                  <p className="text-sm text-[#8ba3d0]">{profile.department} • {profile.hotel}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button className="rounded-full bg-[#facc15] text-[#0b1b3c] hover:bg-[#f9c513]">Edit Profile</Button>
                <Button variant="outline" className="rounded-full border border-[#1b335f] bg-[#0f1f3d] text-[#d6e2ff] hover:bg-[#132b52]">
                  Download Report
                </Button>
              </div>
            </div>

            <ManagerSeparator className="my-6 bg-[#1b335f]" />

            <div className="grid gap-4 md:grid-cols-3">
              <motion.div
                whileHover={{ translateY: -4 }}
                className="rounded-2xl border border-[#1b335f] bg-[#10213f] p-4 text-[#d6e2ff] shadow-[0_16px_36px_rgba(8,14,29,0.45)]"
              >
                <p className="text-sm text-[#8ba3d0]">Tasks Completed</p>
                <p className="mt-2 text-3xl font-semibold text-[#f5f7ff]">{profile.stats.tasksCompleted}</p>
              </motion.div>
              <motion.div
                whileHover={{ translateY: -4 }}
                className="rounded-2xl border border-[#1b335f] bg-[#10213f] p-4 text-[#d6e2ff] shadow-[0_16px_36px_rgba(8,14,29,0.45)]"
              >
                <p className="text-sm text-[#8ba3d0]">On-time Completion</p>
                <p className="mt-2 text-3xl font-semibold text-[#facc15]">{profile.stats.onTimeRate}</p>
              </motion.div>
              <motion.div
                whileHover={{ translateY: -4 }}
                className="rounded-2xl border border-[#1b335f] bg-[#10213f] p-4 text-[#d6e2ff] shadow-[0_16px_36px_rgba(8,14,29,0.45)]"
              >
                <p className="text-sm text-[#8ba3d0]">Guest Satisfaction</p>
                <p className="mt-2 text-3xl font-semibold text-[#34d399]">{profile.stats.satisfaction}</p>
              </motion.div>
            </div>
          </motion.section>

          <div className="grid gap-6 lg:grid-cols-12">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-7 space-y-4 rounded-3xl border border-[#1b335f] bg-[#0f1f3d] p-6 text-[#d6e2ff] shadow-[0_18px_46px_rgba(8,14,29,0.6)]"
            >
              <div>
                <h2 className="text-xl font-semibold text-[#f5f7ff]">Professional Details</h2>
                <p className="text-sm text-[#8ba3d0]">Synchronized with your manager profile in MongoDB.</p>
              </div>

              <div className="space-y-4">
                {detailRows.map((row) => (
                  <div key={row.key} className="flex flex-col gap-1 rounded-2xl border border-[#1b335f] bg-[#10213f] p-4 md:flex-row md:items-center md:justify-between">
                    <span className="text-sm text-[#8ba3d0]">{row.label}</span>
                    <span className="text-sm font-medium text-[#f5f7ff]">
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
              className="lg:col-span-5 space-y-4 rounded-3xl border border-[#1b335f] bg-[#0f1f3d] p-6 text-[#d6e2ff] shadow-[0_18px_46px_rgba(8,14,29,0.6)]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[#f5f7ff]">Recent Activity</h2>
                  <p className="text-sm text-[#8ba3d0]">Latest actions recorded for your account.</p>
                </div>
                <ManagerBadge className="border-[#1b335f] bg-[#102a46] text-[#8ba3d0]">Live sync</ManagerBadge>
              </div>

              <div className="space-y-3">
                {activityTimeline.map((activity) => (
                  <motion.div
                    key={activity.id}
                    whileHover={{ translateY: -3 }}
                    className="rounded-2xl border border-[#1b335f] bg-[#10213f] p-4"
                  >
                    <p className="text-sm font-semibold text-[#f5f7ff]">{activity.title}</p>
                    <p className="text-xs text-[#8ba3d0]">{activity.timestamp}</p>
                    <p className="text-xs text-[#637ab1]">{activity.meta}</p>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ManagerProfilePage;
