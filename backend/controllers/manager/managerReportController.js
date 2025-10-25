/**
 * Manager Report Controller
 * Handles comprehensive report generation for managers
 */

import { AppError } from "../../services/error/AppError.js";
import {
  DAY_IN_MS,
  PERIOD_UNIT_MAP,
  parseArrayParam,
  resolveDateRange,
  calculatePercentageChange,
  safeNumber,
  round,
  formatLabel,
  generateRiskAlerts,
} from "./reportUtils.js";
import {
  aggregateRevenueTrend,
  aggregateExpenseTrend,
  aggregateTaskTrend,
  getStaffCounts,
  aggregateRevenueSummary,
  aggregateExpenseSummary,
  aggregateRevenueBySource,
  aggregateExpenseByCategory,
  aggregatePaymentMethods,
  aggregateDepartmentExpenses,
  aggregateStaffTaskSummary,
  aggregateStaffDepartmentPerformance,
  aggregateTopPerformers,
  aggregateManagerTaskStatus,
  aggregateStaffTaskStatus,
  aggregateOccupancy,
  getTotalRoomsCount,
  getOverdueTasksCount,
} from "./reportAggregations.js";

export const getManagerOverviewReport = async (req, res, next) => {
  try {
    const { startDate, endDate, period: requestedPeriod } = req.query;
    const departments = parseArrayParam(req.query.departments);
    const period = (requestedPeriod || "monthly").toLowerCase();
    const normalizedPeriod = PERIOD_UNIT_MAP[period] ? period : "monthly";

    const { start, end } = resolveDateRange(startDate, endDate);
    const rangeMs = Math.max(end.getTime() - start.getTime(), DAY_IN_MS);
    const totalDays = Math.max(1, Math.round(rangeMs / DAY_IN_MS));

    const previousEnd = new Date(start.getTime());
    const previousStart = new Date(start.getTime() - rangeMs);

    const departmentFilter = departments.length
      ? { department: { $in: departments } }
      : {};

    const revenueMatch = { serviceDate: { $gte: start, $lte: end } };
    const expenseMatch = {
      paidAt: { $gte: start, $lte: end },
      ...departmentFilter,
    };
    const staffMatch = {
      createdAt: { $gte: start, $lte: end },
      ...departmentFilter,
    };
    const managerTaskMatch = {
      createdAt: { $gte: start, $lte: end },
      isArchived: { $ne: true },
      ...(departments.length ? { department: { $in: departments } } : {}),
    };

    const previousRevenueMatch = {
      serviceDate: { $gte: previousStart, $lte: previousEnd },
    };
    const previousExpenseMatch = {
      paidAt: { $gte: previousStart, $lte: previousEnd },
      ...departmentFilter,
    };

    const now = new Date();

    // Get staff counts and execute all aggregations in parallel
    const { totalStaffCount, activeStaffCount, onDutyCount } = await getStaffCounts();

    const [
      revenueSummaryAgg,
      expenseSummaryAgg,
      revenueTrendAgg,
      expenseTrendAgg,
      revenueBySourceAgg,
      expenseByCategoryAgg,
      paymentMethodsAgg,
      departmentExpensesAgg,
      staffSummaryAgg,
      staffDepartmentPerformanceAgg,
      topPerformersAgg,
      staffTaskTrendAgg,
      managerTaskStatusAgg,
      staffStatusAgg,
      occupancyAgg,
      totalRoomsCount,
      previousRevenueAgg,
      previousExpenseAgg,
      overdueTasks,
    ] = await Promise.all([
      aggregateRevenueSummary(revenueMatch),
      aggregateExpenseSummary(expenseMatch),
      aggregateRevenueTrend(revenueMatch, normalizedPeriod),
      aggregateExpenseTrend(expenseMatch, normalizedPeriod),
      aggregateRevenueBySource(revenueMatch),
      aggregateExpenseByCategory(expenseMatch),
      aggregatePaymentMethods(revenueMatch),
      aggregateDepartmentExpenses(expenseMatch),
      aggregateStaffTaskSummary(staffMatch),
      aggregateStaffDepartmentPerformance(staffMatch),
      aggregateTopPerformers(staffMatch),
      aggregateTaskTrend(staffMatch, normalizedPeriod),
      aggregateManagerTaskStatus(managerTaskMatch),
      aggregateStaffTaskStatus(staffMatch),
      aggregateOccupancy(start, end),
      getTotalRoomsCount(),
      aggregateRevenueSummary(previousRevenueMatch),
      aggregateExpenseSummary(previousExpenseMatch),
      getOverdueTasksCount(departmentFilter, start, end, now),
    ]);

    const revenueSummary = revenueSummaryAgg[0] || {};
    const expenseSummary = expenseSummaryAgg[0] || {};

    const totalRevenueGross = safeNumber(revenueSummary.totalAmount);
    const totalRevenueNet = safeNumber(
      revenueSummary.netRevenue ?? revenueSummary.totalAmount
    );
    const totalExpenses = safeNumber(expenseSummary.totalAmount);
    const netProfit = totalRevenueNet - totalExpenses;
    const profitMargin = totalRevenueNet > 0
      ? (netProfit / totalRevenueNet) * 100
      : 0;
    const avgDailyRevenue = totalRevenueNet / totalDays;

    const previousRevenueSummary = previousRevenueAgg[0] || {};
    const previousExpenseSummary = previousExpenseAgg[0] || {};
    const previousRevenueNet = safeNumber(
      previousRevenueSummary.netRevenue ?? previousRevenueSummary.totalAmount
    );
    const previousExpenses = safeNumber(previousExpenseSummary.totalAmount);
    const previousProfit = previousRevenueNet - previousExpenses;

    const revenueChange = calculatePercentageChange(
      totalRevenueNet,
      previousRevenueNet
    );
    const expenseChange = calculatePercentageChange(
      totalExpenses,
      previousExpenses
    );
    const profitChange = calculatePercentageChange(netProfit, previousProfit);

    const revenueMap = new Map(
      revenueTrendAgg.map((entry) => [
        entry.date.toISOString(),
        safeNumber(entry.total),
      ])
    );
    const expenseMap = new Map(
      expenseTrendAgg.map((entry) => [
        entry.date.toISOString(),
        safeNumber(entry.total),
      ])
    );

    const trendKeys = new Set([
      ...revenueMap.keys(),
      ...expenseMap.keys(),
    ]);
    const revenueVsExpenseTrend = Array.from(trendKeys)
      .sort((a, b) => new Date(a) - new Date(b))
      .map((key) => ({
        date: key,
        revenue: revenueMap.get(key) ?? 0,
        expenses: expenseMap.get(key) ?? 0,
      }));

    const revenueBySource = revenueBySourceAgg.map((item) => ({
      name: formatLabel(item._id),
      value: round(safeNumber(item.value)),
    }));

    const expenseByCategory = expenseByCategoryAgg.map((item) => ({
      name: formatLabel(item._id),
      value: round(safeNumber(item.value)),
    }));

    const paymentMethods = paymentMethodsAgg.map((item) => ({
      name: formatLabel(item._id),
      value: round(safeNumber(item.value)),
    }));

    const departmentExpenses = departmentExpensesAgg.map((item) => ({
      name: formatLabel(item._id),
      value: round(safeNumber(item.value)),
    }));

    const staffSummaryDoc = staffSummaryAgg[0] || {};
    const totalStaffTasks = safeNumber(staffSummaryDoc.totalTasks);
    const completedStaffTasks = safeNumber(staffSummaryDoc.completedTasks);
    const inProgressTasks = safeNumber(staffSummaryDoc.inProgressTasks);
    const averageCompletionTime = round(
      safeNumber(staffSummaryDoc.avgCompletionTime)
    );
    const averageQualityScore = round(
      safeNumber(staffSummaryDoc.avgQualityScore)
    );
    const completionRate = totalStaffTasks > 0
      ? (completedStaffTasks / totalStaffTasks) * 100
      : 0;

    const departmentPerformance = staffDepartmentPerformanceAgg.map((item) => {
      const total = safeNumber(item.totalTasks);
      const completed = safeNumber(item.completedTasks);
      return {
        department: formatLabel(item._id),
        totalTasks: total,
        completedTasks: completed,
        completionRate: total > 0 ? round((completed / total) * 100) : 0,
        avgCompletionTime: round(safeNumber(item.avgCompletionTime)),
      };
    });

    const topPerformers = topPerformersAgg.map((item) => ({
      staffId: item.staffId,
      name: item.name || "Unassigned",
      email: item.email || null,
      role: formatLabel(item.role || "Staff"),
      totalTasks: safeNumber(item.totalTasks),
      completedTasks: safeNumber(item.completedTasks),
      completionRate: round(safeNumber(item.completionRate)),
      avgCompletionTime: round(safeNumber(item.avgCompletionTime)),
      avgQualityScore: round(safeNumber(item.avgQualityScore)),
    }));

    const taskTrend = staffTaskTrendAgg.map((item) => ({
      date: item.date.toISOString(),
      assigned: safeNumber(item.assigned),
      completed: safeNumber(item.completed),
    }));

    const managerTaskStatus = managerTaskStatusAgg.map((item) => ({
      status: formatLabel(item._id),
      count: safeNumber(item.count),
    }));

    const staffStatusDistribution = staffStatusAgg.map((item) => ({
      status: formatLabel(item._id),
      count: safeNumber(item.count),
    }));

    const occupancySummary = occupancyAgg[0] || {};
    const totalNights = safeNumber(occupancySummary.totalNights);
    const totalRooms = safeNumber(totalRoomsCount);
    const occupancyRate = totalRooms > 0
      ? Math.min(100, (totalNights / (totalRooms * totalDays)) * 100)
      : 0;

    // Generate risk alerts based on operational metrics
    const riskAlerts = generateRiskAlerts({
      overdueTasks,
      completionRate,
      totalStaffTasks,
      totalStaffCount,
      onDutyCount,
      departmentPerformance,
      inProgressTasks,
      completedStaffTasks,
    });

    res.json({
      success: true,
      data: {
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
          period: normalizedPeriod,
          totalDays,
        },
        financial: {
          summary: {
            totalRevenue: round(totalRevenueNet),
            totalRevenueGross: round(totalRevenueGross),
            totalExpenses: round(totalExpenses),
            netProfit: round(netProfit),
            profitMargin: round(profitMargin),
            avgDailyRevenue: round(avgDailyRevenue),
            occupancyRate: round(occupancyRate),
            revenueChange: revenueChange === null ? null : round(revenueChange),
            expenseChange: expenseChange === null ? null : round(expenseChange),
            profitChange: profitChange === null ? null : round(profitChange),
          },
          revenueVsExpenseTrend,
          revenueBySource,
          expenseByCategory,
          paymentMethods,
          departmentExpenses,
        },
        staff: {
          summary: {
            totalStaff: totalStaffCount,
            activeStaff: activeStaffCount,
            onDuty: onDutyCount,
            totalTasks: totalStaffTasks,
            completedTasks: completedStaffTasks,
            tasksInProgress: inProgressTasks,
            completionRate: round(completionRate),
            averageCompletionTime,
            avgResponseTime: averageCompletionTime, // Alias for frontend
            averageQualityScore,
            guestSatisfaction: round(averageQualityScore),
            overdueTasks: safeNumber(overdueTasks),
          },
          departmentPerformance,
          topPerformers,
          taskTrend,
          statusDistribution: staffStatusDistribution,
          riskAlerts,
        },
        managerTasks: {
          statusDistribution: managerTaskStatus,
        },
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Manager overview report error:", error);
    next(new AppError("Failed to generate manager overview report", 500));
  }
};
