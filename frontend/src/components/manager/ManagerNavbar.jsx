import { motion } from "framer-motion";
import { Search, Bell, Moon, Sun, Hotel, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/manager/ManagerButton";
import { ManagerInput } from "@/components/manager/ManagerInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/manager/ManagerAvatar";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "@/hooks/useAuth";

export const ManagerNavbar = ({ onToggleSidebar }) => {
  const [isDark, setIsDark] = useState(true);
  const [notifications] = useState(3);
  const { user, logout } = useAuth();

  const managerProfile = useMemo(() => {
    const fullName =
      user?.fullName ||
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      user?.name ||
      user?.email ||
      "Manager";

    const roleLabel =
      user?.profile?.jobTitle ||
      user?.designation ||
      (typeof user?.role === "string" ? user.role.replace(/_/g, " ") : null) ||
      "Hotel Manager";

    const initials = fullName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase())
      .join("")
      .slice(0, 2) || "MG";

    return { name: fullName, role: roleLabel, initials };
  }, [user]);

  const avatarUrl = useMemo(() => {
    return (
      user?.profile?.avatar ||
      user?.avatarUrl ||
      user?.photo ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(managerProfile.name)}`
    );
  }, [managerProfile.name, user]);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed inset-x-0 top-0 z-50 w-full bg-gradient-to-r from-[#09122a] via-[#0f2349] to-[#07152d] text-[#f5f7ff] shadow-[0_10px_38px_rgba(7,17,40,0.55)]"
    >
      <div className="relative flex items-center justify-between px-6 py-4">
        <div className="pointer-events-none absolute inset-x-12 inset-y-0 rounded-full bg-[#0f2a52]/60 blur-3xl" />
        {/* Left - Logo + Hamburger */}
        <div className="relative z-10 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="rounded-xl border border-transparent text-[#f5f7ff] transition-all duration-300 hover:border-[#1b335f] hover:bg-[#13254a]"
          >
            <Menu className="h-5 w-5 text-[#facc15]" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Hotel className="h-8 w-8 text-[#facc15]" />
              <motion.div
                className="absolute -inset-1 rounded-full bg-[#facc1533] blur-md"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold uppercase tracking-wide text-[#f5f7ff]">Valdor Hotel</h1>
              <p className="text-xs text-[#8ba3d0]">Manager Portal</p>
            </div>
          </div>
        </div>

        {/* Center - Search */}
        <div className="relative z-10 hidden flex-1 items-center md:flex">
          <div className="group relative mx-8 w-full">
            <div className="pointer-events-none absolute inset-0 rounded-full bg-[#0f2d57]/70 blur-xl" />
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8ba3d0]" />
            <ManagerInput
              placeholder="Search tasks, staff, or rooms..."
              className="rounded-full border border-[#1b335f] bg-[#10234f]/95 pl-12 pr-6 text-[#d6e2ff] placeholder:text-[#8ba3d0] shadow-[0_16px_40px_rgba(8,14,29,0.55)] transition-all duration-300 focus:border-[#facc15] focus-visible:ring-0"
            />
          </div>
        </div>

        {/* Right - Actions */}
        <div className="relative z-10 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="relative rounded-xl border border-transparent text-[#f5f7ff] transition-all duration-300 hover:border-[#1b335f] hover:bg-[#13254a]"
          >
            {isDark ? (
              <Sun className="h-5 w-5 text-[#facc15]" />
            ) : (
              <Moon className="h-5 w-5 text-[#facc15]" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-xl border border-transparent text-[#f5f7ff] transition-all duration-300 hover:border-[#1b335f] hover:bg-[#13254a]"
          >
            <Bell className="h-5 w-5 text-[#f5f7ff]" />
            {notifications > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#e11d48] text-xs font-semibold text-white shadow-[0_0_12px_rgba(225,29,72,0.45)]"
              >
                {notifications}
              </motion.span>
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={handleLogout}
            className="hidden items-center gap-2 rounded-xl border border-transparent px-4 py-2 text-[#f5f7ff] transition-all duration-300 hover:border-[#e11d48] hover:bg-[#2b2337] sm:flex"
          >
            <LogOut className="h-5 w-5 text-[#f87171]" />
            <span className="text-sm font-medium">Logout</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="flex rounded-xl border border-transparent text-[#f5f7ff] transition-all duration-300 hover:border-[#e11d48] hover:bg-[#2b2337] sm:hidden"
          >
            <LogOut className="h-5 w-5 text-[#f87171]" />
          </Button>

          <Link
            to="/manager/profile"
            className="flex items-center gap-3 rounded-xl border-l border-[#142347] px-2 pl-3 text-left transition-all duration-300 hover:bg-[#13254a]/60"
          >
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-[#f5f7ff]">{managerProfile.name}</p>
              <p className="text-xs text-[#8ba3d0]">{managerProfile.role}</p>
            </div>
            <Avatar className="border-2 border-[#facc15] shadow-[0_0_0_3px_rgba(250,204,21,0.25)]">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>{managerProfile.initials}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
};
