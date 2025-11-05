/**
 * Custom Hook: useReportsData
 * Manages reports data fetching and state
 */

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { reportsAPI } from "@/services/reportsAPI";

export const useReportsData = (filters) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportData, setReportData] = useState(null);

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
            department:
              currentFilters.departments.length > 0
                ? currentFilters.departments[0]
                : undefined,
            reportType: "overview",
          });
          break;
        case "workload":
          rawData = await reportsAPI.getWorkloadReport({
            startDate: currentFilters.startDate,
            endDate: currentFilters.endDate,
            department:
              currentFilters.departments.length > 0
                ? currentFilters.departments[0]
                : undefined,
          });
          break;
        case "delayed":
          rawData = await reportsAPI.getDelayedTasksReport({
            department:
              currentFilters.departments.length > 0
                ? currentFilters.departments[0]
                : undefined,
            severity: "all",
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
      console.log("📊 Report Data for", currentFilters.reportType, ":", payload);
      setReportData(payload);
    } catch (err) {
      console.error("❌ Fetch Reports Error:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to load manager reports";
      setError(message);
      toast.error("Unable to load manager reports", { description: message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports(filters);
  }, [fetchReports, filters]);

  return {
    isLoading,
    error,
    reportData,
    fetchReports,
  };
};
