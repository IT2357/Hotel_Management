import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ManagerLayout, ManagerPageLoader, ManagerErrorState } from "@/components/manager";
import ReportFilters from "@/components/manager/reports/ReportFilters";
import KPICard from "@/components/manager/reports/KPICard";
import LineChartComponent from "@/components/manager/reports/LineChartComponent";
import BarChartComponent from "@/components/manager/reports/BarChartComponent";
import PieChartComponent from "@/components/manager/reports/PieChartComponent";
import { managerReportsAPI } from "@/services/managerReportsAPI";
import { Activity, DollarSign, PieChart as PieChartIcon, Timer, TrendingUp, Users } from "lucide-react";
import { MANAGER_CONTENT_CLASS, MANAGER_PAGE_CONTAINER_CLASS, MANAGER_SECTION_CLASS, MANAGER_RING_CLASS } from "./managerStyles";

const DAY_FORMAT_OPTIONS = { year: "numeric", month: "short", day: "numeric" };

const toDateInputValue = (date) => date.toISOString().split("T")[0];

const createDefaultFilters = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 89);

  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(end),
    period: "monthly",
    departments: [],
    channels: [],
    compare: false,
    comparePeriod: "previous",
  };
};

const DEFAULT_FILTERS = createDefaultFilters();

const buildTrendMeta = (change) => {
  if (change === null || change === undefined) return null;
  const direction = change > 0 ? "up" : change < 0 ? "down" : "flat";
  return { direction, percentage: Math.abs(change) };
};

const formatNumber = (value) => {
  if (!Number.isFinite(value)) return "0";
  return Number(value).toLocaleString();
};

const formatPercentage = (value) => {
  if (!Number.isFinite(value)) return "0%";
  return `${value.toFixed(1)}%`;
};

const ManagerReportsPage = () => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportData, setReportData] = useState(null);

  const handleMenuItemSelect = useCallback((item) => {
    if (item.id === "reports") return false;
    if (item.id === "dashboard" || item.id === "profile") return undefined;
    toast.info("Navigation coming soon", { description: `${item.label} is not available yet.`, duration: 2000 });
    return false;
  }, []);

  const fetchReports = useCallback(async (currentFilters) => {
    setIsLoading(true);
    setError("");
    try {
      const raw = await managerReportsAPI.getOverview({
        startDate: currentFilters.startDate,
        endDate: currentFilters.endDate,
        period: currentFilters.period,
        departments: currentFilters.departments,
      });
      const payload = raw?.data ?? raw;
      setReportData(payload);
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Unable to load manager reports";
      setError(message);
      toast.error("Unable to load manager reports", { description: message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports(filters);
  }, [fetchReports, filters]);

  const financialSummary = reportData?.financial?.summary;
  const financialCards = useMemo(() => {
    if (!financialSummary) return [];
    return [
      { title: "Total Revenue", value: financialSummary.totalRevenue, unit: "LKR", trend: buildTrendMeta(financialSummary.revenueChange), icon: DollarSign, iconColor: "#38bdf8" },
      { title: "Total Expenses", value: financialSummary.totalExpenses, unit: "LKR", trend: buildTrendMeta(financialSummary.expenseChange), icon: PieChartIcon, iconColor: "#f87171" },
      { title: "Net Profit", value: financialSummary.netProfit, unit: "LKR", trend: buildTrendMeta(financialSummary.profitChange), icon: TrendingUp, iconColor: "#22c55e" },
      { title: "Profit Margin", value: financialSummary.profitMargin, unit: "%", icon: Activity, iconColor: "#facc15" },
      { title: "Avg Daily Revenue", value: financialSummary.avgDailyRevenue, unit: "LKR", icon: Timer, iconColor: "#38bdf8" },
      { title: "Occupancy Rate", value: financialSummary.occupancyRate, unit: "%", icon: Users, iconColor: "#a855f7" },
    ];
  }, [financialSummary]);

  const staffSummary = reportData?.staff?.summary;
  const staffCards = useMemo(() => {
    if (!staffSummary) return [];
    return [
      { title: "Tasks Completed", value: staffSummary.completedTasks, icon: TrendingUp, iconColor: "#22c55e" },
      { title: "Tasks In Progress", value: staffSummary.tasksInProgress, icon: Activity, iconColor: "#38bdf8" },
      { title: "Completion Rate", value: staffSummary.completionRate, unit: "%", icon: PieChartIcon, iconColor: "#a855f7" },
      { title: "Avg Completion Time", value: staffSummary.averageCompletionTime, unit: "mins", icon: Timer, iconColor: "#facc15" },
      { title: "Quality Score", value: staffSummary.averageQualityScore, icon: DollarSign, iconColor: "#f97316" },
      { title: "Overdue Tasks", value: staffSummary.overdueTasks, icon: Activity, iconColor: "#f87171" },
    ];
  }, [staffSummary]);

  const revenueVsExpenseTrend = reportData?.financial?.revenueVsExpenseTrend ?? [];
  const expenseByCategory = reportData?.financial?.expenseByCategory ?? [];
  const paymentMethods = reportData?.financial?.paymentMethods ?? [];
  const departmentExpenses = reportData?.financial?.departmentExpenses ?? [];
  const departmentPerformance = reportData?.staff?.departmentPerformance ?? [];
  const staffStatusDistribution = reportData?.staff?.statusDistribution ?? [];
  const taskTrend = reportData?.staff?.taskTrend ?? [];
  const topPerformers = reportData?.staff?.topPerformers ?? [];

  const handleFiltersChange = useCallback((nextFilters) => setFilters(nextFilters), []);

  const renderContent = () => {
    if (isLoading && !reportData) return <ManagerPageLoader message="Loading reports..." fullPage={false} />;
    if (error && !reportData) {
      return (
        <div className="mt-10">
          <ManagerErrorState title="Unable to load reports" message="Please check your connection and try again." error={new Error(error)} onRetry={() => fetchReports(filters)} fullPage={false} showBackButton={false} />
        </div>
      );
    }

    return (
      <div className="space-y-10">
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,2.9fr)]">
          <div className={`${MANAGER_SECTION_CLASS} flex flex-col gap-6`}>
            <div>
              <h2 className="text-lg font-semibold text-white">Filter Insights</h2>
              <p className="text-sm text-white/60">Tune the reporting window, departments, and views to focus on what matters today.</p>
            </div>
            <ReportFilters onFiltersChange={handleFiltersChange} initialFilters={filters} showChannels={false} variant="manager" />
          </div>
          <div className={`${MANAGER_SECTION_CLASS} overflow-hidden`}>
            <div className="flex items-center justify-between pb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Financial Pulse</h2>
                <p className="text-sm text-white/60">Live revenue and cost signals from the selected period.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {financialCards.map((card) => (
                <KPICard key={card.title} {...card} variant="manager" />
              ))}
            </div>
          </div>
        </section>

  <section className={`${MANAGER_SECTION_CLASS} space-y-6`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white">Financial Trajectory</h2>
            <span className="text-xs uppercase tracking-[0.2em] text-white/60">Updated daily</span>
          </div>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <LineChartComponent
              data={revenueVsExpenseTrend.map((entry) => ({ ...entry, date: new Date(entry.date).toISOString() }))}
              xKey="date"
              lines={[{ key: "revenue", name: "Revenue", color: "#60a5fa" }, { key: "expenses", name: "Expenses", color: "#fb7185" }]}
              title="Revenue vs Expense Trend"
              height={320}
              variant="manager"
              className={MANAGER_RING_CLASS}
            />
            <BarChartComponent
              data={departmentExpenses.map((item) => ({ name: item.name, value: item.value }))}
              xKey="name"
              bars={[{ key: "value", name: "Expense" }]}
              title="Expense Breakdown by Department"
              height={320}
              variant="manager"
              className={MANAGER_RING_CLASS}
            />
          </div>
        </section>

        <section className={`${MANAGER_SECTION_CLASS} space-y-6`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white">Resource Allocation</h2>
            <span className="text-xs uppercase tracking-[0.2em] text-white/60">Spend & payment mix</span>
          </div>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <PieChartComponent
              data={expenseByCategory}
              dataKey="value"
              nameKey="name"
              title="Expense Distribution"
              height={320}
              showLabels={false}
              variant="manager"
              className={MANAGER_RING_CLASS}
            />
            <PieChartComponent
              data={paymentMethods}
              dataKey="value"
              nameKey="name"
              title="Payment Methods"
              height={320}
              showLabels={false}
              variant="manager"
              className={MANAGER_RING_CLASS}
            />
            <PieChartComponent
              data={staffStatusDistribution.map((item) => ({ name: item.status, value: item.count }))}
              dataKey="value"
              nameKey="name"
              title="Staff Task Status"
              height={320}
              showLabels={false}
              variant="manager"
              className={MANAGER_RING_CLASS}
            />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className={`${MANAGER_SECTION_CLASS} text-white`}>
            <h2 className="text-xl font-semibold text-white">Top Performing Staff</h2>
            <p className="mb-4 text-sm text-white/60">Ranked by completion rate within the selected period.</p>
            {topPerformers.length === 0 ? (
              <p className="text-sm text-white/60">No performance data available.</p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/5">
                <table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
                  <thead className="bg-white/5 text-white/70">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Staff Member</th>
                      <th className="px-4 py-2 text-left font-medium">Tasks</th>
                      <th className="px-4 py-2 text-left font-medium">Completed</th>
                      <th className="px-4 py-2 text-left font-medium">Completion</th>
                      <th className="px-4 py-2 text-left font-medium">Quality</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {topPerformers.map((performer) => (
                      <tr key={performer.staffId} className="transition-colors hover:bg-white/5">
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">{performer.name}</div>
                          <div className="text-xs text-white/60">{performer.role}</div>
                        </td>
                        <td className="px-4 py-3 text-white/80">{formatNumber(performer.totalTasks)}</td>
                        <td className="px-4 py-3 text-white/80">{formatNumber(performer.completedTasks)}</td>
                        <td className="px-4 py-3 text-amber-200">{formatPercentage(performer.completionRate)}</td>
                        <td className="px-4 py-3 text-emerald-200">{performer.avgQualityScore?.toFixed?.(1) ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className={`${MANAGER_SECTION_CLASS} text-white`}>
            <div className="mb-4 space-y-2">
              <h2 className="text-xl font-semibold text-white">Department Performance</h2>
              <p className="text-sm text-white/60">Task throughput and completion rates by department.</p>
            </div>
            <BarChartComponent
              data={departmentPerformance.map((dept) => ({ department: dept.department, completed: dept.completedTasks, total: dept.totalTasks }))}
              xKey="department"
              bars={[{ key: "completed", name: "Completed" }, { key: "total", name: "Total" }]}
              title="Department performance"
              height={320}
              variant="manager"
              className={MANAGER_RING_CLASS}
            />
          </div>
        </section>

        <section className={`${MANAGER_SECTION_CLASS} space-y-6`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white">Staff Task Flow</h2>
            <span className="text-xs uppercase tracking-[0.2em] text-white/60">Team velocity</span>
          </div>
          <LineChartComponent
            data={taskTrend.map((entry) => ({ ...entry, date: new Date(entry.date).toISOString() }))}
            xKey="date"
            lines={[{ key: "assigned", name: "Assigned", color: "#F97316" }, { key: "completed", name: "Completed", color: "#22C55E" }]}
            title="Task Flow"
            height={320}
            variant="manager"
            className={MANAGER_RING_CLASS}
          />
        </section>

        <section className={`${MANAGER_SECTION_CLASS}`}>
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-lg font-semibold text-white">Staff Pulse</h2>
            <span className="text-xs uppercase tracking-[0.2em] text-white/60">Team health overview</span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {staffCards.map((card) => (
              <KPICard key={card.title} {...card} size="small" variant="manager" />
            ))}
          </div>
        </section>
      </div>
    );
  };

  return (
    <ManagerLayout
      activeItem="reports"
      onMenuItemSelect={handleMenuItemSelect}
      contentClassName={`${MANAGER_CONTENT_CLASS} bg-gradient-to-br from-white/5 via-transparent to-white/0`}
    >
      <div className={`${MANAGER_PAGE_CONTAINER_CLASS} space-y-8`}>
        <header className={`${MANAGER_SECTION_CLASS} relative overflow-hidden p-8`}>
          <div className="pointer-events-none absolute -right-10 top-0 h-56 w-56 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 left-[-4rem] h-60 w-60 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="relative space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.28em] text-white/70">
              Insight Hub
            </span>
            <h1 className="text-3xl font-bold text-white md:text-4xl">Manager Reports</h1>
            <p className="max-w-2xl text-sm text-white/70">Financial performance and staff productivity insights tailored for rapid decision-making.</p>
            {reportData?.period && (
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/60">
                Reporting window: {new Date(reportData.period.start).toLocaleDateString(undefined, DAY_FORMAT_OPTIONS)} — {new Date(reportData.period.end).toLocaleDateString(undefined, DAY_FORMAT_OPTIONS)}
              </p>
            )}
          </div>
        </header>

        {renderContent()}
      </div>
    </ManagerLayout>
  );
};

export default ManagerReportsPage;
