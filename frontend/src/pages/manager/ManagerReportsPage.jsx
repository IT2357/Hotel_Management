import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ManagerLayout, ManagerPageLoader, ManagerErrorState } from "@/components/manager";
import ReportFilters from "@/components/manager/reports/ReportFilters";
import KPICard from "@/components/manager/reports/KPICard";
import LineChartComponent from "@/components/manager/reports/LineChartComponent";
import BarChartComponent from "@/components/manager/reports/BarChartComponent";
import PieChartComponent from "@/components/manager/reports/PieChartComponent";
import ExportOptions from "@/components/manager/reports/ExportOptions";
import { reportsAPI } from "@/services/reportsAPI";
import { 
  Activity, 
  DollarSign, 
  PieChart as PieChartIcon, 
  Timer, 
  TrendingUp, 
  Users,
  BookOpen,
  Calendar,
  AlertTriangle,
  UserCheck,
  FileText,
  BarChart3,
  TrendingDown
} from "lucide-react";
import { 
  MANAGER_CONTENT_CLASS, 
  MANAGER_PAGE_CONTAINER_CLASS, 
  MANAGER_SECTION_CLASS, 
  MANAGER_RING_CLASS,
  MANAGER_CARD_CLASS,
  MANAGER_HOVER_LIFT,
  MANAGER_GRADIENT_OVERLAY,
  MANAGER_SECTION_GRADIENT,
  MANAGER_ICON_WRAPPER,
  MANAGER_ICON_VARIANTS,
  MANAGER_BUTTON_BASE,
  MANAGER_BUTTON_VARIANTS
} from "./managerStyles";

const DAY_FORMAT_OPTIONS = { year: "numeric", month: "short", day: "numeric" };

const toDateInputValue = (date) => date.toISOString().split("T")[0];

const createDefaultFilters = () => {
  // Use current date range
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 3); // Last 3 months

  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(end),
    period: "monthly",
    departments: [],
    channels: [],
    compare: false,
    comparePeriod: "previous",
    reportType: "overview" // Default report type
  };
};

const DEFAULT_FILTERS = createDefaultFilters();

const REPORT_TYPES = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "financial", label: "Financial", icon: DollarSign },
  { id: "bookings", label: "Bookings", icon: BookOpen },
  { id: "kpis", label: "KPIs", icon: TrendingUp },
  { id: "tasks", label: "Tasks", icon: Activity },
  { id: "workload", label: "Workload", icon: UserCheck },
  { id: "delayed", label: "Delayed Tasks", icon: AlertTriangle }
];

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
  const [activeTab, setActiveTab] = useState("overview");

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
      let rawData;
      
      switch (currentFilters.reportType) {
        case "overview":
          rawData = await reportsAPI.getManagerOverview({
            startDate: currentFilters.startDate,
            endDate: currentFilters.endDate,
            period: currentFilters.period,
            departments: currentFilters.departments,
          });
          break;
        case "financial":
          rawData = await reportsAPI.getFinancialReports({
            startDate: currentFilters.startDate,
            endDate: currentFilters.endDate,
            period: currentFilters.period,
          });
          break;
        case "bookings":
          rawData = await reportsAPI.getBookingReports({
            startDate: currentFilters.startDate,
            endDate: currentFilters.endDate,
            period: currentFilters.period,
          });
          break;
        case "kpis":
          rawData = await reportsAPI.getKPIDashboard({
            period: currentFilters.period,
          });
          break;
        case "tasks":
          rawData = await reportsAPI.getTaskReports({
            startDate: currentFilters.startDate,
            endDate: currentFilters.endDate,
            department: currentFilters.departments.length > 0 ? currentFilters.departments[0] : undefined,
            reportType: "overview"
          });
          break;
        case "workload":
          rawData = await reportsAPI.getWorkloadReport({
            startDate: currentFilters.startDate,
            endDate: currentFilters.endDate,
            department: currentFilters.departments.length > 0 ? currentFilters.departments[0] : undefined,
          });
          break;
        case "delayed":
          rawData = await reportsAPI.getDelayedTasksReport({
            department: currentFilters.departments.length > 0 ? currentFilters.departments[0] : undefined,
            severity: "all"
          });
          break;
        default:
          rawData = await reportsAPI.getManagerOverview({
            startDate: currentFilters.startDate,
            endDate: currentFilters.endDate,
            period: currentFilters.period,
            departments: currentFilters.departments,
          });
      }
      
      const payload = rawData?.data ?? rawData;
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

  const handleFiltersChange = useCallback((nextFilters) => {
    setFilters(nextFilters);
  }, []);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    setFilters(prev => ({ ...prev, reportType: tabId }));
  }, []);

  const handleExport = useCallback(async (exportOptions) => {
    try {
      const result = await reportsAPI.exportReport({
        reportType: activeTab,
        format: exportOptions.format,
        startDate: filters.startDate,
        endDate: filters.endDate,
        includeCharts: exportOptions.includeCharts
      });

      toast.success("Report exported successfully!", {
        description: "Your report is ready for download."
      });

      return result.data;
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Failed to export report";
      toast.error("Export failed", { description: message });
      throw new Error(message);
    }
  }, [activeTab, filters]);

  // Chart data
  // Financial cards
  const financialSummary = reportData?.financial?.summary || reportData?.summary;
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

  // Task cards
  const taskSummary = reportData?.summary || reportData?.data?.summary;
  const taskCards = useMemo(() => {
    if (!taskSummary) return [];
    return [
      { title: "Total Tasks", value: taskSummary.totalTasks, icon: Activity, iconColor: "#38bdf8" },
      { title: "Completed Tasks", value: taskSummary.completedTasks, icon: TrendingUp, iconColor: "#22c55e" },
      { title: "Pending Tasks", value: taskSummary.pendingTasks, icon: Calendar, iconColor: "#facc15" },
      { title: "Assigned Tasks", value: taskSummary.assignedTasks, icon: UserCheck, iconColor: "#a855f7" },
      { title: "In Progress", value: taskSummary.inProgressTasks, icon: Timer, iconColor: "#f97316" },
      { title: "Completion Rate", value: taskSummary.completionRate, unit: "%", icon: PieChartIcon, iconColor: "#22c55e" },
    ];
  }, [taskSummary]);

  // KPI cards
  const kpiData = reportData?.data || reportData;
  const kpiCards = useMemo(() => {
    if (!kpiData?.kpis) return [];
    return [
      { 
        title: "Occupancy Rate", 
        value: kpiData.kpis.occupancy?.current, 
        unit: "%", 
        trend: kpiData.kpis.occupancy?.trend ? buildTrendMeta(kpiData.kpis.occupancy.trend[0]?.change) : null,
        icon: Users, 
        iconColor: "#38bdf8" 
      },
      { 
        title: "Revenue", 
        value: kpiData.kpis.revenue?.current, 
        unit: "LKR", 
        trend: kpiData.kpis.revenue?.trend ? buildTrendMeta(kpiData.kpis.revenue.trend[0]?.change) : null,
        icon: DollarSign, 
        iconColor: "#22c55e" 
      },
      { 
        title: "Profit Margin", 
        value: kpiData.kpis.profitMargin?.current, 
        unit: "%", 
        trend: kpiData.kpis.profitMargin?.trend ? buildTrendMeta(kpiData.kpis.profitMargin.trend[0]?.change) : null,
        icon: TrendingUp, 
        iconColor: "#facc15" 
      },
      { 
        title: "Guest Satisfaction", 
        value: kpiData.kpis.guestSatisfaction?.current, 
        unit: "/5", 
        trend: kpiData.kpis.guestSatisfaction?.trend ? buildTrendMeta(kpiData.kpis.guestSatisfaction.trend[0]?.change) : null,
        icon: UserCheck, 
        iconColor: "#a855f7" 
      },
      { 
        title: "Task Completion", 
        value: kpiData.kpis.taskCompletion?.current, 
        unit: "%", 
        trend: kpiData.kpis.taskCompletion?.trend ? buildTrendMeta(kpiData.kpis.taskCompletion.trend[0]?.change) : null,
        icon: Activity, 
        iconColor: "#22c55e" 
      },
      { 
        title: "Average Room Rate", 
        value: kpiData.kpis.averageRoomRate?.current, 
        unit: "LKR", 
        trend: kpiData.kpis.averageRoomRate?.trend ? buildTrendMeta(kpiData.kpis.averageRoomRate.trend[0]?.change) : null,
        icon: PieChartIcon, 
        iconColor: "#f97316" 
      },
    ];
  }, [kpiData]);

  const revenueVsExpenseTrend = reportData?.financial?.revenueVsExpenseTrend ?? [];
  const expenseByCategory = reportData?.financial?.expenseByCategory ?? [];
  const paymentMethods = reportData?.financial?.paymentMethods ?? [];
  const departmentExpenses = reportData?.financial?.departmentExpenses ?? [];
  const departmentPerformance = reportData?.staff?.departmentPerformance ?? [];
  const staffStatusDistribution = reportData?.staff?.statusDistribution ?? [];
  const taskTrend = reportData?.staff?.taskTrend ?? [];
  const topPerformers = reportData?.staff?.topPerformers ?? [];
  const bookingTrends = reportData?.bookings?.trends ?? [];
  const bookingByChannel = reportData?.bookings?.byChannel ?? [];
  const delayedTasksSummary = reportData?.data?.summary ?? {};

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
        {/* Modern Glassmorphism Tab Navigation */}
        <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl p-6 shadow-xl border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-r from-white/50 to-white/30" />
          <div className="relative flex flex-wrap gap-3">
            {REPORT_TYPES.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`group relative overflow-hidden rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105"
                      : "bg-white/60 text-gray-700 hover:bg-white/80 hover:shadow-md hover:scale-102"
                  }`}
                >
                  {/* Active gradient overlay */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-600/20" />
                  )}
                  
                  <div className="relative flex items-center gap-2">
                    <Icon className={`w-4 h-4 transition-all duration-300 ${
                      isActive ? "text-white" : "text-gray-600 group-hover:text-indigo-600"
                    }`} />
                    <span className={`transition-all duration-300 ${
                      isActive ? "text-white" : "text-gray-700 group-hover:text-indigo-700"
                    }`}>
                      {tab.label}
                    </span>
                  </div>
                  
                  {/* Hover shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <>
            <section className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,2.9fr)]">
              {/* Filters Panel */}
              <div className="space-y-4">
                <ReportFilters onFiltersChange={handleFiltersChange} initialFilters={filters} showChannels={false} variant="manager" />
                <ExportOptions 
                  onExport={handleExport} 
                  reportType={activeTab}
                  disabled={isLoading}
                />
              </div>
              
              {/* Financial Cards Panel */}
              <div className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-lg border border-gray-100">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-green-50/30" />
                <div className="relative space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center justify-center rounded-xl p-3 bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Financial Pulse
                      </h2>
                      <p className="text-sm text-gray-600">Real-time financial metrics and performance indicators.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {financialCards.map((card) => (
                      <KPICard key={card.title} {...card} variant="manager" />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Financial Trajectory Section */}
            <section className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-lg border border-gray-100 space-y-6">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/30" />
              <div className="relative flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center justify-center rounded-xl p-3 bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Financial Trajectory
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                  <Timer className="h-3 w-3" />
                  Updated daily
                </span>
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

            {/* Resource Allocation Section */}
            <section className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-lg border border-gray-100 space-y-6">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/50 to-amber-50/30" />
              <div className="relative flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center justify-center rounded-xl p-3 bg-gradient-to-br from-yellow-500 to-amber-600 text-white shadow-lg">
                    <PieChartIcon className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Resource Allocation
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-100 to-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                  <PieChartIcon className="h-3 w-3" />
                  Spend & payment mix
                </span>
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
          </>
        )}

        {/* Financial Tab */}
        {activeTab === "financial" && (
          <section className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center rounded-lg p-3 bg-green-100 text-green-700">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Financial Performance
                  </h2>
                  <p className="text-sm text-gray-600">Revenue, expenses, and profitability metrics</p>
                </div>
              </div>
              <ExportOptions 
                onExport={handleExport} 
                reportType={activeTab}
                disabled={isLoading}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {financialCards.map((card) => (
                <KPICard key={card.title} {...card} variant="manager" />
              ))}
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
            
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <PieChartComponent
                data={expenseByCategory}
                dataKey="value"
                nameKey="name"
                title="Expense Distribution by Category"
                height={320}
                showLabels={false}
                variant="manager"
                className={MANAGER_RING_CLASS}
              />
              <PieChartComponent
                data={paymentMethods}
                dataKey="value"
                nameKey="name"
                title="Payment Methods Distribution"
                height={320}
                showLabels={false}
                variant="manager"
                className={MANAGER_RING_CLASS}
              />
            </div>
          </section>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <section className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center rounded-lg p-3 bg-purple-100 text-purple-700">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Booking Analytics
                  </h2>
                  <p className="text-sm text-gray-600">Booking trends and performance metrics</p>
                </div>
              </div>
              <ExportOptions 
                onExport={handleExport} 
                reportType={activeTab}
                disabled={isLoading}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <LineChartComponent
                data={bookingTrends.map((entry) => ({ ...entry, date: new Date(entry.date).toISOString() }))}
                xKey="date"
                lines={[{ key: "bookings", name: "Bookings", color: "#60a5fa" }]}
                title="Booking Trends"
                height={320}
                variant="manager"
                className={MANAGER_RING_CLASS}
              />
              <PieChartComponent
                data={bookingByChannel}
                dataKey="count"
                nameKey="_id"
                title="Bookings by Channel"
                height={320}
                showLabels={false}
                variant="manager"
                className={MANAGER_RING_CLASS}
              />
            </div>
          </section>
        )}

        {/* KPIs Tab */}
        {activeTab === "kpis" && (
          <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center rounded-lg p-3 bg-yellow-100 text-yellow-700">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Key Performance Indicators
                  </h2>
                  <p className="text-sm text-gray-600">Critical metrics for hotel performance</p>
                </div>
              </div>
              <ExportOptions 
                onExport={handleExport} 
                reportType={activeTab}
                disabled={isLoading}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {kpiCards.map((card) => (
                <div key={card.title} className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-700 border border-slate-700/50 hover:border-cyan-400/50">
                  {/* Neon glow effect */}
                  <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${
                    card.iconColor === '#38bdf8' ? 'bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-cyan-500/20' :
                    card.iconColor === '#f87171' ? 'bg-gradient-to-br from-red-500/20 via-rose-500/10 to-red-500/20' :
                    card.iconColor === '#22c55e' ? 'bg-gradient-to-br from-green-500/20 via-emerald-500/10 to-green-500/20' :
                    card.iconColor === '#facc15' ? 'bg-gradient-to-br from-yellow-500/20 via-amber-500/10 to-yellow-500/20' :
                    card.iconColor === '#a855f7' ? 'bg-gradient-to-br from-purple-500/20 via-violet-500/10 to-purple-500/20' :
                    card.iconColor === '#f97316' ? 'bg-gradient-to-br from-orange-500/20 via-red-500/10 to-orange-500/20' :
                    'bg-gradient-to-br from-gray-500/20 via-slate-500/10 to-gray-500/20'
                  }`} />
                  
                  {/* Animated border glow */}
                  <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${
                    card.iconColor === '#38bdf8' ? 'bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400' :
                    card.iconColor === '#f87171' ? 'bg-gradient-to-r from-red-400 via-rose-500 to-red-400' :
                    card.iconColor === '#22c55e' ? 'bg-gradient-to-r from-green-400 via-emerald-500 to-green-400' :
                    card.iconColor === '#facc15' ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400' :
                    card.iconColor === '#a855f7' ? 'bg-gradient-to-r from-purple-400 via-violet-500 to-purple-400' :
                    card.iconColor === '#f97316' ? 'bg-gradient-to-r from-orange-400 via-red-500 to-orange-400' :
                    'bg-gradient-to-r from-gray-400 via-slate-500 to-gray-400'
                  } blur-sm`} style={{ padding: '1px' }}>
                    <div className="w-full h-full rounded-3xl bg-slate-900" />
                  </div>
                  
                  <div className="relative flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-sm font-bold mb-4 tracking-wider uppercase ${
                        card.iconColor === '#38bdf8' ? 'text-cyan-400' :
                        card.iconColor === '#f87171' ? 'text-red-400' :
                        card.iconColor === '#22c55e' ? 'text-green-400' :
                        card.iconColor === '#facc15' ? 'text-yellow-400' :
                        card.iconColor === '#a855f7' ? 'text-purple-400' :
                        card.iconColor === '#f97316' ? 'text-orange-400' :
                        'text-slate-400'
                      }`}>
                        {card.title}
                      </p>
                      <div className="flex items-baseline gap-3 mb-4">
                        <span className="text-4xl font-black text-white tracking-tight">{formatNumber(card.value)}</span>
                        {card.unit && <span className="text-sm font-bold text-slate-400 tracking-wider">{card.unit}</span>}
                      </div>
                      {card.trend && (
                        <div className="flex items-center gap-2">
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider ${
                            card.trend.direction === 'up' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 
                            card.trend.direction === 'down' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-slate-500/20 text-slate-400 border border-slate-500/50'
                          }`}>
                            {card.trend.direction === 'up' ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : card.trend.direction === 'down' ? (
                              <TrendingDown className="h-3 w-3" />
                            ) : null}
                            {formatPercentage(card.trend.percentage)}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className={`inline-flex items-center justify-center rounded-2xl p-4 shadow-2xl ${
                      card.iconColor === '#38bdf8' ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/50' :
                      card.iconColor === '#f87171' ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/50' :
                      card.iconColor === '#22c55e' ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/50' :
                      card.iconColor === '#facc15' ? 'bg-gradient-to-br from-yellow-500 to-amber-600 shadow-yellow-500/50' :
                      card.iconColor === '#a855f7' ? 'bg-gradient-to-br from-purple-500 to-violet-600 shadow-purple-500/50' :
                      card.iconColor === '#f97316' ? 'bg-gradient-to-br from-orange-500 to-red-600 shadow-orange-500/50' :
                      'bg-gradient-to-br from-gray-500 to-slate-600 shadow-gray-500/50'
                    } group-hover:shadow-lg group-hover:scale-110 transition-all duration-500`}>
                      <card.icon className="h-6 w-6 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  
                  {/* Cyberpunk grid pattern */}
                  <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
                    <div className="w-full h-full" style={{
                      backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                      backgroundSize: '20px 20px'
                    }} />
                  </div>
                  
                  {/* Animated scan line */}
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-pulse" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tasks Tab */}
        {activeTab === "tasks" && (
          <section className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center rounded-lg p-3 bg-blue-100 text-blue-700">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Task Performance
                  </h2>
                  <p className="text-sm text-gray-600">Task completion and efficiency metrics</p>
                </div>
              </div>
              <ExportOptions 
                onExport={handleExport} 
                reportType={activeTab}
                disabled={isLoading}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {taskCards.map((card) => (
                <div key={card.title} className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-700 border border-slate-700/50 hover:border-cyan-400/50">
                  {/* Neon glow effect */}
                  <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${
                    card.iconColor === '#38bdf8' ? 'bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-cyan-500/20' :
                    card.iconColor === '#f87171' ? 'bg-gradient-to-br from-red-500/20 via-rose-500/10 to-red-500/20' :
                    card.iconColor === '#22c55e' ? 'bg-gradient-to-br from-green-500/20 via-emerald-500/10 to-green-500/20' :
                    card.iconColor === '#facc15' ? 'bg-gradient-to-br from-yellow-500/20 via-amber-500/10 to-yellow-500/20' :
                    card.iconColor === '#a855f7' ? 'bg-gradient-to-br from-purple-500/20 via-violet-500/10 to-purple-500/20' :
                    card.iconColor === '#f97316' ? 'bg-gradient-to-br from-orange-500/20 via-red-500/10 to-orange-500/20' :
                    'bg-gradient-to-br from-gray-500/20 via-slate-500/10 to-gray-500/20'
                  }`} />
                  
                  {/* Animated border glow */}
                  <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${
                    card.iconColor === '#38bdf8' ? 'bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400' :
                    card.iconColor === '#f87171' ? 'bg-gradient-to-r from-red-400 via-rose-500 to-red-400' :
                    card.iconColor === '#22c55e' ? 'bg-gradient-to-r from-green-400 via-emerald-500 to-green-400' :
                    card.iconColor === '#facc15' ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400' :
                    card.iconColor === '#a855f7' ? 'bg-gradient-to-r from-purple-400 via-violet-500 to-purple-400' :
                    card.iconColor === '#f97316' ? 'bg-gradient-to-r from-orange-400 via-red-500 to-orange-400' :
                    'bg-gradient-to-r from-gray-400 via-slate-500 to-gray-400'
                  } blur-sm`} style={{ padding: '1px' }}>
                    <div className="w-full h-full rounded-3xl bg-slate-900" />
                  </div>
                  
                  <div className="relative flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-sm font-bold mb-4 tracking-wider uppercase ${
                        card.iconColor === '#38bdf8' ? 'text-cyan-400' :
                        card.iconColor === '#f87171' ? 'text-red-400' :
                        card.iconColor === '#22c55e' ? 'text-green-400' :
                        card.iconColor === '#facc15' ? 'text-yellow-400' :
                        card.iconColor === '#a855f7' ? 'text-purple-400' :
                        card.iconColor === '#f97316' ? 'text-orange-400' :
                        'text-slate-400'
                      }`}>
                        {card.title}
                      </p>
                      <div className="flex items-baseline gap-3 mb-4">
                        <span className="text-4xl font-black text-white tracking-tight">{formatNumber(card.value)}</span>
                        {card.unit && <span className="text-sm font-bold text-slate-400 tracking-wider">{card.unit}</span>}
                      </div>
                    </div>
                    <div className={`inline-flex items-center justify-center rounded-2xl p-4 shadow-2xl ${
                      card.iconColor === '#38bdf8' ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/50' :
                      card.iconColor === '#f87171' ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/50' :
                      card.iconColor === '#22c55e' ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/50' :
                      card.iconColor === '#facc15' ? 'bg-gradient-to-br from-yellow-500 to-amber-600 shadow-yellow-500/50' :
                      card.iconColor === '#a855f7' ? 'bg-gradient-to-br from-purple-500 to-violet-600 shadow-purple-500/50' :
                      card.iconColor === '#f97316' ? 'bg-gradient-to-br from-orange-500 to-red-600 shadow-orange-500/50' :
                      'bg-gradient-to-br from-gray-500 to-slate-600 shadow-gray-500/50'
                    } group-hover:shadow-lg group-hover:scale-110 transition-all duration-500`}>
                      <card.icon className="h-6 w-6 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  
                  {/* Cyberpunk grid pattern */}
                  <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
                    <div className="w-full h-full" style={{
                      backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                      backgroundSize: '20px 20px'
                    }} />
                  </div>
                  
                  {/* Animated scan line */}
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-pulse" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Workload Tab */}
        {activeTab === "workload" && (
          <section className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center rounded-lg p-3 bg-green-100 text-green-700">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Staff Workload
                  </h2>
                  <p className="text-sm text-gray-600">Workload distribution across departments</p>
                </div>
              </div>
              <ExportOptions 
                onExport={handleExport} 
                reportType={activeTab}
                disabled={isLoading}
              />
            </div>
            
            <BarChartComponent
              data={departmentPerformance.map((dept) => ({ department: dept.department, completed: dept.completedTasks, total: dept.totalTasks }))}
              xKey="department"
              bars={[{ key: "completed", name: "Completed" }, { key: "total", name: "Total" }]}
              title="Department Performance"
              height={320}
              variant="manager"
              className={MANAGER_RING_CLASS}
            />
          </section>
        )}

        {/* Delayed Tasks Tab */}
        {activeTab === "delayed" && (
          <section className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center rounded-lg p-3 bg-red-100 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Delayed Tasks
                  </h2>
                  <p className="text-sm text-gray-600">Overdue tasks by severity</p>
                </div>
              </div>
              <ExportOptions 
                onExport={handleExport} 
                reportType={activeTab}
                disabled={isLoading}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-700 border border-slate-700/50 hover:border-red-400/50">
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br from-red-500/20 via-rose-500/10 to-red-500/20" />
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-r from-red-400 via-rose-500 to-red-400 blur-sm" style={{ padding: '1px' }}>
                  <div className="w-full h-full rounded-3xl bg-slate-900" />
                </div>
                <div className="relative flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-400 mb-4 tracking-wider uppercase">Critical</p>
                    <p className="text-4xl font-black text-white tracking-tight">{delayedTasksSummary.critical || 0}</p>
                  </div>
                  <div className="inline-flex items-center justify-center rounded-2xl p-4 shadow-2xl bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/50 group-hover:shadow-lg group-hover:scale-110 transition-all duration-500">
                    <TrendingDown className="h-6 w-6 text-white drop-shadow-lg" />
                  </div>
                </div>
                <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
                  <div className="w-full h-full" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                    backgroundSize: '20px 20px'
                  }} />
                </div>
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-red-400 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-pulse" />
              </div>
              <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-700 border border-slate-700/50 hover:border-yellow-400/50">
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br from-yellow-500/20 via-amber-500/10 to-yellow-500/20" />
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 blur-sm" style={{ padding: '1px' }}>
                  <div className="w-full h-full rounded-3xl bg-slate-900" />
                </div>
                <div className="relative flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-yellow-400 mb-4 tracking-wider uppercase">High</p>
                    <p className="text-4xl font-black text-white tracking-tight">{delayedTasksSummary.high || 0}</p>
                  </div>
                  <div className="inline-flex items-center justify-center rounded-2xl p-4 shadow-2xl bg-gradient-to-br from-yellow-500 to-amber-600 shadow-yellow-500/50 group-hover:shadow-lg group-hover:scale-110 transition-all duration-500">
                    <AlertTriangle className="h-6 w-6 text-white drop-shadow-lg" />
                  </div>
                </div>
                <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
                  <div className="w-full h-full" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                    backgroundSize: '20px 20px'
                  }} />
                </div>
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-pulse" />
              </div>
              <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-700 border border-slate-700/50 hover:border-blue-400/50">
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br from-blue-500/20 via-cyan-500/10 to-blue-500/20" />
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-r from-blue-400 via-cyan-500 to-blue-400 blur-sm" style={{ padding: '1px' }}>
                  <div className="w-full h-full rounded-3xl bg-slate-900" />
                </div>
                <div className="relative flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-blue-400 mb-4 tracking-wider uppercase">Medium</p>
                    <p className="text-4xl font-black text-white tracking-tight">{delayedTasksSummary.medium || 0}</p>
                  </div>
                  <div className="inline-flex items-center justify-center rounded-2xl p-4 shadow-2xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-blue-500/50 group-hover:shadow-lg group-hover:scale-110 transition-all duration-500">
                    <Activity className="h-6 w-6 text-white drop-shadow-lg" />
                  </div>
                </div>
                <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
                  <div className="w-full h-full" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                    backgroundSize: '20px 20px'
                  }} />
                </div>
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-pulse" />
              </div>
              <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-700 border border-slate-700/50 hover:border-green-400/50">
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br from-green-500/20 via-emerald-500/10 to-green-500/20" />
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-r from-green-400 via-emerald-500 to-green-400 blur-sm" style={{ padding: '1px' }}>
                  <div className="w-full h-full rounded-3xl bg-slate-900" />
                </div>
                <div className="relative flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-green-400 mb-4 tracking-wider uppercase">Low</p>
                    <p className="text-4xl font-black text-white tracking-tight">{delayedTasksSummary.low || 0}</p>
                  </div>
                  <div className="inline-flex items-center justify-center rounded-2xl p-4 shadow-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/50 group-hover:shadow-lg group-hover:scale-110 transition-all duration-500">
                    <FileText className="h-6 w-6 text-white drop-shadow-lg" />
                  </div>
                </div>
                <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
                  <div className="w-full h-full" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                    backgroundSize: '20px 20px'
                  }} />
                </div>
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-pulse" />
              </div>
            </div>
          </section>
        )}
      </div>
    );
  };

  return (
    <ManagerLayout
      activeItem="reports"
      onMenuItemSelect={handleMenuItemSelect}
      contentClassName="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 py-8 space-y-8">
        {/* Modern Hero Header */}
        <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/90 via-purple-600/90 to-pink-600/90" />
          <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-white/10 blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-white/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          
          <div className="relative space-y-6">
            {/* Status Badge */}
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center rounded-xl p-3 bg-white/20 backdrop-blur-sm">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                📊 Analytics Dashboard
              </span>
            </div>
            
            {/* Main Title */}
            <div className="space-y-4">
              <h1 className="text-5xl font-bold text-white md:text-6xl">
                Manager Reports
              </h1>
              <p className="max-w-2xl text-xl text-white/90 leading-relaxed">
                Advanced analytics and insights for comprehensive hotel performance monitoring.
              </p>
            </div>
            
            {/* Period Info */}
            {reportData?.period && (
              <div className="flex items-center gap-2 text-sm text-white/80">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">
                  Reporting window: {new Date(reportData.period.start).toLocaleDateString(undefined, DAY_FORMAT_OPTIONS)} — {new Date(reportData.period.end).toLocaleDateString(undefined, DAY_FORMAT_OPTIONS)}
                </span>
              </div>
            )}
          </div>
        </header>

        {renderContent()}
      </div>
    </ManagerLayout>
  );
};


export default ManagerReportsPage;


