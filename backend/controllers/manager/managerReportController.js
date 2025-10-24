import Revenue from "../../models/Revenue.js";
import Expense from "../../models/Expense.js";
import Booking from "../../models/Booking.js";
import Room from "../../models/Room.js";
import StaffTask from "../../models/StaffTask.js";
import ManagerTask from "../../models/ManagerTask.js";
import { User } from "../../models/User.js";
import { AppError } from "../../services/error/AppError.js";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const PERIOD_UNIT_MAP = {
  daily: "day",
  weekly: "week",
  monthly: "month",
  quarterly: "quarter",
  yearly: "year",
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseArrayParam = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
};

const resolveDateRange = (startValue, endValue) => {
  let end = parseDate(endValue) || new Date();
  let start = parseDate(startValue);

  if (!start) {
    start = new Date(end);
    start.setDate(start.getDate() - 29);
  }

  if (start > end) {
    const temp = start;
    start = end;
    end = temp;
  }

  if (start.getTime() === end.getTime()) {
    const adjusted = new Date(start);
    adjusted.setDate(adjusted.getDate() - 1);
    start = adjusted;
  }

  return { start, end };
};

const calculatePercentageChange = (current, previous) => {
  if (!Number.isFinite(previous) || previous === 0) {
    return null;
  }
  if (!Number.isFinite(current)) {
    return null;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
};

const safeNumber = (value) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return value;
};

const round = (value, decimals = 2) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const formatLabel = (label) => {
  if (!label) return "Unknown";
  return String(label)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const aggregateTrend = async (Model, match, dateField, period) => {
  const unit = PERIOD_UNIT_MAP[period] || "month";
  const dateTrunc = {
    $dateTrunc: {
      date: `$${dateField}`,
      unit,
    },
  };

  if (unit === "week") {
    dateTrunc.$dateTrunc.startOfWeek = "monday";
  }

  const docs = await Model.aggregate([
    {
      $match: {
        ...match,
        [dateField]: { $exists: true, $ne: null },
      },
    },
    {
      $group: {
        _id: dateTrunc,
        total: { $sum: "$amount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return docs
    .filter((doc) => doc._id)
    .map((doc) => ({
      date: doc._id instanceof Date ? doc._id : new Date(doc._id),
      total: safeNumber(doc.total),
    }));
};

const aggregateTaskTrend = async (match, period) => {
  const unit = PERIOD_UNIT_MAP[period] || "month";
  const dateTrunc = {
    $dateTrunc: {
      date: "$createdAt",
      unit,
    },
  };

  if (unit === "week") {
    dateTrunc.$dateTrunc.startOfWeek = "monday";
  }

  const docs = await StaffTask.aggregate([
    { $match: { ...match, createdAt: { $exists: true, $ne: null } } },
    {
      $group: {
        _id: dateTrunc,
        assigned: { $sum: 1 },
        completed: {
          $sum: {
            $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
          },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return docs
    .filter((doc) => doc._id)
    .map((doc) => ({
      date: doc._id instanceof Date ? doc._id : new Date(doc._id),
      assigned: safeNumber(doc.assigned),
      completed: safeNumber(doc.completed),
    }));
};

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

    // Get staff counts
    const totalStaffCount = await User.countDocuments({ role: 'staff' });
    const activeStaffCount = await User.countDocuments({ role: 'staff', status: 'active' });
    const onDutyCount = await User.countDocuments({ role: 'staff', status: 'active', isOnline: true });

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
      Revenue.aggregate([
        { $match: revenueMatch },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
            netRevenue: {
              $sum: {
                $subtract: ["$amount", { $ifNull: ["$refundAmount", 0] }],
              },
            },
            averageAmount: { $avg: "$amount" },
          },
        },
      ]),
      Expense.aggregate([
        { $match: expenseMatch },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
            averageAmount: { $avg: "$amount" },
          },
        },
      ]),
      aggregateTrend(Revenue, revenueMatch, "serviceDate", normalizedPeriod),
      aggregateTrend(Expense, expenseMatch, "paidAt", normalizedPeriod),
      Revenue.aggregate([
        { $match: revenueMatch },
        {
          $group: {
            _id: "$source",
            value: { $sum: "$amount" },
          },
        },
        { $sort: { value: -1 } },
      ]),
      Expense.aggregate([
        { $match: expenseMatch },
        {
          $group: {
            _id: "$category",
            value: { $sum: "$amount" },
          },
        },
        { $sort: { value: -1 } },
      ]),
      Revenue.aggregate([
        { $match: revenueMatch },
        {
          $group: {
            _id: "$paymentMethod",
            value: { $sum: "$amount" },
          },
        },
        { $sort: { value: -1 } },
      ]),
      Expense.aggregate([
        { $match: expenseMatch },
        {
          $group: {
            _id: "$department",
            value: { $sum: "$amount" },
          },
        },
        { $sort: { value: -1 } },
      ]),
      StaffTask.aggregate([
        { $match: staffMatch },
        {
          $group: {
            _id: null,
            totalTasks: { $sum: 1 },
            completedTasks: {
              $sum: {
                $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
              },
            },
            inProgressTasks: {
              $sum: {
                $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0],
              },
            },
            avgCompletionTime: { $avg: "$actualDuration" },
            avgQualityScore: {
              $avg: "$performanceMetrics.qualityRating",
            },
          },
        },
      ]),
      StaffTask.aggregate([
        { $match: staffMatch },
        {
          $group: {
            _id: "$department",
            totalTasks: { $sum: 1 },
            completedTasks: {
              $sum: {
                $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
              },
            },
            avgCompletionTime: { $avg: "$actualDuration" },
          },
        },
        { $sort: { completedTasks: -1 } },
      ]),
      StaffTask.aggregate([
        {
          $match: {
            ...staffMatch,
            assignedTo: { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: "$assignedTo",
            totalTasks: { $sum: 1 },
            completedTasks: {
              $sum: {
                $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
              },
            },
            avgCompletionTime: { $avg: "$actualDuration" },
            avgQualityScore: {
              $avg: "$performanceMetrics.qualityRating",
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "staff",
          },
        },
        {
          $project: {
            staffId: "$_id",
            totalTasks: 1,
            completedTasks: 1,
            avgCompletionTime: 1,
            avgQualityScore: 1,
            name: { $arrayElemAt: ["$staff.name", 0] },
            email: { $arrayElemAt: ["$staff.email", 0] },
            role: { $arrayElemAt: ["$staff.role", 0] },
          },
        },
        {
          $addFields: {
            completionRate: {
              $cond: [
                { $gt: ["$totalTasks", 0] },
                {
                  $multiply: [
                    { $divide: ["$completedTasks", "$totalTasks"] },
                    100,
                  ],
                },
                0,
              ],
            },
          },
        },
        { $sort: { completionRate: -1, completedTasks: -1 } },
        { $limit: 8 },
      ]),
      aggregateTaskTrend(staffMatch, normalizedPeriod),
      ManagerTask.aggregate([
        { $match: managerTaskMatch },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      StaffTask.aggregate([
        { $match: staffMatch },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      Booking.aggregate([
        {
          $match: {
            status: {
              $in: [
                "Approved - Payment Pending",
                "Approved - Payment Processing",
                "Confirmed",
                "Completed",
              ],
            },
            checkIn: { $lte: end },
            checkOut: { $gte: start },
            isActive: { $ne: false },
          },
        },
        {
          $project: {
            nights: {
              $max: [
                1,
                {
                  $ceil: {
                    $divide: [
                      { $subtract: ["$checkOut", "$checkIn"] },
                      DAY_IN_MS,
                    ],
                  },
                },
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalNights: { $sum: "$nights" },
            totalBookings: { $sum: 1 },
          },
        },
      ]),
      Room.countDocuments({ status: { $ne: "OutOfService" } }),
      Revenue.aggregate([
        { $match: previousRevenueMatch },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
            netRevenue: {
              $sum: {
                $subtract: ["$amount", { $ifNull: ["$refundAmount", 0] }],
              },
            },
          },
        },
      ]),
      Expense.aggregate([
        { $match: previousExpenseMatch },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
          },
        },
      ]),
      StaffTask.countDocuments({
        ...departmentFilter,
        status: { $nin: ["completed", "cancelled"] },
        dueDate: { $exists: true, $lt: now },
        createdAt: { $gte: start, $lte: end },
      }),
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

    // Generate risk alerts based on real data
    const riskAlerts = [];
    
    // Alert for overdue tasks
    if (overdueTasks > 0) {
      riskAlerts.push({
        id: `alert-overdue-${Date.now()}`,
        title: overdueTasks > 5 ? "Critical task backlog" : "Tasks overdue",
        detail: `${overdueTasks} task${overdueTasks > 1 ? 's' : ''} past due date requiring immediate attention`,
        severity: overdueTasks > 5 ? "high" : "medium",
      });
    }
    
    // Alert for low completion rate
    if (completionRate < 75 && totalStaffTasks > 10) {
      riskAlerts.push({
        id: `alert-completion-${Date.now()}`,
        title: "Low task completion rate",
        detail: `Overall completion rate at ${Math.round(completionRate)}%, below 75% threshold`,
        severity: completionRate < 60 ? "high" : "medium",
      });
    }
    
    // Alert for staff availability
    if (totalStaffCount > 0 && (onDutyCount / totalStaffCount) < 0.4) {
      riskAlerts.push({
        id: `alert-staffing-${Date.now()}`,
        title: "Low staff availability",
        detail: `Only ${onDutyCount} out of ${totalStaffCount} staff members currently on duty`,
        severity: "medium",
      });
    }
    
    // Alert for department performance issues
    const underperformingDepts = departmentPerformance.filter(dept => 
      dept.completionRate < 70 && dept.totalTasks > 5
    );
    if (underperformingDepts.length > 0) {
      const deptNames = underperformingDepts.map(d => d.department).join(", ");
      riskAlerts.push({
        id: `alert-dept-${Date.now()}`,
        title: "Department performance concern",
        detail: `${deptNames} showing completion rates below 70%`,
        severity: "medium",
      });
    }
    
    // Alert for high in-progress tasks
    if (inProgressTasks > completedStaffTasks && totalStaffTasks > 20) {
      riskAlerts.push({
        id: `alert-progress-${Date.now()}`,
        title: "High work-in-progress",
        detail: `${inProgressTasks} tasks in progress, may indicate resource bottleneck`,
        severity: "low",
      });
    }

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
