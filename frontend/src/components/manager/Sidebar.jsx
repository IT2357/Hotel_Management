import { motion } from "framer-motion";
import { LayoutDashboard, ListTodo, Users, MessageSquare, FileText, User, ChevronLeft, Activity, TrendingUp, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/manager/ManagerButton";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard Overview", id: "dashboard" },
  { icon: ListTodo, label: "Task Management", id: "tasks" },
  { icon: Users, label: "Staff Analytics", id: "staff" },
  { icon: Mail, label: "Staff Messaging", id: "messaging" },
  { icon: MessageCircle, label: "Staff Chat", id: "chat" },
  { icon: MessageSquare, label: "Guest Feedback", id: "feedback" },
  { icon: FileText, label: "Reports", id: "reports" },
  { icon: User, label: "Profile", id: "profile" },
];

export const Sidebar = ({ isCollapsed, onToggle, activeItem, onItemClick }) => {

  return (
    <motion.aside
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1, width: isCollapsed ? "80px" : "280px" }}
      transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
      className="relative flex h-[calc(100vh-88px)] flex-col overflow-hidden bg-white border-r-2 border-gray-200 shadow-xl"
    >
      {/* Subtle top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="absolute -right-4 top-6 z-50 h-8 w-8 rounded-full border-2 border-gray-200 bg-white text-gray-700 shadow-lg transition-all hover:shadow-xl hover:bg-gray-50 hover:border-gray-300 hover:scale-110 active:scale-95"
      >
        <motion.div 
          animate={{ rotate: isCollapsed ? 180 : 0 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
        >
          <ChevronLeft className="h-4 w-4" />
        </motion.div>
      </Button>

      {/* Logo/Brand Area */}
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-6 pt-8 pb-6"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 shadow-lg">
              <LayoutDashboard className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">Manager Hub</h2>
              <p className="text-xs text-gray-500 font-semibold">Control Center</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Menu Items */}
      <nav className="flex-1 space-y-2 px-4 py-4">
        {menuItems.map((item, index) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ 
              delay: index * 0.08,
              type: "spring",
              stiffness: 100
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onItemClick(item)}
            className={`
              group relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300
              ${activeItem === item.id
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                : "text-gray-700 hover:bg-gray-100"
              }
              ${isCollapsed ? "justify-center px-3" : ""}
            `}
          >
            {/* Active indicator bar */}
            {activeItem === item.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            
            {/* Icon */}
            <item.icon
              className={`h-5 w-5 flex-shrink-0 transition-all duration-300 ${
                activeItem === item.id 
                  ? "text-white" 
                  : "text-gray-600 group-hover:text-indigo-600"
              }`}
              strokeWidth={2.5}
            />
            
            {/* Label */}
            {!isCollapsed && (
              <span className="transition-all duration-300">
                {item.label}
              </span>
            )}
          </motion.button>
        ))}
      </nav>

      {/* Bottom Section - Enhanced Stats */}
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="border-t-2 border-gray-200 p-4 bg-gradient-to-b from-gray-50 to-white"
        >
          <div className="rounded-xl bg-white border-2 border-gray-200 p-4 shadow-md">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-wider text-gray-700">Quick Stats</p>
                <TrendingUp className="h-4 w-4 text-indigo-500" />
              </div>
              
              <div className="space-y-2">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 transition-all"
                >
                  <span className="text-xs font-bold text-amber-700">Active Tasks</span>
                  <div className="flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-amber-600" />
                    <span className="text-sm font-black text-amber-700">24</span>
                  </div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5 transition-all"
                >
                  <span className="text-xs font-bold text-emerald-700">Staff Online</span>
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="h-2 w-2 rounded-full bg-emerald-500"
                    />
                    <span className="text-sm font-black text-emerald-700">18</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.aside>
  );
};
