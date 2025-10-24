import { motion } from "framer-motion";
import { useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import useAuth from "@/hooks/useAuth";
import { ManagerLayout } from "@/components/manager";
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
  TrendingUp,
} from "lucide-react";
import { MANAGER_CONTENT_CLASS, MANAGER_PAGE_CONTAINER_CLASS } from "./managerStyles";
import { useHomeData } from "./home/useHomeData";
import { formatLastUpdated, computeMetrics, buildInsights, buildNextActions, buildWorkforceSnapshot } from "./home/utils";
import { cx, STAT_CARD_CLASS, STAT_CARD_VARIANTS } from "./home/constants";
import {
  SummarySection,
  InsightsSection,
  ActionsSection,
  WorkforceSection,
  TrendsSection,
  TeamSection,
  SentimentSection,
} from "./home/DashboardSections";

/**
 * Manager Home Page (Dashboard Overview)
 * Main dashboard with operational insights, metrics, and team status
 * 
 * Note: This is a refactored version split into modular components for better maintainability.
 * Components are in the ./home/ directory.
 */
const ManagerHomePage = () => {
  const { user } = useAuth();
  const { stats, lastUpdated, isLoading, isRefreshing, handleRefresh } = useHomeData();

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

    if (
      item.id === "tasks" ||
      item.id === "staff" ||
      item.id === "feedback" ||
      item.id === "profile" ||
      item.id === "reports"
    ) {
      return undefined;
    }

    toast.info(`${item.label} is coming soon`, {
      description: "We're polishing the manager experience.",
      duration: 1800,
    });

    return false;
  }, []);

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

  const computedMetrics = useMemo(() => computeMetrics(snapshot), [snapshot]);
  const isDataLoading = isLoading && !stats;

  const summaryCards = useMemo(
    () => [
      { icon: ClipboardList, label: "Total Tasks", value: snapshot.totalTasks, iconColor: "#38bdf8" },
      { icon: Clock, label: "In Progress", value: snapshot.inProgress, iconColor: "#facc15" },
      { icon: CheckCircle2, label: "Completed", value: snapshot.completed, iconColor: "#22c55e" },
      {
        icon: Star,
        label: "Avg Rating",
        value: Number(snapshot.avgRating.toFixed ? snapshot.avgRating.toFixed(1) : snapshot.avgRating),
        iconColor: "#facc15",
        suffix: "/5",
      },
      { icon: Users, label: "Staff Online", value: snapshot.staffOnline, iconColor: "#22c55e" },
      { icon: AlertTriangle, label: "Backlog", value: computedMetrics.backlog, iconColor: "#f97316" },
      {
        icon: TrendingUp,
        label: "Completion",
        value: computedMetrics.completionRate,
        iconColor: "#38bdf8",
        suffix: "%",
      },
    ],
    [snapshot, computedMetrics]
  );

  const insights = useMemo(
    () => buildInsights(snapshot, computedMetrics, isDataLoading),
    [snapshot, computedMetrics, isDataLoading]
  );

  const nextActions = useMemo(
    () => buildNextActions(snapshot, computedMetrics, isDataLoading),
    [snapshot, computedMetrics, isDataLoading]
  );

  const workforceSnapshot = useMemo(
    () => buildWorkforceSnapshot(snapshot, computedMetrics, isDataLoading),
    [snapshot, computedMetrics, isDataLoading]
  );

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
        value: isDataLoading
          ? "—"
          : workforceSnapshot.online
          ? workforceSnapshot.coverage
          : "-",
      },
    ],
    [isDataLoading, workforceSnapshot]
  );

  const headerAccentChips = useMemo(
    () => [
      isDataLoading ? "Syncing metrics" : "Realtime overview",
      `Last sync ${formatLastUpdated(lastUpdated)}`,
      isDataLoading
        ? "Completion rate —"
        : `Completion rate ${computedMetrics.completionRate}%`,
    ],
    [computedMetrics.completionRate, lastUpdated, isDataLoading]
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
          actions={
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
                <RotateCw
                  className={`mr-2 h-4 w-4 ${isRefreshing || isLoading ? "animate-spin" : ""}`}
                />
                Refresh stats
              </Button>
            </>
          }
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
              {snapshot.avgRating
                ? `Guest sentiment ${snapshot.avgRating >= 4.5 ? "up" : "stable"}`
                : "No feedback captured"}
            </span>,
            <span key="peak" className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-300" />
              Peak check-in window 2-5 PM
            </span>,
          ]}
        />

        <SummarySection summaryCards={summaryCards} isDataLoading={isDataLoading} />

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid gap-6 xl:grid-cols-12"
        >
          <InsightsSection insights={insights} />
          <ActionsSection nextActions={nextActions} />
          <WorkforceSection
            workforceSnapshot={workforceSnapshot}
            isDataLoading={isDataLoading}
            formatLastUpdated={() => formatLastUpdated(lastUpdated)}
          />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-6 xl:grid-cols-12"
        >
          <TrendsSection
            trendQuickStats={trendQuickStats}
            cx={cx}
            STAT_CARD_CLASS={STAT_CARD_CLASS}
            STAT_CARD_VARIANTS={STAT_CARD_VARIANTS}
          />

          <div className="space-y-6 xl:col-span-5">
            <TeamSection teamPulseStats={teamPulseStats} />
            <SentimentSection sentimentSummary={sentimentSummary} />
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
