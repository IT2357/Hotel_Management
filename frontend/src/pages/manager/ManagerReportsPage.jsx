import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ManagerNavbar } from "@/components/manager/ManagerNavbar";
import { Sidebar } from "@/components/manager/Sidebar";
import { ManagerPageLoader, ManagerErrorState } from "@/components/manager";
import ReportFilters from "@/components/manager/reports/ReportFilters";
import KPICard from "@/components/manager/reports/KPICard";
import LineChartComponent from "@/components/manager/reports/LineChartComponent";
import BarChartComponent from "@/components/manager/reports/BarChartComponent";
import PieChartComponent from "@/components/manager/reports/PieChartComponent";
import { managerReportsAPI } from "@/services/managerReportsAPI";
import {
  Activity,
  DollarSign,
  PieChart as PieChartIcon,
  Timer,
  TrendingUp,
  Users,
} from "lucide-react";

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
  if (change === null || change === undefined) {
    return null;
  }

  const direction = change > 0 ? "up" : change < 0 ? "down" : "flat";
  return {
    direction,
    percentage: Math.abs(change),
  };
};

const formatNumber = (value) => {
  if (!Number.isFinite(value)) {
    return "0";
  }
  return Number(value).toLocaleString();
};

const formatPercentage = (value) => {
  if (!Number.isFinite(value)) {
    return "0%";
  }
  return `${value.toFixed(1)}%`;
};

const ManagerReportsPage = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("reports");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportData, setReportData] = useState(null);

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const handleMenuItemClick = useCallback(
    (item) => {
      setActiveMenuItem(item.id);

      switch (item.id) {
        case "dashboard":
          navigate("/manager");
          break;
        case "profile":
          navigate("/manager/profile");
          break;
        case "reports":
          break;
        default:
          toast.info("Navigation coming soon", {
            description: `${item.label} is not available yet.`,
            duration: 2000,
          });
      }
    },
    [navigate]
  );

  const fetchReports = useCallback(
    async (currentFilters) => {
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
        const message =
          err?.response?.data?.message || err?.message || "Unable to load manager reports";
        setError(message);
        toast.error("Unable to load manager reports", {
          description: message,
        });
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchReports(filters);
  }, [fetchReports, filters]);

  const financialSummary = reportData?.financial?.summary;
  const financialCards = useMemo(() => {
    if (!financialSummary) {
      return [];
    }

    return [
      {
        title: "Total Revenue",
        value: financialSummary.totalRevenue,
        unit: "LKR",
        trend: buildTrendMeta(financialSummary.revenueChange),
        icon: DollarSign,
        iconColor: "#38bdf8",
      },
      {
        title: "Total Expenses",
        value: financialSummary.totalExpenses,
        unit: "LKR",
        trend: buildTrendMeta(financialSummary.expenseChange),
        icon: PieChartIcon,
        iconColor: "#f87171",
      },
      {
        title: "Net Profit",
        value: financialSummary.netProfit,
        unit: "LKR",
        trend: buildTrendMeta(financialSummary.profitChange),
        icon: TrendingUp,
        iconColor: "#22c55e",
      },
      {
        title: "Profit Margin",
        value: financialSummary.profitMargin,
        unit: "%",
        icon: Activity,
        iconColor: "#facc15",
      },
      {
        title: "Avg Daily Revenue",
        value: financialSummary.avgDailyRevenue,
        unit: "LKR",
        icon: Timer,
        iconColor: "#38bdf8",
      },
      {
        title: "Occupancy Rate",
        value: financialSummary.occupancyRate,
        unit: "%",
        icon: Users,
        iconColor: "#a855f7",
      },
    ];
  }, [financialSummary]);

  const staffSummary = reportData?.staff?.summary;
  const staffCards = useMemo(() => {
    if (!staffSummary) {
      return [];
    }

    return [
      {
        title: "Tasks Completed",
        value: staffSummary.completedTasks,
        icon: TrendingUp,
        iconColor: "#22c55e",
      },
      {
        title: "Tasks In Progress",
        value: staffSummary.tasksInProgress,
        icon: Activity,
        iconColor: "#38bdf8",
      },
      {
        title: "Completion Rate",
        value: staffSummary.completionRate,
        unit: "%",
        icon: PieChartIcon,
        iconColor: "#a855f7",
      },
      {
        title: "Avg Completion Time",
        value: staffSummary.averageCompletionTime,
        unit: "mins",
        icon: Timer,
        iconColor: "#facc15",
      },
      {
        title: "Quality Score",
        value: staffSummary.averageQualityScore,
        icon: DollarSign,
        iconColor: "#f97316",
      },
      {
        title: "Overdue Tasks",
        value: staffSummary.overdueTasks,
        icon: Activity,
        iconColor: "#f87171",
      },
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

  const handleFiltersChange = useCallback((nextFilters) => {
    setFilters(nextFilters);
  }, []);

  const renderContent = () => {
    if (isLoading && !reportData) {
      return <ManagerPageLoader message="Loading reports..." fullPage={false} />;
    }

    if (error && !reportData) {
      return (
        <div className="mt-10">
          <ManagerErrorState
            title="Unable to load reports"
            message="Please check your connection and try again."
            error={new Error(error)}
            onRetry={() => fetchReports(filters)}
            fullPage={false}
            showBackButton={false}
          />
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          <div className="xl:col-span-1">
            <ReportFilters
              onFiltersChange={handleFiltersChange}
              initialFilters={filters}
              showChannels={false}
              variant="manager"
            />
          </div>
          <div className="xl:col-span-3">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {financialCards.map((card) => (
                <KPICard key={card.title} {...card} variant="manager" />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <LineChartComponent
            data={revenueVsExpenseTrend.map((entry) => ({
              ...entry,
              date: new Date(entry.date).toISOString(),
            }))}
            xKey="date"
            lines={[
              { key: "revenue", name: "Revenue", color: "#2563EB" },
              { key: "expenses", name: "Expenses", color: "#EF4444" },
            ]}
            title="Revenue vs Expense Trend"
            height={320}
            variant="manager"
          />
          <BarChartComponent
            data={departmentExpenses.map((item) => ({
              name: item.name,
              value: item.value,
            }))}
            xKey="name"
            bars={[{ key: "value", name: "Expense" }]}
            title="Expense Breakdown by Department"
            height={320}
            variant="manager"
          />
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
          />
          <PieChartComponent
            data={paymentMethods}
            dataKey="value"
            nameKey="name"
            title="Payment Methods"
            height={320}
            showLabels={false}
            variant="manager"
          />
          <PieChartComponent
            data={staffStatusDistribution.map((item) => ({
              name: item.status,
              value: item.count,
            }))}
            dataKey="value"
            nameKey="name"
            title="Staff Task Status"
            height={320}
            showLabels={false}
            variant="manager"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-[#162a52] bg-[#0e1f42] p-6 shadow-[0_18px_40px_rgba(8,14,29,0.55)] backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-[#f5f7ff]">Top Performing Staff</h2>
            <p className="text-sm text-[#8ba3d0] mb-4">
              Ranked by completion rate within the selected period.
            </p>
            {topPerformers.length === 0 ? (
              <p className="text-sm text-[#8ba3d0]">No performance data available.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-[#102a58] text-[#8ba3d0]">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Staff Member</th>
                      <th className="px-4 py-2 text-left font-medium">Tasks</th>
                      <th className="px-4 py-2 text-left font-medium">Completed</th>
                      <th className="px-4 py-2 text-left font-medium">Completion</th>
                      <th className="px-4 py-2 text-left font-medium">Quality</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#162a52]/60">
                    {topPerformers.map((performer) => (
                      <tr key={performer.staffId} className="transition-colors hover:bg-[#142a55]/80">
                        <td className="px-4 py-3">
                          <div className="font-medium text-[#f5f7ff]">
                            {performer.name}
                          </div>
                          <div className="text-xs text-[#8ba3d0]">
                            {performer.role}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#d6e2ff]">
                          {formatNumber(performer.totalTasks)}
                        </td>
                        <td className="px-4 py-3 text-[#d6e2ff]">
                          {formatNumber(performer.completedTasks)}
                        </td>
                        <td className="px-4 py-3 text-[#d6e2ff]">
                          {formatPercentage(performer.completionRate)}
                        </td>
                        <td className="px-4 py-3 text-[#d6e2ff]">
                          {performer.avgQualityScore?.toFixed?.(1) ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#162a52] bg-[#0e1f42] p-6 shadow-[0_18px_40px_rgba(8,14,29,0.55)] backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-[#f5f7ff]">Department Performance</h2>
            <p className="text-sm text-[#8ba3d0] mb-4">
              Task throughput and completion rates by department.
            </p>
            <BarChartComponent
              data={departmentPerformance.map((dept) => ({
                department: dept.department,
                completed: dept.completedTasks,
                total: dept.totalTasks,
              }))}
              xKey="department"
              bars={[
                { key: "completed", name: "Completed" },
                { key: "total", name: "Total" },
              ]}
              title="Tasks by Department"
              height={320}
              variant="manager"
            />
          </div>
        </div>

        <LineChartComponent
          data={taskTrend.map((entry) => ({
            ...entry,
            date: new Date(entry.date).toISOString(),
          }))}
          xKey="date"
          lines={[
            { key: "assigned", name: "Assigned", color: "#F97316" },
            { key: "completed", name: "Completed", color: "#22C55E" },
          ]}
          title="Staff Task Flow"
          height={320}
          variant="manager"
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {staffCards.map((card) => (
            <KPICard key={card.title} {...card} size="small" variant="manager" />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#040b1e] via-[#081a3c] to-[#0b1f47] text-white/80">
      <ManagerNavbar onToggleSidebar={handleToggleSidebar} />

      <div className="mt-[88px] flex w-full">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={handleToggleSidebar}
          activeItem={activeMenuItem}
          onItemClick={handleMenuItemClick}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-[1400px] space-y-6">
            <header className="space-y-2">
              <h1 className="text-3xl font-bold text-white">Manager Reports</h1>
              <p className="text-sm text-white/70">
                Financial performance and staff productivity insights for the selected period.
              </p>
              {reportData?.period && (
                <p className="text-xs text-white/60">
                  Reporting window:
                  {" "}
                  {new Date(reportData.period.start).toLocaleDateString(
                    undefined,
                    DAY_FORMAT_OPTIONS
                  )}{" "}
                  -
                  {" "}
                  {new Date(reportData.period.end).toLocaleDateString(
                    undefined,
                    DAY_FORMAT_OPTIONS
                  )}
                </p>
              )}
            </header>

            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ManagerReportsPage;
