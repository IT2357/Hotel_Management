import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import useAuth from "@/hooks/useAuth";
import { ManagerLayout, ManagerPageLoader, ManagerErrorState } from "@/components/manager";
import { SummaryCards } from "@/components/manager/SummaryCards";
import { StaffPerformanceChart } from "@/components/manager/StaffPerformanceChart";
import { StaffList } from "@/components/manager/StaffList";
import { Button } from "@/components/manager/ManagerButton";
import { Users, Activity, Clock, Award, TrendingUp, BarChart3 } from "lucide-react";
import ManagerPageHeader from "@/components/manager/ManagerPageHeader";
import { MANAGER_CONTENT_CLASS, MANAGER_PAGE_CONTAINER_CLASS } from "./managerStyles";
import { useStaffAnalytics } from "./staffAnalytics/useStaffAnalytics";
import { WorkforceSnapshot } from "./staffAnalytics/WorkforceSnapshot";
import { TopPerformersTable } from "./staffAnalytics/TopPerformersTable";
import { RiskAlertsCard } from "./staffAnalytics/RiskAlertsCard";
import { EngagementCheckpoints } from "./staffAnalytics/EngagementCheckpoints";

/**
 * Manager Staff Analytics Page
 * Displays comprehensive staff performance metrics and analytics
 */

const ManagerStaffAnalyticsPage = () => {
  const { user } = useAuth();
  const { analytics, isLoading, isRefreshing, error, loadAnalytics } = useStaffAnalytics();

  const displayName = useMemo(
    () =>
      user?.fullName ||
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      user?.name ||
      user?.email ||
      "Manager",
    [user]
  );

  const handleSidebarToggle = useCallback((isCollapsed) => {
    toast.info(isCollapsed ? "Sidebar collapsed" : "Sidebar expanded", { duration: 1500 });
  }, []);

  const handleMenuItemSelect = useCallback((item) => {
    if (item.id === "staff") {
      toast.success("Already reviewing staff analytics", { duration: 1500 });
      return false;
    }

    if (item.id === "dashboard" || item.id === "tasks" || item.id === "messaging" || item.id === "chat" || item.id === "feedback" || item.id === "reports" || item.id === "profile") {
      return undefined;
    }

    toast.info(`${item.label} is coming soon`, {
      description: "We are still wiring up the manager workspace.",
      duration: 1800,
    });
    return false;
  }, []);

  const analyticsSnapshot = useMemo(
    () => analytics?.summary ?? {
      totalStaff: 0,
      activeStaff: 0,
      onDuty: 0,
      completionRate: 0,
      avgResponseTime: 0,
      guestSatisfaction: 0,
    },
    [analytics]
  );

  const summaryCards = useMemo(
    () => [
      { icon: Users, label: "Active Staff", value: analyticsSnapshot.activeStaff, iconColor: "#22c55e" },
      { icon: Activity, label: "On Duty Now", value: analyticsSnapshot.onDuty, iconColor: "#38bdf8" },
      { icon: TrendingUp, label: "Completion Rate", value: analyticsSnapshot.completionRate, suffix: "%", iconColor: "#facc15" },
      { icon: Clock, label: "Avg Response (mins)", value: analyticsSnapshot.avgResponseTime, iconColor: "#a855f7" },
      { icon: Award, label: "Guest Satisfaction", value: analyticsSnapshot.guestSatisfaction, suffix: "/5", iconColor: "#f97316" },
    ],
    [analyticsSnapshot]
  );

  const departmentBreakdown = analytics?.departmentBreakdown ?? [];
  const topPerformers = analytics?.topPerformers ?? [];
  const riskAlerts = analytics?.riskAlerts ?? [];

  if (isLoading && !analytics) {
    return (
      <ManagerLayout activeItem="staff">
        <ManagerPageLoader message="Loading staff analytics..." fullPage={true} />
      </ManagerLayout>
    );
  }

  if (!analytics) {
    return (
      <ManagerLayout activeItem="staff">
        <div className="mt-24">
          <ManagerErrorState
            title="No analytics available"
            message="We could not load staff insights. Please retry in a moment."
            error={error ? new Error(error) : undefined}
            onRetry={() => loadAnalytics()}
          />
        </div>
      </ManagerLayout>
    );
  }

  return (
    <ManagerLayout
      activeItem="staff"
      onSidebarToggle={handleSidebarToggle}
      onMenuItemSelect={handleMenuItemSelect}
      contentClassName={MANAGER_CONTENT_CLASS}
    >
      <div className={`${MANAGER_PAGE_CONTAINER_CLASS} space-y-6`}>
        <ManagerPageHeader
          title="Staff Analytics"
          subtitle={`${displayName}, monitor throughput, response habits, and guest impact.`}
          accentChips={["Workforce Pulse", "Syncs every 30 minutes"]}
          actions={(
            <Button
              variant="outline"
              onClick={() => loadAnalytics({ silent: true })}
              disabled={isRefreshing}
              className="border-white/20 bg-white/[0.08] text-white shadow-[0_18px_40px_rgba(8,14,29,0.35)] backdrop-blur-lg transition-transform duration-300 hover:border-white/25 hover:bg-white/[0.12] hover:-translate-y-0.5"
            >
              <BarChart3 className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh insights
            </Button>
          )}
          footerChips={[
            <span key="active">Active staff {analyticsSnapshot.activeStaff}</span>,
            <span key="onDuty">On duty {analyticsSnapshot.onDuty}</span>,
            <span key="satisfaction">Guest satisfaction {analyticsSnapshot.guestSatisfaction}/5</span>,
          ]}
        />

        {error && (
          <div className="rounded-2xl border border-amber-300/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {error}
          </div>
        )}

        <SummaryCards cards={summaryCards} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <StaffPerformanceChart />
          </div>
          <WorkforceSnapshot departmentBreakdown={departmentBreakdown} />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <TopPerformersTable topPerformers={topPerformers} />
          <RiskAlertsCard riskAlerts={riskAlerts} />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <StaffList />
          <EngagementCheckpoints />
        </div>
      </div>
    </ManagerLayout>
  );
};

export default ManagerStaffAnalyticsPage;
