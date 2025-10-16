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
      className="sticky top-0 z-50 glass-card border-b border-border/50 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left - Logo + Hamburger */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="hover:bg-secondary/80"
          >
            <Menu className="w-5 h-5 text-primary" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Hotel className="w-8 h-8 text-primary" />
              <motion.div
                className="absolute -inset-1 bg-primary/20 rounded-full blur-md"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-foreground">Royal Palm Hotel</h1>
              <p className="text-xs text-muted-foreground">Manager Portal</p>
            </div>
          </div>
        </div>

        {/* Center - Search */}
        <div className="hidden md:flex items-center flex-1 max-w-xl mx-8">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <ManagerInput
              placeholder="Search tasks, staff, or rooms..."
              className="pl-10 bg-secondary/50 border-border/50 focus:border-primary transition-all duration-300 focus:glow-effect"
            />
          </div>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="relative hover:bg-secondary/80"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-primary" />
            ) : (
              <Moon className="w-5 h-5 text-primary" />
            )}
          </Button>

          <Button variant="ghost" size="icon" className="relative hover:bg-secondary/80">
            <Bell className="w-5 h-5" />
            {notifications > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-xs flex items-center justify-center font-semibold animate-pulse-glow"
              >
                {notifications}
              </motion.span>
            )}
          </Button>

          <div className="flex items-center gap-3 pl-3 border-l border-border/50">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">Sarah Johnson</p>
              <p className="text-xs text-muted-foreground">General Manager</p>
            </div>
            <Avatar className="border-2 border-primary/50">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" />
              <AvatarFallback>SJ</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};
