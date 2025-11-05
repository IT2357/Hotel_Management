/**
 * Report Tabs Components
 * Contains all report tab content sections
 */

import KPICard from "@/components/manager/reports/KPICard";
import LineChartComponent from "@/components/manager/reports/LineChartComponent";
import BarChartComponent from "@/components/manager/reports/BarChartComponent";
import PieChartComponent from "@/components/manager/reports/PieChartComponent";
import ExportOptions from "@/components/manager/reports/ExportOptions";
import ReportFilters from "@/components/manager/reports/ReportFilters";
import {
  Activity,
  DollarSign,
  TrendingUp,
  Users,
  BookOpen,
  AlertTriangle,
  UserCheck,
  Timer,
  PieChart as PieChartIcon,
  TrendingDown,
  FileText,
} from "lucide-react";
import { MANAGER_RING_CLASS } from "../managerStyles";
import { formatNumber, formatPercentage, getCardColors } from "./utils";

export const OverviewTab = ({
  filters,
  financialCards,
  revenueVsExpenseTrend,
  departmentExpenses,
  expenseByCategory,
  paymentMethods,
  staffStatusDistribution,
  onFiltersChange,
  onExport,
  isLoading,
}) => (
  <>
    <section className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,2.9fr)]">
      <div className="space-y-4">
        <ReportFilters
          onFiltersChange={onFiltersChange}
          initialFilters={filters}
          showChannels={false}
          variant="manager"
        />
        <ExportOptions onExport={onExport} reportType="overview" disabled={isLoading} />
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-lg border border-gray-100">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-green-50/30" />
        <div className="relative space-y-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center rounded-xl p-3 bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Financial Pulse</h2>
              <p className="text-sm text-gray-600">
                Real-time financial metrics and performance indicators.
              </p>
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

    <section className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-lg border border-gray-100 space-y-6">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/30" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center rounded-xl p-3 bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
            <TrendingUp className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Financial Trajectory</h2>
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
            { key: "revenue", name: "Revenue", color: "#60a5fa" },
            { key: "expenses", name: "Expenses", color: "#fb7185" },
          ]}
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

    <section className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-lg border border-gray-100 space-y-6">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/50 to-amber-50/30" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center rounded-xl p-3 bg-gradient-to-br from-yellow-500 to-amber-600 text-white shadow-lg">
            <PieChartIcon className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Resource Allocation</h2>
        </div>
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
);

export const TasksTab = ({ taskCards, onExport, isLoading }) => (
  <section className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 space-y-8">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center justify-center rounded-lg p-3 bg-blue-100 text-blue-700">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Task Performance</h2>
          <p className="text-sm text-gray-600">Task completion and efficiency metrics</p>
        </div>
      </div>
      <ExportOptions onExport={onExport} reportType="tasks" disabled={isLoading} />
    </div>

    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {taskCards.map((card) => {
        const colors = getCardColors(card.iconColor);

        return (
          <div
            key={card.title}
            className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${colors.bg} p-6 shadow-lg border-2 ${colors.border} hover:shadow-xl hover:scale-105 transition-all duration-300`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10 transform translate-x-8 -translate-y-8">
              <div className={`w-full h-full rounded-full bg-gradient-to-br ${colors.icon}`} />
            </div>

            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <p className={`text-xs font-bold mb-3 tracking-wider uppercase ${colors.text}`}>
                  {card.title}
                </p>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-4xl font-black text-gray-900 tracking-tight">
                    {formatNumber(card.value)}
                  </span>
                  {card.unit && (
                    <span className="text-sm font-semibold text-gray-600 tracking-wider">
                      {card.unit}
                    </span>
                  )}
                </div>
              </div>
              <div
                className={`inline-flex items-center justify-center rounded-2xl p-4 shadow-lg bg-gradient-to-br ${colors.icon} group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}
              >
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>

            <div
              className={`mt-4 h-1 w-full rounded-full bg-gradient-to-br ${colors.icon} opacity-20`}
            />
          </div>
        );
      })}
    </div>
  </section>
);
