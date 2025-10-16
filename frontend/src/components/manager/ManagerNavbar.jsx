import { motion } from "framer-motion";
import { Search, Bell, Moon, Sun, Hotel, Menu } from "lucide-react";
import { Button } from "@/components/manager/ManagerButton";
import { ManagerInput } from "@/components/manager/ManagerInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/manager/ManagerAvatar";
import { useState } from "react";

export const ManagerNavbar = ({ onToggleSidebar }) => {
  const [isDark, setIsDark] = useState(true);
  const [notifications] = useState(3);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 border-b border-[#142347] bg-[#0b1b3c] text-[#f5f7ff] shadow-[0_8px_32px_rgba(9,17,40,0.45)]"
    >
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left - Logo + Hamburger */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="text-[#f5f7ff] hover:bg-[#13254a]"
          >
            <Menu className="w-5 h-5 text-[#facc15]" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Hotel className="w-8 h-8 text-[#facc15]" />
              <motion.div
                className="absolute -inset-1 rounded-full bg-[#facc1533] blur-md"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-[#f5f7ff]">Royal Palm Hotel</h1>
              <p className="text-xs text-[#8ba3d0]">Manager Portal</p>
            </div>
          </div>
        </div>

        {/* Center - Search */}
        <div className="hidden md:flex items-center flex-1 max-w-xl mx-8">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8ba3d0]" />
            <ManagerInput
              placeholder="Search tasks, staff, or rooms..."
              className="pl-10 bg-[#10234f] border border-[#1b335f] text-[#d6e2ff] placeholder:text-[#8ba3d0] transition-all duration-300 focus:border-[#facc15] focus-visible:ring-0"
            />
          </div>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="relative text-[#f5f7ff] hover:bg-[#13254a]"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-[#facc15]" />
            ) : (
              <Moon className="w-5 h-5 text-[#facc15]" />
            )}
          </Button>

          <Button variant="ghost" size="icon" className="relative text-[#f5f7ff] hover:bg-[#13254a]">
            <Bell className="w-5 h-5" />
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

          <div className="flex items-center gap-3 border-l border-[#142347] pl-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-[#f5f7ff]">Sarah Johnson</p>
              <p className="text-xs text-[#8ba3d0]">General Manager</p>
            </div>
            <Avatar className="border-2 border-[#facc15]">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" />
              <AvatarFallback>SJ</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};
