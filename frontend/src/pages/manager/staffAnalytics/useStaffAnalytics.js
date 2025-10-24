/**
 * Custom Hook: useStaffAnalytics
 * Manages staff analytics data fetching and state
 */

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { managerReportsAPI } from "@/services/managerReportsAPI";
import { mapApiToAnalytics } from "./utils";

export const useStaffAnalytics = () => {
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
      const mappedData = mapApiToAnalytics(payload);
      
      if (mappedData) {
        setAnalytics(mappedData);
        if (silent) {
          toast.success("Staff analytics refreshed", { duration: 1200 });
        }
      } else {
        throw new Error("Invalid data format received from server");
      }
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Unable to load staff analytics";
      setError(message);
      toast.error("Failed to load analytics", {
        description: message,
        duration: 2200,
      });
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

  return {
    analytics,
    isLoading,
    isRefreshing,
    error,
    loadAnalytics,
  };
};
