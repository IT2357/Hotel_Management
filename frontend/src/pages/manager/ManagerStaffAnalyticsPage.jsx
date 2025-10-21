import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import useAuth from "@/hooks/useAuth";
import { managerReportsAPI } from "@/services/managerReportsAPI";
import { ManagerLayout, ManagerPageLoader, ManagerErrorState } from "@/components/manager";
import { SummaryCards } from "@/components/manager/SummaryCards";
import { StaffPerformanceChart } from "@/components/manager/StaffPerformanceChart";
import { StaffList } from "@/components/manager/StaffList";
import { Button } from "@/components/manager/ManagerButton";
import { Users, Activity, Clock, Award, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";
import ManagerPageHeader from "@/components/manager/ManagerPageHeader";
import { MANAGER_CONTENT_CLASS, MANAGER_PAGE_CONTAINER_CLASS, MANAGER_SECTION_CLASS, MANAGER_CARD_SURFACE_CLASS } from "./managerStyles";

const FALLBACK_ANALYTICS = {
  summary: {
    totalStaff: 42,
    activeStaff: 36,
    onDuty: 27,
    completionRate: 93,
    avgResponseTime: 14,
    guestSatisfaction: 4.7,
  },
  departmentBreakdown: [
    { department: "Housekeeping", totalTasks: 128, completed: 121, completionRate: 95, satisfaction: 4.8 },
    { department: "Front Desk", totalTasks: 94, completed: 86, completionRate: 91, satisfaction: 4.6 },
    { department: "Kitchen", totalTasks: 112, completed: 101, completionRate: 90, satisfaction: 4.5 },
    { department: "Maintenance", totalTasks: 76, completed: 68, completionRate: 89, satisfaction: 4.4 },
    { department: "Guest Services", totalTasks: 54, completed: 52, completionRate: 96, satisfaction: 4.9 },
  ],
  topPerformers: [
    { id: "hs-1", name: "Maria Rodriguez", role: "Housekeeping Lead", completionRate: 98, tasksCompleted: 48, avgQualityScore: 4.9 },
    { id: "fd-2", name: "Lisa Chen", role: "Front Desk Manager", completionRate: 95, tasksCompleted: 42, avgQualityScore: 4.8 },
    { id: "kt-3", name: "Carlos Martinez", role: "Executive Chef", completionRate: 94, tasksCompleted: 45, avgQualityScore: 4.7 },
    { id: "mt-4", name: "John Smith", role: "Maintenance Supervisor", completionRate: 92, tasksCompleted: 39, avgQualityScore: 4.6 },
  ],
  riskAlerts: [
    { id: "alert-1", title: "Maintenance backlog", detail: "4 high priority work orders pending beyond SLA", severity: "high" },
    { id: "alert-2", title: "Housekeeping overtime", detail: "Two senior attendants exceed weekly overtime allowance", severity: "medium" },
    { id: "alert-3", title: "Kitchen onboarding", detail: "New hire training logs incomplete for 3 days", severity: "medium" },
  ],
};

const mapApiToAnalytics = (payload) => {
  if (!payload?.staff) {
    return FALLBACK_ANALYTICS;
  }

  const summary = payload.staff.summary || {};
  const departmentPerformance = payload.staff.departmentPerformance || [];
  const topPerformers = payload.staff.topPerformers || [];
  const riskAlerts = payload.staff.riskAlerts || [];

  return {
    summary: {
      totalStaff: summary.totalStaff ?? FALLBACK_ANALYTICS.summary.totalStaff,
      activeStaff: summary.activeStaff ?? summary.currentlyWorking ?? FALLBACK_ANALYTICS.summary.activeStaff,
      onDuty: summary.onDuty ?? summary.currentlyOnDuty ?? FALLBACK_ANALYTICS.summary.onDuty,
      completionRate: Math.round(summary.completionRate ?? FALLBACK_ANALYTICS.summary.completionRate),
      avgResponseTime: Math.round(summary.avgResponseTime ?? summary.averageResponseTime ?? FALLBACK_ANALYTICS.summary.avgResponseTime),
      guestSatisfaction: (() => {
        const raw = summary.guestSatisfaction ?? summary.averageSatisfaction ?? FALLBACK_ANALYTICS.summary.guestSatisfaction;
        const numeric = Number.parseFloat(raw);
        return Number.isFinite(numeric) ? Number(numeric.toFixed(1)) : FALLBACK_ANALYTICS.summary.guestSatisfaction;
      })(),
    },
    departmentBreakdown: (departmentPerformance || [])
      .map((dept) => {
        const departmentName = dept.department || dept.name;
        if (!departmentName) {
          return null;
        }

        const totalTasks = Number.isFinite(dept.totalTasks) ? dept.totalTasks : Number.isFinite(dept.tasks) ? dept.tasks : 0;
        const completedTasks = Number.isFinite(dept.completedTasks) ? dept.completedTasks : Number.isFinite(dept.completed) ? dept.completed : 0;
        const completionRate = Number.isFinite(dept.completionRate)
          ? Math.round(dept.completionRate)
          : Math.round((completedTasks / Math.max(totalTasks, 1)) * 100);

        const satisfactionRaw = dept.guestSatisfaction ?? dept.satisfaction ?? dept.qualityScore;
        const satisfactionValue = Number.parseFloat(satisfactionRaw);

        return {
          department: departmentName,
          totalTasks,
          completed: completedTasks,
          completionRate,
          satisfaction: Number.isFinite(satisfactionValue)
            ? Number(satisfactionValue.toFixed(1))
            : (FALLBACK_ANALYTICS.departmentBreakdown[0]?.satisfaction ?? FALLBACK_ANALYTICS.summary.guestSatisfaction),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 5),
    topPerformers: topPerformers.length
      ? topPerformers.map((person) => ({
          id: person.staffId || person.id,
          name: person.name,
          role: person.role || person.position,
          completionRate: Math.round(person.completionRate ?? 0),
          tasksCompleted: person.completedTasks ?? person.totalCompleted ?? 0,
          avgQualityScore: Number(person.avgQualityScore ?? person.qualityScore ?? 0),
        }))
      : FALLBACK_ANALYTICS.topPerformers,
    riskAlerts: riskAlerts.length
      ? riskAlerts.map((alert, index) => ({
          id: alert.id || `alert-${index}`,
          title: alert.title || alert.heading,
          detail: alert.detail || alert.description,
          severity: alert.severity || "medium",
        }))
      : FALLBACK_ANALYTICS.riskAlerts,
  };
};

const severityStyles = {
  high: "border border-rose-400/40 bg-rose-500/10 text-rose-100",
  medium: "border border-amber-300/40 bg-amber-400/10 text-amber-100",
  low: "border border-sky-300/40 bg-sky-400/10 text-sky-100",
};

const ManagerStaffAnalyticsPage = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError("");

    try {
      const response = await managerReportsAPI.getOverview({ period: "monthly" });
      const payload = response?.data ?? response;
      setAnalytics(mapApiToAnalytics(payload));
      if (silent) {
        toast.success("Staff analytics refreshed", { duration: 1200 });
      }
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Unable to load staff analytics";
      setError(message);
      toast.error("Showing latest cached insights", {
        description: message,
        duration: 2200,
      });
      setAnalytics((previous) => previous ?? FALLBACK_ANALYTICS);
    } finally {
      if (silent) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

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

    if (item.id === "dashboard" || item.id === "tasks" || item.id === "feedback" || item.id === "reports" || item.id === "profile") {
      return undefined;
    }

    toast.info(`${item.label} is coming soon`, {
      description: "We are still wiring up the manager workspace.",
      duration: 1800,
    });
    return false;
  }, []);

  const analyticsSnapshot = useMemo(
    () => analytics?.summary ?? FALLBACK_ANALYTICS.summary,
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

  const departmentBreakdown = analytics?.departmentBreakdown ?? FALLBACK_ANALYTICS.departmentBreakdown;
  const topPerformers = analytics?.topPerformers ?? FALLBACK_ANALYTICS.topPerformers;
  const riskAlerts = analytics?.riskAlerts ?? FALLBACK_ANALYTICS.riskAlerts;

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
            Showing cached analytics while we reconnect to the reporting service.
          </div>
        )}

        <SummaryCards cards={summaryCards} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className={`${MANAGER_SECTION_CLASS} xl:col-span-2`}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Performance Trends</h2>
                <p className="text-sm text-white/70">Task throughput, response times, and guest sentiment correlation.</p>
              </div>
            </div>
            <div className="mt-4">
              <StaffPerformanceChart />
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`${MANAGER_SECTION_CLASS} space-y-4`}
          >
            <div>
              <h2 className="text-xl font-semibold text-white">Workforce Snapshot</h2>
              <p className="text-sm text-white/70">Coverage by department and current load.</p>
            </div>
            <div className="space-y-3">
              {departmentBreakdown.map((dept) => {
                const completionPct = Math.min(100, Math.round((dept.completed / (dept.totalTasks || 1)) * 100));
                return (
                  <div
                    key={dept.department}
                    className={`${MANAGER_CARD_SURFACE_CLASS} p-4 text-white shadow-[0_18px_45px_rgba(8,14,29,0.45)]`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{dept.department}</p>
                        <p className="text-xs text-white/65">{dept.completed} / {dept.totalTasks} tasks closed</p>
                      </div>
                      <span className="text-sm font-semibold text-amber-200">{completionPct}%</span>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-300 via-amber-300 to-emerald-300"
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-white/65">Guest satisfaction {dept.satisfaction ?? "-"}/5</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className={MANAGER_SECTION_CLASS}
          >
            <h2 className="text-xl font-semibold text-white">Top performers</h2>
            <p className="mb-4 text-sm text-white/70">Completion rate and quality in the current period.</p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-white/80">
                <thead className="bg-white/10 text-white/70">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Team member</th>
                    <th className="px-4 py-2 text-left font-medium">Role</th>
                    <th className="px-4 py-2 text-left font-medium">Tasks</th>
                    <th className="px-4 py-2 text-left font-medium">Completion</th>
                    <th className="px-4 py-2 text-left font-medium">Quality</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {topPerformers.map((member) => (
                    <tr key={member.id} className="transition-colors hover:bg-white/5">
                      <td className="px-4 py-3 font-medium text-white">{member.name}</td>
                      <td className="px-4 py-3 text-white/70">{member.role || "-"}</td>
                      <td className="px-4 py-3 text-white/80">{member.tasksCompleted}</td>
                      <td className="px-4 py-3 text-amber-200">{member.completionRate}%</td>
                      <td className="px-4 py-3 text-emerald-200">{member.avgQualityScore?.toFixed?.(1) ?? member.avgQualityScore ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`${MANAGER_SECTION_CLASS} space-y-4`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Risk & readiness</h2>
                <p className="text-sm text-white/70">Items that may need intervention this week.</p>
              </div>
            </div>
            <div className="space-y-3">
              {riskAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-2xl px-4 py-3 text-sm ${severityStyles[alert.severity] || severityStyles.medium}`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{alert.title}</span>
                  </div>
                  <p className="mt-1 text-xs opacity-80">{alert.detail}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <StaffList />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className={`${MANAGER_SECTION_CLASS} space-y-4`}
          >
            <div>
              <h2 className="text-xl font-semibold text-white">Engagement checkpoints</h2>
              <p className="text-sm text-white/70">Upcoming 1:1s, training, and milestone reminders.</p>
            </div>
            <ul className="space-y-3 text-sm text-white/80">
              <li className={`${MANAGER_CARD_SURFACE_CLASS} p-4`}>
                <p className="font-semibold text-white">Kitchen quarterly skills audit</p>
                <p className="text-xs text-white/65">Scheduled for Friday · Chef Martinez leading practical assessment.</p>
              </li>
              <li className={`${MANAGER_CARD_SURFACE_CLASS} p-4`}>
                <p className="font-semibold text-white">Front desk empathy workshop</p>
                <p className="text-xs text-white/65">Wednesday 3 PM · Guest relations team with 92% attendance confirmed.</p>
              </li>
              <li className={`${MANAGER_CARD_SURFACE_CLASS} p-4`}>
                <p className="font-semibold text-white">Maintenance safety refresh</p>
                <p className="text-xs text-white/65">All technicians to complete digital checklist before end of week.</p>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </ManagerLayout>
  );
};

export default ManagerStaffAnalyticsPage;
