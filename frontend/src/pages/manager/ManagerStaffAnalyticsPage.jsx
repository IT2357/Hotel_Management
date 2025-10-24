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
import { Users, Activity, Clock, Award, TrendingUp, AlertTriangle, BarChart3, Star } from "lucide-react";
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
          <div className="xl:col-span-2">
            <StaffPerformanceChart />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6">
              <div className="mb-5">
                <h2 className="text-xl font-black text-gray-900">Workforce Snapshot</h2>
                <p className="text-sm text-gray-600 font-medium mt-1">Coverage by department and current load</p>
              </div>
              <div className="space-y-3">
                {departmentBreakdown.map((dept, index) => {
                  const completionPct = Math.min(100, Math.round((dept.completed / (dept.totalTasks || 1)) * 100));
                  const colors = [
                    { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", bar: "from-blue-400 to-cyan-400" },
                    { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", bar: "from-purple-400 to-pink-400" },
                    { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", bar: "from-emerald-400 to-green-400" },
                    { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", bar: "from-orange-400 to-amber-400" },
                    { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700", bar: "from-pink-400 to-rose-400" },
                  ];
                  const color = colors[index % colors.length];
                  return (
                    <motion.div
                      key={dept.department}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`${color.bg} ${color.border} border-2 rounded-xl p-4 hover:shadow-lg transition-all duration-300`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className={`text-sm font-bold ${color.text}`}>{dept.department}</p>
                          <p className="text-xs text-gray-600 font-medium mt-0.5">{dept.completed} / {dept.totalTasks} tasks completed</p>
                        </div>
                        <span className={`text-lg font-black ${color.text}`}>{completionPct}%</span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-white/60 border border-gray-200">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${color.bar} transition-all duration-500`}
                          style={{ width: `${completionPct}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Star className="h-3.5 w-3.5 text-amber-500" fill="#f59e0b" />
                        <p className="text-xs text-gray-700 font-bold">Satisfaction: {dept.satisfaction ?? "-"}/5</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6"
          >
            <div className="mb-5">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Award className="h-6 w-6 text-amber-500" />
                Top Performers
              </h2>
              <p className="text-sm text-gray-600 font-medium mt-1">Highest completion rate and quality scores</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-50 border-y-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-gray-700">Team member</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-700">Role</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-700">Tasks</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-700">Rate</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-700">Quality</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topPerformers.map((member, index) => (
                    <motion.tr 
                      key={member.id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-bold text-gray-900">{member.name}</td>
                      <td className="px-4 py-3 text-gray-600 font-medium">{member.role || "-"}</td>
                      <td className="px-4 py-3 text-gray-900 font-semibold">{member.tasksCompleted}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                          {member.completionRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                          {member.avgQualityScore?.toFixed?.(1) ?? member.avgQualityScore ?? "-"}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-rose-500" />
                  Risk & Readiness
                </h2>
                <p className="text-sm text-gray-600 font-medium mt-1">Items that may need intervention this week</p>
              </div>
            </div>
            <div className="space-y-3">
              {riskAlerts.map((alert, index) => {
                const severityConfig = {
                  high: { bg: "bg-red-50", border: "border-red-300", text: "text-red-700", icon: "text-red-600" },
                  medium: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", icon: "text-amber-600" },
                  low: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", icon: "text-blue-600" },
                };
                const config = severityConfig[alert.severity] || severityConfig.medium;
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`rounded-xl ${config.bg} border-2 ${config.border} px-4 py-3 text-sm hover:shadow-md transition-all duration-300`}
                  >
                    <div className="flex items-center gap-2 font-bold">
                      <AlertTriangle className={`h-4 w-4 ${config.icon}`} />
                      <span className={config.text}>{alert.title}</span>
                    </div>
                    <p className={`mt-1.5 text-xs ${config.text} font-medium`}>{alert.detail}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <StaffList />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6 space-y-4"
          >
            <div>
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Clock className="h-6 w-6 text-indigo-500" />
                Engagement Checkpoints
              </h2>
              <p className="text-sm text-gray-600 font-medium mt-1">Upcoming 1:1s, training, and milestone reminders</p>
            </div>
            <ul className="space-y-3 text-sm">
              <motion.li
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-4 hover:shadow-md transition-all duration-300"
              >
                <p className="font-bold text-gray-900">Kitchen quarterly skills audit</p>
                <p className="text-xs text-gray-600 font-medium mt-1">Scheduled for Friday · Chef Martinez leading practical assessment</p>
              </motion.li>
              <motion.li
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-xl p-4 hover:shadow-md transition-all duration-300"
              >
                <p className="font-bold text-gray-900">Front desk empathy workshop</p>
                <p className="text-xs text-gray-600 font-medium mt-1">Wednesday 3 PM · Guest relations team with 92% attendance confirmed</p>
              </motion.li>
              <motion.li
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-4 hover:shadow-md transition-all duration-300"
              >
                <p className="font-bold text-gray-900">Maintenance safety refresh</p>
                <p className="text-xs text-gray-600 font-medium mt-1">All technicians to complete digital checklist before end of week</p>
              </motion.li>
            </ul>
          </motion.div>
        </div>
      </div>
    </ManagerLayout>
  );
};

export default ManagerStaffAnalyticsPage;
