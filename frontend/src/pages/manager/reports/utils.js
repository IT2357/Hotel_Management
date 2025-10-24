/**
 * Reports Utils
 * Helper functions for data transformation and formatting
 */

import {
  Activity,
  DollarSign,
  PieChart,
  Timer,
  TrendingUp,
  Users,
  Calendar,
  UserCheck,
} from "lucide-react";

export const buildTrendMeta = (change) => {
  if (change === null || change === undefined) return null;
  const direction = change > 0 ? "up" : change < 0 ? "down" : "flat";
  return { direction, percentage: Math.abs(change) };
};

export const formatNumber = (value) => {
  if (!Number.isFinite(value)) return "0";
  return Number(value).toLocaleString();
};

export const formatPercentage = (value) => {
  if (!Number.isFinite(value)) return "0%";
  return `${value.toFixed(1)}%`;
};

/**
 * Get card color scheme based on icon color
 */
export const getCardColors = (color) => {
  switch (color) {
    case "#38bdf8":
      return {
        bg: "from-cyan-50 to-blue-50",
        border: "border-cyan-200",
        text: "text-cyan-700",
        icon: "from-cyan-500 to-blue-600",
      };
    case "#f87171":
      return {
        bg: "from-red-50 to-rose-50",
        border: "border-red-200",
        text: "text-red-700",
        icon: "from-red-500 to-rose-600",
      };
    case "#22c55e":
      return {
        bg: "from-emerald-50 to-green-50",
        border: "border-emerald-200",
        text: "text-emerald-700",
        icon: "from-emerald-500 to-green-600",
      };
    case "#facc15":
      return {
        bg: "from-amber-50 to-yellow-50",
        border: "border-amber-200",
        text: "text-amber-700",
        icon: "from-amber-500 to-yellow-600",
      };
    case "#a855f7":
      return {
        bg: "from-purple-50 to-violet-50",
        border: "border-purple-200",
        text: "text-purple-700",
        icon: "from-purple-500 to-violet-600",
      };
    case "#f97316":
      return {
        bg: "from-orange-50 to-red-50",
        border: "border-orange-200",
        text: "text-orange-700",
        icon: "from-orange-500 to-red-600",
      };
    default:
      return {
        bg: "from-gray-50 to-slate-50",
        border: "border-gray-200",
        text: "text-gray-700",
        icon: "from-gray-500 to-slate-600",
      };
  }
};

/**
 * Build financial cards data
 */
export const buildFinancialCards = (financialSummary) => {
  if (!financialSummary) return [];
  
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
      icon: PieChart,
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
};

/**
 * Build task cards data
 */
export const buildTaskCards = (taskSummary) => {
  if (!taskSummary) return [];
  
  return [
    {
      title: "Total Tasks",
      value: taskSummary.totalTasks,
      icon: Activity,
      iconColor: "#38bdf8",
    },
    {
      title: "Completed Tasks",
      value: taskSummary.completedTasks,
      icon: TrendingUp,
      iconColor: "#22c55e",
    },
    {
      title: "Pending Tasks",
      value: taskSummary.pendingTasks,
      icon: Calendar,
      iconColor: "#facc15",
    },
    {
      title: "Assigned Tasks",
      value: taskSummary.assignedTasks,
      icon: UserCheck,
      iconColor: "#a855f7",
    },
    {
      title: "In Progress",
      value: taskSummary.inProgressTasks,
      icon: Timer,
      iconColor: "#f97316",
    },
    {
      title: "Completion Rate",
      value: taskSummary.completionRate,
      unit: "%",
      icon: PieChart,
      iconColor: "#22c55e",
    },
  ];
};
