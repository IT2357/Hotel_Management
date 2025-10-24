/**
 * Custom Hook: useHomeData
 * Manages dashboard data fetching and state
 */

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { taskAPI } from "@/services/taskManagementAPI";

export const useHomeData = () => {
  const [stats, setStats] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  return {
    stats,
    lastUpdated,
    isLoading,
    isRefreshing,
    handleRefresh,
  };
};
