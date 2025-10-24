/**
 * Reports Header Component
 * Header with title, badges, and action buttons
 */

import { Calendar, FileText, RotateCw } from "lucide-react";
import { REPORT_TYPES } from "./constants";

export const ReportsHeader = ({ user, filters, reportData, isLoading, onRefresh, onExport }) => {
  return (
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
              {user?.name || "Manager"}, monitor hotel performance with comprehensive analytics and
              real-time insights.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-100 border-2 border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-200 hover:border-gray-400 transition-all duration-200 disabled:opacity-50"
            >
              <RotateCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => onExport({ format: "pdf", includeCharts: true })}
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
              {filters.period === "monthly"
                ? "Monthly"
                : filters.period === "weekly"
                ? "Weekly"
                : "Daily"}
            </span>
          </div>
          {reportData?.period && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 border-2 border-purple-200">
              <Calendar className="h-3.5 w-3.5 text-purple-600" />
              <span className="text-xs font-bold text-purple-700">
                {new Date(reportData.period.start).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}{" "}
                -{" "}
                {new Date(reportData.period.end).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
