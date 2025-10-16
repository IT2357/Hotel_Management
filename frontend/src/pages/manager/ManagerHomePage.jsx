
import { motion } from "framer-motion";
import { ManagerNavbar } from "@/components/manager/ManagerNavbar";
import { Sidebar } from "@/components/manager/Sidebar";
import { SummaryCards } from "@/components/manager/SummaryCards";
import { KanbanBoard } from "@/components/manager/KanbanBoard";
import { StaffPerformanceChart } from "@/components/manager/StaffPerformanceChart";
import { StaffList } from "@/components/manager/StaffList";
import { FeedbackSummary } from "@/components/manager/FeedbackSummary";
import { useState } from "react";
import { toast } from "sonner";

const ManagerHomePage = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("dashboard");

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    toast.info(sidebarCollapsed ? "Sidebar expanded" : "Sidebar collapsed", {
      duration: 1500,
    });
  };

  const handleMenuItemClick = (item) => {
    setActiveMenuItem(item.id);
    toast.success(`Navigating to ${item.label}`, {
      description: "Feature coming soon!",
      duration: 2000,
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
        
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
            <p className="text-muted-foreground">Welcome back, Sarah! Here's what's happening today.</p>
          </motion.div>

          <SummaryCards />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <h2 className="text-2xl font-semibold text-foreground">Task Management</h2>
            <p className="text-sm text-muted-foreground">Smart kanban board with AI-powered staff suggestions</p>
          </motion.div>

          <KanbanBoard />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <StaffPerformanceChart />
            </div>
            <div>
              <StaffList />
            </div>
          </div>

          <FeedbackSummary />

          <footer className="text-center py-6 border-t border-border/50 mt-12">
            <p className="text-sm text-muted-foreground">
              © 2025 Royal Palm Hotel Task Management System — All Rights Reserved
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default ManagerHomePage;
