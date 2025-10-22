import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import useAuth from "@/hooks/useAuth";
import { taskAPI } from "@/services/taskManagementAPI";
import { ManagerLayout } from "@/components/manager";
import { SummaryCards } from "@/components/manager/SummaryCards";
import { StaffPerformanceChart } from "@/components/manager/StaffPerformanceChart";
import { StaffList } from "@/components/manager/StaffList";
import { FeedbackSummary } from "@/components/manager/FeedbackSummary";
import { Button } from "@/components/manager/ManagerButton";
import ManagerPageHeader from "@/components/manager/ManagerPageHeader";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  Star,
  Users,
  RotateCw,
  AlertTriangle,
  Activity,
  Gauge,
  TrendingUp,
} from "lucide-react";
import { MANAGER_CONTENT_CLASS, MANAGER_PAGE_CONTAINER_CLASS, MANAGER_SECTION_CLASS } from "./managerStyles";

const cx = (...classes) => classes.filter(Boolean).join(" ");

const SECTION_BASE_CLASS = `${MANAGER_SECTION_CLASS}`;
const SECTION_VARIANTS = {
  insights: "bg-gradient-to-br from-white to-amber-50 border-amber-200",
  actions: "bg-gradient-to-br from-white to-emerald-50 border-emerald-200",
  workforce: "bg-gradient-to-br from-white to-teal-50 border-teal-200",
  trends: "bg-gradient-to-br from-white to-blue-50 border-blue-200",
  team: "bg-gradient-to-br from-white to-purple-50 border-purple-200",
  sentiment: "bg-gradient-to-br from-white to-cyan-50 border-cyan-200",
};

const SECTION_GLOW = {
  insights: "bg-amber-100/50",
  actions: "bg-emerald-100/50",
  workforce: "bg-teal-100/50",
  trends: "bg-blue-100/50",
  team: "bg-purple-100/50",
  sentiment: "bg-cyan-100/50",
};

const SectionCard = ({ variant, className = "", children }) => (
  <div className={cx(SECTION_BASE_CLASS, SECTION_VARIANTS[variant], "relative overflow-hidden", className)}>
    <div className={cx("pointer-events-none absolute inset-0 opacity-20 blur-2xl", SECTION_GLOW[variant])} />
    <div className="relative z-10">{children}</div>
  </div>
);

const STAT_CARD_CLASS = "rounded-xl border p-5 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1 backdrop-blur-sm";
const STAT_CARD_VARIANTS = {
  neutral: "border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:border-gray-300",
  actions: "border-emerald-200 bg-gradient-to-br from-white to-emerald-50 hover:border-emerald-300",
  workforce: "border-teal-200 bg-gradient-to-br from-white to-teal-50 hover:border-teal-300",
  trends: "border-blue-200 bg-gradient-to-br from-white to-blue-50 hover:border-blue-300",
  team: "border-purple-200 bg-gradient-to-br from-white to-purple-50 hover:border-purple-300",
  sentiment: "border-cyan-200 bg-gradient-to-br from-white to-cyan-50 hover:border-cyan-300",
};

const ManagerHomePage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSidebarToggle = useCallback((isCollapsed) => {
    toast.info(isCollapsed ? "Sidebar collapsed" : "Sidebar expanded", {
      duration: 1500,
    });
  }, []);

  const handleMenuItemSelect = useCallback((item) => {
    if (item.id === "dashboard") {
      toast.success("You're already viewing the overview", {
        duration: 1500,
      });
      return false;
    }

    if (item.id === "tasks" || item.id === "staff" || item.id === "feedback" || item.id === "profile" || item.id === "reports") {
      return undefined;
    }

    toast.info(`${item.label} is coming soon`, {
      description: "We're polishing the manager experience.",
      duration: 1800,
    });

    return false;
  }, []);

  const loadTaskStats = useCallback(async (trackLoading = false) => {
    if (trackLoading) {
      setIsLoading(true);
    }
    try {
      const data = await taskAPI.getTaskStats();
      const payload = data?.data || data;
      if (!payload) return;

      const overview = payload.overview || payload;

      setStats({
        totalTasks: overview.totalTasks ?? overview.total ?? 0,
        inProgress: overview.inProgressTasks ?? overview.inProgress ?? overview.active ?? 0,
        completed: overview.completedTasks ?? overview.completed ?? overview.done ?? 0,
        avgRating: Number(overview.averageRating ?? overview.feedbackScore ?? 0) || 0,
        staffOnline: Number(payload.staffOnline ?? payload.activeStaff ?? 0) || 0,
      });
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to load task stats", error);
      toast.error("Unable to refresh dashboard metrics", {
        description: "Please check your connection or try again shortly.",
      });
    } finally {
      if (trackLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadTaskStats();
    } finally {
      setIsRefreshing(false);
    }
  }, [loadTaskStats]);

  useEffect(() => {
    loadTaskStats(true);
  }, [loadTaskStats]);

  const displayName = useMemo(
    () =>
      user?.fullName ||
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      user?.name ||
      user?.email ||
      "Manager",
    [user]
  );

  const snapshot = useMemo(
    () =>
      stats || {
        totalTasks: 0,
        inProgress: 0,
        completed: 0,
        avgRating: 0,
        staffOnline: 0,
      },
    [stats]
  );

  const computedMetrics = useMemo(() => {
    const backlog = Math.max(snapshot.totalTasks - snapshot.inProgress - snapshot.completed, 0);
    const completionRate = snapshot.totalTasks
      ? Math.round((snapshot.completed / snapshot.totalTasks) * 100)
      : 0;
    const ratingStatus = snapshot.avgRating >= 4.6 ? "Excellent" : snapshot.avgRating >= 4 ? "Good" : "Needs attention";
    const capacityRatio = snapshot.staffOnline
      ? Number(((snapshot.inProgress + backlog) / snapshot.staffOnline).toFixed(1))
      : snapshot.inProgress + backlog;

    return {
      backlog,
      completionRate,
      ratingStatus,
      capacityRatio,
    };
  }, [snapshot]);

  const isDataLoading = isLoading && !stats;

  const summaryCards = useMemo(
    () => [
      { icon: ClipboardList, label: "Total Tasks", value: snapshot.totalTasks, iconColor: "#38bdf8" },
      { icon: Clock, label: "In Progress", value: snapshot.inProgress, iconColor: "#facc15" },
      { icon: CheckCircle2, label: "Completed", value: snapshot.completed, iconColor: "#22c55e" },
      { icon: Star, label: "Avg Rating", value: Number(snapshot.avgRating.toFixed ? snapshot.avgRating.toFixed(1) : snapshot.avgRating), iconColor: "#facc15", suffix: "/5" },
      { icon: Users, label: "Staff Online", value: snapshot.staffOnline, iconColor: "#22c55e" },
      { icon: AlertTriangle, label: "Backlog", value: computedMetrics.backlog, iconColor: "#f97316" },
      { icon: TrendingUp, label: "Completion", value: computedMetrics.completionRate, iconColor: "#38bdf8", suffix: "%" },
    ],
    [snapshot, computedMetrics]
  );

  const formatLastUpdated = useCallback(() => {
    if (!lastUpdated) return "Awaiting first sync";

    const diffMs = Date.now() - lastUpdated.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return "Just refreshed";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? "s" : ""} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  }, [lastUpdated]);

  const insights = useMemo(() => {
    if (isDataLoading) {
      return [
        {
          label: "Sync in progress",
          value: "—",
          intent: "neutral",
          message: "Fetching the latest metrics from task and feedback services.",
        },
      ];
    }

    const items = [];
    const noTasksScheduled = snapshot.totalTasks === 0;

    items.push({
      label: "Completion rate",
      value: `${computedMetrics.completionRate}%`,
      intent: noTasksScheduled
        ? "neutral"
        : computedMetrics.completionRate >= 75
          ? "positive"
          : computedMetrics.completionRate >= 55
            ? "neutral"
            : "warning",
      message: noTasksScheduled
        ? "No tasks scheduled for the current window. Monitor upcoming check-ins."
        : computedMetrics.completionRate >= 75
          ? "Teams are closing tasks on schedule."
          : "Boost task closures to stay on target for the week.",
    });

    items.push({
      label: "Active backlog",
      value: computedMetrics.backlog,
      intent: computedMetrics.backlog <= 5 ? "positive" : computedMetrics.backlog <= 12 ? "neutral" : "warning",
      message:
        computedMetrics.backlog === 0
          ? "No pending work is waiting to be picked up."
          : `Assign or reprioritize ${computedMetrics.backlog} tasks to keep flow steady.`,
    });


    const hasRating = Number.isFinite(snapshot.avgRating) && snapshot.avgRating > 0;

    items.push({
      label: "Guest satisfaction",
      value: hasRating ? `${snapshot.avgRating.toFixed(1)}/5` : "No data",
      intent: !hasRating
        ? "neutral"
        : snapshot.avgRating >= 4.6
          ? "positive"
          : snapshot.avgRating >= 4
            ? "neutral"
            : "warning",
      message: !hasRating
        ? "No feedback captured yet — remind the front desk to share the quick survey link."
        : computedMetrics.ratingStatus === "Excellent"
          ? "Guests are consistently rating their experience highly."
          : "Review recent feedback to spot improvement opportunities.",
    });

    return items;
  }, [computedMetrics, snapshot.avgRating, snapshot.totalTasks, isDataLoading]);

  const nextActions = useMemo(() => {
    const actions = [];

    if (isDataLoading) {
      actions.push({
        title: "Syncing metrics",
        description: "Hang tight while we load the most recent tasks and staffing data.",
        priority: "Low",
      });
      return actions;
    }

    if (snapshot.totalTasks === 0) {
      actions.push({
        title: "Awaiting task intake",
        description: "No work items logged yet today. Confirm pipeline sync with front desk and housekeeping leads.",
        priority: "Low",
      });
      return actions;
    }

    if (computedMetrics.backlog > 0) {
      actions.push({
        title: "Rebalance workload",
        description: `Distribute ${computedMetrics.backlog} backlog task${computedMetrics.backlog > 1 ? "s" : ""} across the afternoon shift.`,
        priority: computedMetrics.backlog >= 10 ? "High" : "Medium",
      });
    }

    if (computedMetrics.completionRate < 70) {
      actions.push({
        title: "Schedule stand-up",
        description: "Do a quick sync with supervisors to unblock delayed service tickets.",
        priority: "Medium",
      });
    }

    if (snapshot.avgRating && snapshot.avgRating < 4.2) {
      actions.push({
        title: "Audit guest feedback",
        description: "Scan the lowest-rated stays this week and log corrective follow-ups.",
        priority: "High",
      });
    }

    if (!actions.length) {
      actions.push({
        title: "Great job",
        description: "No pressing actions right now. Keep monitoring task inflow every 30 minutes.",
        priority: "Low",
      });
    }

    return actions;
  }, [computedMetrics, isDataLoading, snapshot.avgRating, snapshot.totalTasks]);

  const workforceSnapshot = useMemo(() => {
    if (isDataLoading) {
      return {
        online: 0,
        workload: 0,
        coverage: 0,
        status: "Syncing the latest staffing snapshot...",
      };
    }

    const online = snapshot.staffOnline;
    const workload = snapshot.inProgress + computedMetrics.backlog;
    const coverage = online ? Math.round((snapshot.inProgress / online) * 10) / 10 : 0;

    return {
      online,
      workload,
      coverage,
      status:
        !online
          ? "No team members online"
          : workload === 0
            ? "Team is free — expect inflow from upcoming reservations."
            : coverage <= 1.5
              ? "Capacity is healthy"
              : coverage <= 2.5
                ? "Monitor for overload"
                : "High load — consider assigning backup",
    };
  }, [snapshot, computedMetrics.backlog, isDataLoading]);

  const teamPulseStats = useMemo(
    () => [
      {
        label: "Online staff",
        value: isDataLoading ? "—" : workforceSnapshot.online,
      },
      {
        label: "Workload",
        value: isDataLoading ? "—" : workforceSnapshot.workload,
      },
      {
        label: "Tasks per staff",
        value: isDataLoading ? "—" : workforceSnapshot.online ? workforceSnapshot.coverage : "-",
      },
    ],
    [isDataLoading, workforceSnapshot]
  );

  const headerAccentChips = useMemo(
    () => [
      isDataLoading ? "Syncing metrics" : "Realtime overview",
      `Last sync ${formatLastUpdated()}`,
      isDataLoading ? "Completion rate —" : `Completion rate ${computedMetrics.completionRate}%`,
    ],
    [computedMetrics.completionRate, formatLastUpdated, isDataLoading]
  );

  const trendQuickStats = useMemo(
    () => [
      {
        label: "Completion",
        value: isDataLoading ? "—" : `${computedMetrics.completionRate}%`,
        tone: isDataLoading
          ? "text-gray-400"
          : computedMetrics.completionRate >= 70
            ? "text-emerald-600"
            : "text-amber-600",
      },
      {
        label: "Backlog",
        value: isDataLoading ? "—" : computedMetrics.backlog,
        tone: isDataLoading
          ? "text-gray-400"
          : computedMetrics.backlog <= 5
            ? "text-emerald-600"
            : "text-amber-600",
      },
      {
        label: "Active tasks",
        value: isDataLoading ? "—" : snapshot.inProgress,
        tone: isDataLoading ? "text-gray-400" : "text-sky-600",
      },
    ],
    [computedMetrics.backlog, computedMetrics.completionRate, isDataLoading, snapshot.inProgress]
  );

  const sentimentSummary = useMemo(
    () => ({
      rating: isDataLoading
        ? "—"
        : snapshot.avgRating
          ? `${snapshot.avgRating.toFixed(1)}/5`
          : "No feedback",
      status: isDataLoading
        ? "Syncing survey results"
        : snapshot.avgRating >= 4.6
          ? "Guests are delighted — keep up the consistency."
          : snapshot.avgRating >= 4
            ? "Sentiment is steady — watch for dip triggers."
            : snapshot.avgRating
              ? "Sentiment trending low — review flagged stays today."
              : "Encourage the team to collect fresh feedback.",
    }),
    [isDataLoading, snapshot.avgRating]
  );

  return (
    <ManagerLayout
      activeItem="dashboard"
      onSidebarToggle={handleSidebarToggle}
      onMenuItemSelect={handleMenuItemSelect}
      contentClassName={MANAGER_CONTENT_CLASS}
    >
      <div className={`${MANAGER_PAGE_CONTAINER_CLASS} space-y-6`}>
        <ManagerPageHeader
          title="Dashboard Overview"
          subtitle={`Welcome back, ${displayName}! Here is your latest operational snapshot.`}
          accentChips={headerAccentChips}
          actions={(
            <>
              <Button
                asChild
                className="bg-gradient-to-r from-teal-600 to-teal-700 text-white font-bold shadow-md transition-all duration-300 hover:shadow-lg hover:from-teal-700 hover:to-teal-800"
              >
                <Link to="/manager/tasks">Go to Task Manager</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-2 border-teal-200 bg-white text-teal-700 font-semibold shadow-sm transition-all duration-300 hover:bg-teal-50 hover:border-teal-300"
              >
                <Link to="/manager/staff">View Staff Analytics</Link>
              </Button>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
                className="border-2 border-gray-200 bg-white text-gray-700 font-semibold shadow-sm transition-all duration-300 hover:bg-gray-50 hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCw className={`mr-2 h-4 w-4 ${isRefreshing || isLoading ? "animate-spin" : ""}`} />
                Refresh stats
              </Button>
            </>
          )}
          footerChips={[
            <span key="roster" className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {isDataLoading
                ? "Sync pending — checking roster"
                : workforceSnapshot.online
                  ? `Roster synced – ${workforceSnapshot.online} online`
                  : "Awaiting roster sync"}
            </span>,
            <span key="sentiment" className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              {snapshot.avgRating ? `Guest sentiment ${snapshot.avgRating >= 4.5 ? "up" : "stable"}` : "No feedback captured"}
            </span>,
            <span key="peak" className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-300" />
              Peak check-in window 2-5 PM
            </span>,
          ]}
        />

        <div className={isDataLoading ? "animate-pulse" : ""}>
          <SummaryCards cards={summaryCards} />
        </div>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid gap-6 xl:grid-cols-12"
        >
          <SectionCard variant="insights" className="xl:col-span-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-extrabold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Operational insights</h3>
                <p className="text-sm text-gray-600 font-medium">Key signals refreshed automatically.</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 shadow-sm">
                <Gauge className="h-6 w-6 text-amber-700" />
              </div>
            </div>
            <ul className="mt-5 space-y-4">
              {insights.map((insight) => (
                <li
                  key={insight.label}
                  className={cx(STAT_CARD_CLASS, STAT_CARD_VARIANTS.neutral)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{insight.label}</span>
                    <span
                      className={`text-sm font-semibold ${
                        insight.intent === "positive"
                          ? "text-emerald-600"
                          : insight.intent === "warning"
                            ? "text-amber-600"
                            : "text-teal-600"
                      }`}
                    >
                      {insight.value}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">{insight.message}</p>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard variant="actions" className="xl:col-span-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-extrabold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Next best actions</h3>
                <p className="text-sm text-gray-600 font-medium">Focus the team on the highest impact tasks.</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-100 to-green-100 shadow-sm">
                <Activity className="h-6 w-6 text-emerald-700" />
              </div>
            </div>
            <ul className="mt-5 space-y-4">
              {nextActions.map((action) => (
                <li
                  key={action.title}
                  className={cx(STAT_CARD_CLASS, STAT_CARD_VARIANTS.actions)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">{action.title}</span>
                    <span className="text-xs font-medium uppercase tracking-wide text-gray-600">
                      {action.priority} priority
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">{action.description}</p>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard variant="workforce" className="xl:col-span-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-extrabold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">Workforce load</h3>
                <p className="text-sm text-gray-600 font-medium">Live coverage versus active work items.</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100 shadow-sm">
                <TrendingUp className="h-6 w-6 text-teal-700" />
              </div>
            </div>

            <dl className="mt-5 space-y-4 text-sm text-gray-900">
              <div className={cx(STAT_CARD_CLASS, STAT_CARD_VARIANTS.workforce, "flex items-center justify-between")}>
                <dt className="text-gray-600">Team online</dt>
                <dd className="font-semibold">{isDataLoading ? "—" : workforceSnapshot.online}</dd>
              </div>
              <div className={cx(STAT_CARD_CLASS, STAT_CARD_VARIANTS.workforce, "flex items-center justify-between")}>
                <dt className="text-gray-600">Active load</dt>
                <dd className="font-semibold">{isDataLoading ? "—" : workforceSnapshot.workload}</dd>
              </div>
              <div className={cx(STAT_CARD_CLASS, STAT_CARD_VARIANTS.workforce, "flex items-center justify-between")}>
                <dt className="text-gray-600">Tasks per team member</dt>
                <dd className="font-semibold">{isDataLoading ? "—" : workforceSnapshot.online ? workforceSnapshot.coverage : "-"}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-gray-500">{isDataLoading ? "Syncing the latest metrics..." : workforceSnapshot.status}</p>
            <p className="mt-2 text-xs text-gray-400">Last sync: {formatLastUpdated()}</p>
          </SectionCard>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-6 xl:grid-cols-12"
        >
          <SectionCard variant="trends" className="xl:col-span-7">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Performance Trends</h3>
                <p className="text-sm text-gray-600 font-medium">Track staff efficiency, response times, and service quality.</p>
              </div>
              <Button
                asChild
                variant="ghost"
                className="text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl px-4 py-2"
              >
                <Link to="/manager/reports">Open detailed reports</Link>
              </Button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {trendQuickStats.map((item) => (
                <div
                  key={item.label}
                  className={cx(STAT_CARD_CLASS, STAT_CARD_VARIANTS.trends)}
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-600">{item.label}</p>
                  <p className={`mt-2 text-lg font-semibold ${item.tone}`}>{item.value}</p>
                </div>
              ))}
            </div>
            <div className={cx("mt-6 rounded-2xl border p-4", STAT_CARD_VARIANTS.trends)}>
              <StaffPerformanceChart />
            </div>
          </SectionCard>

          <div className="space-y-6 xl:col-span-5">
            <SectionCard variant="team">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Team Pulse</h3>
                <Button
                  asChild
                  variant="ghost"
                  className="text-sm font-bold text-purple-600 hover:bg-purple-50 rounded-xl px-4 py-2"
                >
                  <Link to="/manager/profile">View roster</Link>
                </Button>
              </div>
              <p className="text-sm text-gray-600 font-medium">Top performers and availability based on real-time updates.</p>
              <dl className="mt-5 grid gap-4 sm:grid-cols-3">
                {teamPulseStats.map((stat) => (
                  <div key={stat.label} className={cx(STAT_CARD_CLASS, STAT_CARD_VARIANTS.team)}
                  >
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-600">{stat.label}</dt>
                    <dd className="mt-2 text-lg font-semibold text-gray-900">{stat.value}</dd>
                  </div>
                ))}
              </dl>
              <div className={cx("mt-6 rounded-2xl border p-4", STAT_CARD_VARIANTS.team)}>
                <StaffList />
              </div>
            </SectionCard>

            <SectionCard variant="sentiment">
              <h3 className="text-2xl font-extrabold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">Guest Sentiment</h3>
              <p className="text-sm text-gray-600 font-medium">Highlights from the latest service reviews and feedback.</p>
              <div className={cx(STAT_CARD_CLASS, STAT_CARD_VARIANTS.sentiment, "mt-5")}
              >
                <p className="text-xs font-medium uppercase tracking-wide text-gray-600">Current rating</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{sentimentSummary.rating}</p>
                <p className="mt-3 text-sm text-gray-500">{sentimentSummary.status}</p>
              </div>
              <div className={cx("mt-6 rounded-2xl border p-4", STAT_CARD_VARIANTS.sentiment)}>
                <FeedbackSummary />
              </div>
            </SectionCard>
          </div>
        </motion.section>

        <footer className="mt-12 border-t border-gray-200 py-6 text-center">
          <p className="text-sm text-gray-500">
            © 2025 Royal Palm Hotel Task Management System — All Rights Reserved
          </p>
        </footer>
      </div>
    </ManagerLayout>
  );
};

export default ManagerHomePage;
