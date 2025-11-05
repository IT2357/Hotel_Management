/**
 * Reports Page Constants
 * Constants, defaults, and configuration for reports
 */

import {
  Activity,
  DollarSign,
  TrendingUp,
  Users,
  BookOpen,
  AlertTriangle,
  UserCheck,
  BarChart3,
} from "lucide-react";

export const toDateInputValue = (date) => date.toISOString().split("T")[0];

export const createDefaultFilters = () => {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 6); // Last 6 months

  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(end),
    period: "monthly",
    departments: [],
    channels: [],
    compare: false,
    comparePeriod: "previous",
    reportType: "overview",
  };
};

export const DEFAULT_FILTERS = createDefaultFilters();

export const REPORT_TYPES = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "financial", label: "Financial", icon: DollarSign },
  { id: "bookings", label: "Bookings", icon: BookOpen },
  { id: "kpis", label: "KPIs", icon: TrendingUp },
  { id: "tasks", label: "Tasks", icon: Activity },
  { id: "workload", label: "Workload", icon: UserCheck },
  { id: "delayed", label: "Delayed Tasks", icon: AlertTriangle },
];

export const DAY_FORMAT_OPTIONS = { year: "numeric", month: "short", day: "numeric" };
