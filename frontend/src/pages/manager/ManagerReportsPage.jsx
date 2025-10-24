import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import useAuth from "@/hooks/useAuth";
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
  TrendingDown,
  RotateCw
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
  // Use current date range - 6 months to stay within 365-day API limit
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 6); // Last 6 months (~180 days)

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
  const { user } = useAuth();
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
      console.log('📊 Report Data for', currentFilters.reportType, ':', payload);
      console.log('📅 Filters:', currentFilters);
      setReportData(payload);
    } catch (err) {
      console.error('❌ Fetch Reports Error:', err);
      console.error('Error Response:', err?.response?.data);
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

  const handleRefresh = useCallback(() => {
    fetchReports(filters);
    toast.success("Reports refreshed", { duration: 1500 });
  }, [fetchReports, filters]);

  const handleExport = useCallback(async (exportOptions) => {
    try {
      const result = await reportsAPI.exportReport({
        reportType: activeTab,
        format: exportOptions.format,
        startDate: filters.startDate,
        endDate: filters.endDate,
        includeCharts: exportOptions.includeCharts
      });

      console.log('Export result from API:', result);

      // The API service already returns response.data, so result contains:
      // { success, message, fileName, downloadUrl, format, generatedAt }
      
      toast.success("Report exported successfully!", {
        description: "Your report is ready for download."
      });

      // Return the result directly - it already has downloadUrl and fileName
      return result;
    } catch (err) {
      console.error('Export error:', err);
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
  const bookingTrends = reportData?.bookings?.byDate ?? [];
  const bookingByChannel = reportData?.bookings?.byChannel ?? [];
  
  // Debug logging for bookings data
  if (activeTab === 'bookings' && bookingTrends.length > 0) {
    console.log('📊 Booking Trends Data:', bookingTrends.slice(0, 3));
    console.log('📊 Booking By Channel:', bookingByChannel);
  }
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
            
            {/* Booking Summary Cards */}
            {reportData?.bookings && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-purple-700 uppercase tracking-wider">Total Bookings</p>
                    <BookOpen className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-3xl font-black text-gray-900">{reportData.summary?.totalBookings || reportData.bookings.totalBookings || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-100">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-emerald-700 uppercase tracking-wider">Total Revenue</p>
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-3xl font-black text-gray-900">LKR {formatNumber(reportData.summary?.totalRevenue || reportData.bookings.totalRevenue || 0)}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-amber-700 uppercase tracking-wider">Avg. Booking Value</p>
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                  </div>
                  <p className="text-3xl font-black text-gray-900">LKR {formatNumber(reportData.summary?.averageBookingValue || reportData.bookings.averageBookingValue || 0)}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-blue-700 uppercase tracking-wider">Occupancy Rate</p>
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-3xl font-black text-gray-900">{formatPercentage(reportData.summary?.occupancyRate || reportData.bookings.occupancyRate || 0)}</p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <LineChartComponent
                data={bookingTrends
                  .filter(entry => entry._id || entry.date) // Filter out entries without valid date
                  .map((entry) => {
                    try {
                      // Handle date conversion safely
                      let dateStr;
                      if (entry._id) {
                        const dateObj = new Date(entry._id);
                        dateStr = isNaN(dateObj.getTime()) ? null : dateObj.toISOString();
                      } else if (entry.date) {
                        const dateObj = new Date(entry.date);
                        dateStr = isNaN(dateObj.getTime()) ? null : dateObj.toISOString();
                      }
                      
                      return dateStr ? {
                        date: dateStr,
                        bookings: entry.bookings || 0,
                        revenue: entry.revenue || 0
                      } : null;
                    } catch (err) {
                      console.warn('Invalid date in booking trend:', entry);
                      return null;
                    }
                  })
                  .filter(Boolean) // Remove null entries
                }
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
                <div key={card.title} className={`group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 ${
                  card.iconColor === '#38bdf8' ? 'border-cyan-200 hover:border-cyan-300' :
                  card.iconColor === '#f87171' ? 'border-red-200 hover:border-red-300' :
                  card.iconColor === '#22c55e' ? 'border-emerald-200 hover:border-emerald-300' :
                  card.iconColor === '#facc15' ? 'border-amber-200 hover:border-amber-300' :
                  card.iconColor === '#a855f7' ? 'border-purple-200 hover:border-purple-300' :
                  card.iconColor === '#f97316' ? 'border-orange-200 hover:border-orange-300' :
                  'border-gray-200 hover:border-gray-300'
                }`}>
                  
                  <div className="relative flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-xs font-bold mb-3 tracking-wider uppercase ${
                        card.iconColor === '#38bdf8' ? 'text-cyan-600' :
                        card.iconColor === '#f87171' ? 'text-red-600' :
                        card.iconColor === '#22c55e' ? 'text-emerald-600' :
                        card.iconColor === '#facc15' ? 'text-amber-600' :
                        card.iconColor === '#a855f7' ? 'text-purple-600' :
                        card.iconColor === '#f97316' ? 'text-orange-600' :
                        'text-gray-600'
                      }`}>
                        {card.title}
                      </p>
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-3xl font-black text-gray-900">{formatNumber(card.value)}</span>
                        {card.unit && <span className="text-sm font-bold text-gray-500">{card.unit}</span>}
                      </div>
                      {card.trend && (
                        <div className="flex items-center gap-2">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                            card.trend.direction === 'up' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 
                            card.trend.direction === 'down' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-700 border border-gray-200'
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
                    <div className={`inline-flex items-center justify-center rounded-xl p-3 shadow-md ${
                      card.iconColor === '#38bdf8' ? 'bg-gradient-to-br from-cyan-500 to-blue-600' :
                      card.iconColor === '#f87171' ? 'bg-gradient-to-br from-red-500 to-rose-600' :
                      card.iconColor === '#22c55e' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                      card.iconColor === '#facc15' ? 'bg-gradient-to-br from-yellow-500 to-amber-600' :
                      card.iconColor === '#a855f7' ? 'bg-gradient-to-br from-purple-500 to-violet-600' :
                      card.iconColor === '#f97316' ? 'bg-gradient-to-br from-orange-500 to-red-600' :
                      'bg-gradient-to-br from-gray-500 to-slate-600'
                    } group-hover:shadow-lg transition-all duration-300`}>
                      <card.icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
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
              {taskCards.map((card) => {
                // Determine light theme colors based on icon color
                const getCardColors = (color) => {
                  switch (color) {
                    case '#38bdf8': return { bg: 'from-cyan-50 to-blue-50', border: 'border-cyan-200', text: 'text-cyan-700', icon: 'from-cyan-500 to-blue-600' };
                    case '#f87171': return { bg: 'from-red-50 to-rose-50', border: 'border-red-200', text: 'text-red-700', icon: 'from-red-500 to-rose-600' };
                    case '#22c55e': return { bg: 'from-emerald-50 to-green-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'from-emerald-500 to-green-600' };
                    case '#facc15': return { bg: 'from-amber-50 to-yellow-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'from-amber-500 to-yellow-600' };
                    case '#a855f7': return { bg: 'from-purple-50 to-violet-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'from-purple-500 to-violet-600' };
                    case '#f97316': return { bg: 'from-orange-50 to-red-50', border: 'border-orange-200', text: 'text-orange-700', icon: 'from-orange-500 to-red-600' };
                    default: return { bg: 'from-gray-50 to-slate-50', border: 'border-gray-200', text: 'text-gray-700', icon: 'from-gray-500 to-slate-600' };
                  }
                };
                const colors = getCardColors(card.iconColor);
                
                return (
                  <div key={card.title} className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${colors.bg} p-6 shadow-lg border-2 ${colors.border} hover:shadow-xl hover:scale-105 transition-all duration-300`}>
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 opacity-10 transform translate-x-8 -translate-y-8">
                      <div className={`w-full h-full rounded-full bg-gradient-to-br ${colors.icon}`} />
                    </div>
                    
                    <div className="relative flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-xs font-bold mb-3 tracking-wider uppercase ${colors.text}`}>
                          {card.title}
                        </p>
                        <div className="flex items-baseline gap-3 mb-2">
                          <span className="text-4xl font-black text-gray-900 tracking-tight">{formatNumber(card.value)}</span>
                          {card.unit && <span className="text-sm font-semibold text-gray-600 tracking-wider">{card.unit}</span>}
                        </div>
                      </div>
                      <div className={`inline-flex items-center justify-center rounded-2xl p-4 shadow-lg bg-gradient-to-br ${colors.icon} group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                        <card.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    
                    {/* Bottom accent line */}
                    <div className={`mt-4 h-1 w-full rounded-full bg-gradient-to-br ${colors.icon} opacity-20`} />
                  </div>
                );
              })}
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
              {/* Critical Card - Light Theme */}
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 p-6 shadow-lg border-2 border-red-200 hover:border-red-300 hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10 transform translate-x-8 -translate-y-8">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-red-500 to-rose-600" />
                </div>
                <div className="relative flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-red-700 mb-3 tracking-wider uppercase">Critical</p>
                    <p className="text-4xl font-black text-gray-900 tracking-tight">{delayedTasksSummary.critical || 0}</p>
                  </div>
                  <div className="inline-flex items-center justify-center rounded-2xl p-4 shadow-lg bg-gradient-to-br from-red-500 to-rose-600 group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                    <TrendingDown className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 h-1 w-full rounded-full bg-gradient-to-br from-red-500 to-rose-600 opacity-20" />
              </div>
              {/* High Card - Light Theme */}
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-lg border-2 border-amber-200 hover:border-amber-300 hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10 transform translate-x-8 -translate-y-8">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-amber-500 to-orange-600" />
                </div>
                <div className="relative flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-amber-700 mb-3 tracking-wider uppercase">High</p>
                    <p className="text-4xl font-black text-gray-900 tracking-tight">{delayedTasksSummary.high || 0}</p>
                  </div>
                  <div className="inline-flex items-center justify-center rounded-2xl p-4 shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 h-1 w-full rounded-full bg-gradient-to-br from-amber-500 to-orange-600 opacity-20" />
              </div>
              {/* Medium Card - Light Theme */}
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-lg border-2 border-blue-200 hover:border-blue-300 hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10 transform translate-x-8 -translate-y-8">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-cyan-600" />
                </div>
                <div className="relative flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-blue-700 mb-3 tracking-wider uppercase">Medium</p>
                    <p className="text-4xl font-black text-gray-900 tracking-tight">{delayedTasksSummary.medium || 0}</p>
                  </div>
                  <div className="inline-flex items-center justify-center rounded-2xl p-4 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-600 group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 h-1 w-full rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 opacity-20" />
              </div>
              {/* Low Card - Light Theme */}
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 p-6 shadow-lg border-2 border-emerald-200 hover:border-emerald-300 hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10 transform translate-x-8 -translate-y-8">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-500 to-green-600" />
                </div>
                <div className="relative flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-emerald-700 mb-3 tracking-wider uppercase">Low</p>
                    <p className="text-4xl font-black text-gray-900 tracking-tight">{delayedTasksSummary.low || 0}</p>
                  </div>
                  <div className="inline-flex items-center justify-center rounded-2xl p-4 shadow-lg bg-gradient-to-br from-emerald-500 to-green-600 group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 h-1 w-full rounded-full bg-gradient-to-br from-emerald-500 to-green-600 opacity-20" />
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
        {/* Modern Header - Task Management Style */}
        <header className="relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg border-2 border-gray-200">
          <div className="space-y-6">
            {/* Feature Badges */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-cyan-700 border border-cyan-200">
                📊 REAL-TIME DATA
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-purple-700 border border-purple-200">
                📈 AI INSIGHTS
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-700 border border-emerald-200">
                ⚡ LIVE TRACKING
              </span>
            </div>
            
            {/* Title and Actions Row */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                  Analytics & Reports Dashboard
                </h1>
                <p className="text-gray-600 font-medium max-w-2xl">
                  {user?.name || 'Manager'}, monitor hotel performance with comprehensive analytics and real-time insights.
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-100 border-2 border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-200 hover:border-gray-400 transition-all duration-200 disabled:opacity-50"
                >
                  <RotateCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={() => handleExport({ format: 'pdf', includeCharts: true })}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm hover:from-indigo-600 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                >
                  <FileText className="h-4 w-4" />
                  Export Report
                </button>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 border-2 border-blue-200">
                <span className="text-xs font-bold text-blue-600">Active Reports:</span>
                <span className="text-sm font-black text-blue-700">{REPORT_TYPES.length}</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border-2 border-emerald-200">
                <span className="text-xs font-bold text-emerald-600">Period:</span>
                <span className="text-sm font-black text-emerald-700">
                  {filters.period === 'monthly' ? 'Monthly' : filters.period === 'weekly' ? 'Weekly' : 'Daily'}
                </span>
              </div>
              {reportData?.period && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 border-2 border-purple-200">
                  <Calendar className="h-3.5 w-3.5 text-purple-600" />
                  <span className="text-xs font-bold text-purple-700">
                    {new Date(reportData.period.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(reportData.period.end).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </header>

        {renderContent()}
      </div>
    </ManagerLayout>
  );
};


export default ManagerReportsPage;


