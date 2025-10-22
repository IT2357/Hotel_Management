import { motion } from "framer-motion";
import { Search, Moon, Sun, Hotel, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/manager/ManagerButton";
import { ManagerInput } from "@/components/manager/ManagerInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/manager/ManagerAvatar";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import NotificationDropdown from "@/components/common/NotificationDropdown.jsx";

export const ManagerNavbar = ({ onToggleSidebar }) => {
  const [isDark, setIsDark] = useState(true);
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
      className="fixed inset-x-0 top-0 z-50 w-full bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/30 text-gray-800 shadow-lg backdrop-blur-sm border-b border-gray-100"
    >
      <div className="relative flex items-center justify-between px-6 py-4">
        <div className="pointer-events-none absolute inset-x-12 inset-y-0 rounded-full bg-blue-50/60 blur-3xl" />
        {/* Left - Logo + Hamburger */}
        <div className="relative z-10 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="rounded-xl border border-transparent text-gray-800 transition-all duration-300 hover:border-gray-200 hover:bg-gray-100"
          >
            <Menu className="h-5 w-5 text-blue-600" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
                <Hotel className="h-6 w-6 text-white" />
              </div>
              <motion.div
                className="absolute -inset-1 rounded-xl bg-gradient-to-r from-blue-400 to-indigo-400 opacity-30 blur-lg"
                animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent uppercase tracking-wide">Valdor Hotel</h1>
              <p className="text-xs text-gray-600 font-medium">Manager Portal</p>
            </div>
          </div>
        </div>

        {/* Center - Search */}
        <div className="relative z-10 hidden flex-1 items-center md:flex">
          <div className="group relative mx-8 w-full">
            <div className="pointer-events-none absolute inset-0 rounded-full bg-gray-100 blur-xl" />
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <ManagerInput
              placeholder="Search tasks, staff, or rooms..."
              className="rounded-full border-2 border-gray-200 bg-white pl-12 pr-6 text-gray-900 placeholder:text-gray-400 shadow-md transition-all duration-300 focus:border-indigo-500 focus:shadow-lg focus:ring-2 focus:ring-indigo-200 focus-visible:ring-indigo-200"
            />
          </div>
        </div>

        {/* Right - Actions */}
        <div className="relative z-10 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="relative rounded-xl border border-transparent text-gray-800 transition-all duration-300 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50"
          >
            {isDark ? (
              <Sun className="h-5 w-5 text-indigo-600" />
            ) : (
              <Moon className="h-5 w-5 text-indigo-600" />
            )}
          </Button>

          <NotificationDropdown />

          <Button
            variant="ghost"
            onClick={handleLogout}
            className="hidden items-center gap-2 rounded-xl border border-transparent px-4 py-2 text-gray-800 transition-all duration-300 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 sm:flex"
          >
            <LogOut className="h-5 w-5 text-red-600" />
            <span className="text-sm font-semibold">Logout</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="flex rounded-xl border border-transparent text-gray-800 transition-all duration-300 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 sm:hidden"
          >
            <LogOut className="h-5 w-5 text-red-600" />
          </Button>

          <Link
            to="/manager/profile"
            className="flex items-center gap-3 rounded-xl border-l border-gray-200 px-2 pl-3 text-left transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50"
          >
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-gray-900">{managerProfile.name}</p>
              <p className="text-xs text-indigo-600 font-medium">{managerProfile.role}</p>
            </div>
            <Avatar className="border-2 border-indigo-500 shadow-lg ring-2 ring-indigo-100">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>{managerProfile.initials}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
};
