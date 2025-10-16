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
      className="relative flex h-[calc(100vh-88px)] flex-col border-r border-[#142347] bg-[#09152f] text-[#f5f7ff] shadow-[inset_-12px_0_32px_rgba(8,14,29,0.65)]"
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="absolute -right-4 top-6 z-10 rounded-full border border-[#142347] bg-[#10234f] text-[#facc15] shadow-[0_12px_30px_rgba(9,17,40,0.55)] transition-colors hover:bg-[#132b5f]"
      >
        <motion.div animate={{ rotate: isCollapsed ? 180 : 0 }}>
          <ChevronLeft className="h-4 w-4" />
        </motion.div>
      </Button>

      {/* Menu Items */}
      <nav className="flex-1 space-y-2 p-4">
        {menuItems.map((item, index) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onItemClick(item)}
            className={`
              flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-300
              ${activeItem === item.id
                ? "bg-[#facc15] text-[#0b1b3c] shadow-[0_14px_28px_rgba(250,204,21,0.45)]"
                : "text-[#e2e8ff] hover:bg-[#13254a] hover:text-[#f5f7ff]"
              }
              ${isCollapsed ? "justify-center" : ""}
            `}
          >
            <item.icon
              className={`h-5 w-5 flex-shrink-0 ${
                activeItem === item.id ? "text-[#0b1b3c]" : "text-[#facc15]"
              }`}
            />
            {!isCollapsed && (
              <span className="font-medium text-sm">{item.label}</span>
            )}
            {activeItem === item.id && !isCollapsed && (
              <motion.div
                layoutId="activeIndicator"
                className="ml-auto h-2 w-2 rounded-full bg-[#0b1b3c]"
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
          className="border-t border-[#142347] p-4"
        >
          <div className="space-y-2 rounded-2xl border border-[#162a52] bg-[#0e1f42] p-4 shadow-[0_10px_24px_rgba(9,17,40,0.45)]">
            <p className="text-xs font-semibold text-[#facc15]">Quick Stats</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[#8ba3d0]">Active Tasks</span>
                <span className="font-semibold text-[#f5f7ff]">24</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#8ba3d0]">Staff Online</span>
                <span className="font-semibold text-[#2dd06c]">18</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.aside>
  );
};
