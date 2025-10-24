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
      className="fixed inset-x-0 top-0 z-50 w-full bg-white text-gray-800 shadow-md border-b border-gray-200"
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left - Logo + Hamburger */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="h-5 w-5 text-gray-700" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
              <Hotel className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-blue-600 uppercase tracking-wide">Valdor Hotel</h1>
              <p className="text-xs text-gray-500 font-medium">Manager Portal</p>
            </div>
          </div>
        </div>

        {/* Center - Search */}
        <div className="hidden flex-1 items-center md:flex max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <ManagerInput
              placeholder="Search tasks, staff, or rooms..."
              className="w-full rounded-lg border border-gray-300 bg-gray-50 pl-10 pr-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isDark ? (
              <Sun className="h-5 w-5 text-gray-700" />
            ) : (
              <Moon className="h-5 w-5 text-gray-700" />
            )}
          </Button>

          <NotificationDropdown />

          <Button
            variant="ghost"
            onClick={handleLogout}
            className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors sm:flex"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="flex rounded-lg hover:bg-red-50 text-red-600 transition-colors sm:hidden"
          >
            <LogOut className="h-5 w-5" />
          </Button>

          <div className="h-8 w-px bg-gray-300 mx-2"></div>

          <Link
            to="/manager/profile"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-gray-100 transition-colors"
          >
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-gray-900">{managerProfile.name}</p>
              <p className="text-xs text-gray-500">{managerProfile.role}</p>
            </div>
            <Avatar className="h-9 w-9 border-2 border-blue-500">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-sm">{managerProfile.initials}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
};
