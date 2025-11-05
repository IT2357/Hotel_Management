import StaffTask from '../../models/StaffTask.js';
import ManagerTask from '../../models/ManagerTask.js';
import {User} from '../../models/User.js';
import { AppError } from '../../services/error/AppError.js';

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

/**
 * Get task performance reports
 */
export const getTaskReports = async (req, res, next) => {
  try {
    const { startDate, endDate, department, reportType = "overview" } = req.query;
    const departments = parseArrayParam(department);
    const { start, end } = resolveDateRange(startDate, endDate);

    const departmentFilter = departments.length
      ? { department: { $in: departments } }
      : {};

    const matchFilter = {
      createdAt: { $gte: start, $lte: end },
      ...departmentFilter,
    };

    // Get task summary
    const taskSummary = await StaffTask.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
            },
          },
          pendingTasks: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
            },
          },
          assignedTasks: {
            $sum: {
              $cond: [{ $eq: ["$status", "assigned"] }, 1, 0],
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
    ]);

    const summary = taskSummary[0] || {};
    const totalTasks = safeNumber(summary.totalTasks);
    const completedTasks = safeNumber(summary.completedTasks);
    const pendingTasks = safeNumber(summary.pendingTasks);
    const assignedTasks = safeNumber(summary.assignedTasks);
    const inProgressTasks = safeNumber(summary.inProgressTasks);
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Get task trends by status
    const taskTrends = await StaffTask.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const statusDistribution = taskTrends.map((item) => ({
      status: formatLabel(item._id),
      count: safeNumber(item.count),
    }));

    // Get department performance
    const departmentPerformance = await StaffTask.aggregate([
      { $match: matchFilter },
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
      { $sort: { completionRate: -1 } },
    ]);

    const departmentStats = departmentPerformance.map((item) => ({
      department: formatLabel(item._id),
      totalTasks: safeNumber(item.totalTasks),
      completedTasks: safeNumber(item.completedTasks),
      completionRate: round(safeNumber(item.completionRate)),
      avgCompletionTime: round(safeNumber(item.avgCompletionTime)),
    }));

    // Get top performers
    const topPerformers = await StaffTask.aggregate([
      {
        $match: {
          ...matchFilter,
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
      { $limit: 10 },
    ]);

    const performers = topPerformers.map((item) => ({
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

    res.json({
      success: true,
      data: {
        summary: {
          totalTasks,
          completedTasks,
          pendingTasks,
          assignedTasks,
          inProgressTasks,
          completionRate: round(completionRate),
          avgCompletionTime: round(safeNumber(summary.avgCompletionTime)),
          avgQualityScore: round(safeNumber(summary.avgQualityScore)),
        },
        statusDistribution,
        departmentPerformance: departmentStats,
        topPerformers: performers,
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Task reports error:", error);
    next(new AppError("Failed to generate task reports", 500));
  }
};

/**
 * Get staff workload reports
 */
export const getWorkloadReport = async (req, res, next) => {
  try {
    const { startDate, endDate, department } = req.query;
    const departments = parseArrayParam(department);
    const { start, end } = resolveDateRange(startDate, endDate);

    const departmentFilter = departments.length
      ? { department: { $in: departments } }
      : {};

    const matchFilter = {
      createdAt: { $gte: start, $lte: end },
      ...departmentFilter,
    };

    // Get department performance
    const departmentPerformance = await StaffTask.aggregate([
      { $match: matchFilter },
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
      { $sort: { completionRate: -1 } },
    ]);

    const departmentStats = departmentPerformance.map((item) => ({
      department: formatLabel(item._id),
      totalTasks: safeNumber(item.totalTasks),
      completedTasks: safeNumber(item.completedTasks),
      completionRate: round(safeNumber(item.completionRate)),
      avgCompletionTime: round(safeNumber(item.avgCompletionTime)),
    }));

    res.json({
      success: true,
      data: {
        departmentPerformance: departmentStats,
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Workload report error:", error);
    next(new AppError("Failed to generate workload report", 500));
  }
};

/**
 * Get delayed tasks report
 */
export const getDelayedTasksReport = async (req, res, next) => {
  try {
    const { department, severity = "all" } = req.query;
    const departments = parseArrayParam(department);
    const now = new Date();

    const departmentFilter = departments.length
      ? { department: { $in: departments } }
      : {};

    const severityFilter = severity !== "all" ? { priority: severity } : {};

    // Get delayed tasks by severity
    const delayedTasks = await StaffTask.aggregate([
      {
        $match: {
          ...departmentFilter,
          ...severityFilter,
          status: { $nin: ["completed", "cancelled"] },
          dueDate: { $exists: true, $lt: now },
        },
      },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
          tasks: {
            $push: {
              id: "$_id",
              title: "$title",
              department: "$department",
              priority: "$priority",
              dueDate: "$dueDate",
              assignedTo: "$assignedTo",
              daysOverdue: {
                $divide: [
                  { $subtract: [now, "$dueDate"] },
                  1000 * 60 * 60 * 24,
                ],
              },
            },
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    delayedTasks.forEach((item) => {
      const priority = item._id?.toLowerCase() || "medium";
      if (priority in severityCounts) {
        severityCounts[priority] = safeNumber(item.count);
      }
    });

    res.json({
      success: true,
      data: {
        summary: severityCounts,
        delayedTasks: delayedTasks.map((item) => ({
          priority: formatLabel(item._id),
          count: safeNumber(item.count),
          tasks: item.tasks.map((task) => ({
            id: task.id,
            title: task.title,
            department: formatLabel(task.department),
            priority: formatLabel(task.priority),
            dueDate: task.dueDate,
            assignedTo: task.assignedTo,
            daysOverdue: Math.ceil(safeNumber(task.daysOverdue)),
          })),
        })),
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Delayed tasks report error:", error);
    next(new AppError("Failed to generate delayed tasks report", 500));
  }
};
