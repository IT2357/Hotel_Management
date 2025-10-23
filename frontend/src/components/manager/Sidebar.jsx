import { motion } from "framer-motion";
import { LayoutDashboard, ListTodo, Users, MessageSquare, FileText, User, ChevronLeft, ClipboardList } from "lucide-react";
import { Button } from "@/components/manager/ManagerButton";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard Overview", id: "dashboard" },
  { icon: ListTodo, label: "Task Management", id: "tasks" },
  { icon: Users, label: "Staff Analytics", id: "staff" },
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
      className="relative flex h-[calc(100vh-88px)] flex-col overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl backdrop-blur-xl"
      style={{
        background: "linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        borderRight: "1px solid rgba(148, 163, 184, 0.1)"
      }}
    >
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            y: [0, -100, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, 100, 0],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 blur-3xl"
        />
      </div>

      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="absolute -right-4 top-6 z-50 rounded-full border-2 border-slate-200/20 bg-gradient-to-br from-white to-slate-50 text-slate-700 shadow-xl shadow-slate-900/20 transition-all hover:shadow-2xl hover:from-slate-50 hover:to-white hover:border-slate-300/30 hover:scale-110 active:scale-95 backdrop-blur-sm cursor-pointer"
      >
        <motion.div 
          animate={{ rotate: isCollapsed ? 180 : 0 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
          className="pointer-events-none"
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
          className="relative z-10 px-6 pt-6 pb-4"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 p-2.5 shadow-lg shadow-emerald-500/30">
              <LayoutDashboard className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Manager Hub</h2>
              <p className="text-xs text-slate-400">Control Center</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Menu Items */}
      <nav className="relative z-10 flex-1 space-y-1.5 px-3 py-4">
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
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onItemClick(item)}
            className={`
              group relative flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-300
              ${activeItem === item.id
                ? "bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-900 shadow-lg shadow-emerald-500/30"
                : "text-slate-300 hover:bg-white/5 hover:text-white backdrop-blur-sm"
              }
              ${isCollapsed ? "justify-center px-3" : ""}
            `}
          >
            {/* Active indicator */}
            {activeItem === item.id && !isCollapsed && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            
            {/* Icon */}
            <div className="relative z-10">
              <item.icon
                className={`h-5 w-5 flex-shrink-0 transition-all duration-300 ${
                  activeItem === item.id 
                    ? "text-slate-900 drop-shadow-sm" 
                    : "text-slate-400 group-hover:text-emerald-400 group-hover:drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                }`}
                strokeWidth={activeItem === item.id ? 2.5 : 2}
              />
            </div>
            
            {/* Label */}
            {!isCollapsed && (
              <span className="relative z-10 font-medium transition-all duration-300">
                {item.label}
              </span>
            )}

            {/* Hover glow effect */}
            {activeItem !== item.id && (
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-cyan-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
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
          className="relative z-10 border-t border-white/5 p-4"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-4 shadow-xl backdrop-blur-md ring-1 ring-white/10">
            {/* Glow effect */}
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 blur-2xl" />
            
            <div className="relative space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Quick Stats</p>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                />
              </div>
              
              <div className="space-y-2.5">
                <motion.div 
                  whileHover={{ x: 2 }}
                  className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 backdrop-blur-sm transition-colors hover:bg-white/10"
                >
                  <span className="text-xs font-medium text-slate-300">Active Tasks</span>
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]"
                    />
                    <span className="text-sm font-bold text-white">24</span>
                  </div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ x: 2 }}
                  className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 backdrop-blur-sm transition-colors hover:bg-white/10"
                >
                  <span className="text-xs font-medium text-slate-300">Staff Online</span>
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                    />
                    <span className="text-sm font-bold text-emerald-400">18</span>
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
