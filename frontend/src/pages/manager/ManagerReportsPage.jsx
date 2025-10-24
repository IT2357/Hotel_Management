import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import useAuth from "@/hooks/useAuth";
import { ManagerLayout, ManagerPageLoader, ManagerErrorState } from "@/components/manager";
import { reportsAPI } from "@/services/reportsAPI";
import { DEFAULT_FILTERS, REPORT_TYPES } from "./reports/constants";
import { buildFinancialCards, buildTaskCards } from "./reports/utils";
import { useReportsData } from "./reports/useReportsData";
import { TabNavigation } from "./reports/TabNavigation";
import { ReportsHeader } from "./reports/ReportsHeader";
import { OverviewTab, TasksTab } from "./reports/ReportTabs";

/**
 * Manager Reports Page
 * Comprehensive analytics and reporting dashboard
 * 
 * Note: This is a refactored version split into modular components for better maintainability.
 * Components are in the ./reports/ directory.
 */

const ManagerReportsPage = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [activeTab, setActiveTab] = useState("overview");

  const { isLoading, error, reportData, fetchReports } = useReportsData(filters);

  const handleMenuItemSelect = useCallback((item) => {
    if (item.id === "reports") return false;
    return undefined;
  }, []);

  const handleFiltersChange = useCallback((nextFilters) => {
    setFilters(nextFilters);
  }, []);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    setFilters((prev) => ({ ...prev, reportType: tabId }));
  }, []);

  const handleRefresh = useCallback(() => {
    fetchReports(filters);
    toast.success("Reports refreshed", { duration: 1500 });
  }, [fetchReports, filters]);

  const handleExport = useCallback(
    async (exportOptions) => {
      try {
        const result = await reportsAPI.exportReport({
          reportType: activeTab,
          format: exportOptions.format,
          startDate: filters.startDate,
          endDate: filters.endDate,
          includeCharts: exportOptions.includeCharts,
        });

        toast.success("Report exported successfully!", {
          description: "Your report is ready for download.",
        });

        return result;
      } catch (err) {
        console.error("Export error:", err);
        const message =
          err?.response?.data?.message || err?.message || "Failed to export report";
        toast.error("Export failed", { description: message });
        throw new Error(message);
      }
    },
    [activeTab, filters]
  );

  // Prepare data for display
  const financialSummary = reportData?.financial?.summary || reportData?.summary;
  const taskSummary = reportData?.summary || reportData?.data?.summary;

  const financialCards = useMemo(() => buildFinancialCards(financialSummary), [financialSummary]);
  const taskCards = useMemo(() => buildTaskCards(taskSummary), [taskSummary]);

  const revenueVsExpenseTrend = reportData?.financial?.revenueVsExpenseTrend ?? [];
  const expenseByCategory = reportData?.financial?.expenseByCategory ?? [];
  const paymentMethods = reportData?.financial?.paymentMethods ?? [];
  const departmentExpenses = reportData?.financial?.departmentExpenses ?? [];
  const departmentPerformance = reportData?.staff?.departmentPerformance ?? [];
  const staffStatusDistribution = reportData?.staff?.statusDistribution ?? [];

  const renderContent = () => {
    if (isLoading && !reportData)
      return <ManagerPageLoader message="Loading reports..." fullPage={false} />;
    
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
      <div className="space-y-10">
        <TabNavigation tabs={REPORT_TYPES} activeTab={activeTab} onTabChange={handleTabChange} />

        {activeTab === "overview" && (
          <OverviewTab
            filters={filters}
            financialCards={financialCards}
            revenueVsExpenseTrend={revenueVsExpenseTrend}
            departmentExpenses={departmentExpenses}
            expenseByCategory={expenseByCategory}
            paymentMethods={paymentMethods}
            staffStatusDistribution={staffStatusDistribution}
            onFiltersChange={handleFiltersChange}
            onExport={handleExport}
            isLoading={isLoading}
          />
        )}

        {activeTab === "tasks" && (
          <TasksTab taskCards={taskCards} onExport={handleExport} isLoading={isLoading} />
        )}

        {/* Add other tabs (financial, bookings, kpis, workload, delayed) as needed */}
        {activeTab !== "overview" && activeTab !== "tasks" && (
          <div className="bg-white rounded-2xl p-12 text-center border-2 border-gray-200">
            <p className="text-gray-600 font-medium">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} report view coming soon...
            </p>
          </div>
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
        <ReportsHeader
          user={user}
          filters={filters}
          reportData={reportData}
          isLoading={isLoading}
          onRefresh={handleRefresh}
          onExport={handleExport}
        />

        {renderContent()}
      </div>
    </ManagerLayout>
  );
};

export default ManagerReportsPage;
