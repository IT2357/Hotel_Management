import { motion } from "framer-motion";
import { LayoutDashboard, ListTodo, Users, MessageSquare, FileText, Settings, ChevronLeft } from "lucide-react";
import { Button } from "@/components/manager/ManagerButton";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard Overview", id: "dashboard" },
  { icon: ListTodo, label: "Task Management", id: "tasks" },
  { icon: Users, label: "Staff Analytics", id: "staff" },
  { icon: MessageSquare, label: "Guest Feedback", id: "feedback" },
  { icon: FileText, label: "Reports", id: "reports" },
  { icon: Settings, label: "Settings", id: "settings" },
];

export const Sidebar = ({ isCollapsed, onToggle, activeItem, onItemClick }) => {

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0, width: isCollapsed ? "80px" : "280px" }}
      transition={{ duration: 0.3 }}
      className="relative glass-card border-r border-border/50 h-[calc(100vh-88px)] flex flex-col"
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="absolute -right-4 top-6 z-10 bg-card border border-border/50 rounded-full shadow-lg hover:bg-secondary"
      >
        <motion.div animate={{ rotate: isCollapsed ? 180 : 0 }}>
          <ChevronLeft className="w-4 h-4" />
        </motion.div>
      </Button>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item, index) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onItemClick(item)}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
              ${activeItem === item.id
                ? "gold-gradient text-background shadow-lg" 
                : "hover:bg-secondary/80 text-foreground"
              }
              ${isCollapsed ? "justify-center" : ""}
            `}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && (
              <span className="font-medium text-sm">{item.label}</span>
            )}
            {activeItem === item.id && !isCollapsed && (
              <motion.div
                layoutId="activeIndicator"
                className="ml-auto w-2 h-2 rounded-full bg-background"
                transition={{ type: "spring", bounce: 0.2 }}
              />
            )}
          </motion.button>
        ))}
      </nav>

      {/* Bottom Section */}
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 border-t border-border/50"
        >
          <div className="glass-card p-4 space-y-2">
            <p className="text-xs font-semibold text-primary">Quick Stats</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Active Tasks</span>
                <span className="font-semibold">24</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Staff Online</span>
                <span className="font-semibold text-success">18</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.aside>
  );
};
