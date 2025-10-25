/**
 * Database aggregation functions for report generation
 * Contains all MongoDB aggregation pipelines and queries
 */

import Revenue from "../../models/Revenue.js";
import Expense from "../../models/Expense.js";
import Booking from "../../models/Booking.js";
import Room from "../../models/Room.js";
import StaffTask from "../../models/StaffTask.js";
import ManagerTask from "../../models/ManagerTask.js";
import { User } from "../../models/User.js";
import { PERIOD_UNIT_MAP, safeNumber, DAY_IN_MS } from "./reportUtils.js";

/**
 * Aggregate revenue or expense trend over time
 * @param {Model} Model - Mongoose model to aggregate
 * @param {Object} match - Match conditions
 * @param {string} dateField - Field name containing the date
 * @param {string} period - Period type (daily, weekly, monthly, etc.)
 * @returns {Promise<Array>} Aggregated trend data
 */
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

/**
 * Aggregate revenue trend over time
 * @param {Object} match - Match conditions
 * @param {string} period - Period type
 * @returns {Promise<Array>} Revenue trend data
 */
export const aggregateRevenueTrend = (match, period) => {
  return aggregateTrend(Revenue, match, "serviceDate", period);
};

/**
 * Aggregate expense trend over time
 * @param {Object} match - Match conditions
 * @param {string} period - Period type
 * @returns {Promise<Array>} Expense trend data
 */
export const aggregateExpenseTrend = (match, period) => {
  return aggregateTrend(Expense, match, "paidAt", period);
};

/**
 * Aggregate staff task trend over time (assigned vs completed)
 * @param {Object} match - Match conditions
 * @param {string} period - Period type (daily, weekly, monthly, etc.)
 * @returns {Promise<Array>} Aggregated task trend data
 */
export const aggregateTaskTrend = async (match, period) => {
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

/**
 * Get staff counts (total, active, on duty)
 * @returns {Promise<Object>} Staff counts
 */
export const getStaffCounts = async () => {
  const [totalStaffCount, activeStaffCount, onDutyCount] = await Promise.all([
    User.countDocuments({ role: 'staff' }),
    User.countDocuments({ role: 'staff', status: 'active' }),
    User.countDocuments({ role: 'staff', status: 'active', isOnline: true }),
  ]);

  return { totalStaffCount, activeStaffCount, onDutyCount };
};

/**
 * Aggregate revenue summary
 * @param {Object} match - Match conditions
 * @returns {Promise<Object>} Revenue summary
 */
export const aggregateRevenueSummary = (match) => {
  return Revenue.aggregate([
    { $match: match },
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
  ]);
};

/**
 * Aggregate expense summary
 * @param {Object} match - Match conditions
 * @returns {Promise<Object>} Expense summary
 */
export const aggregateExpenseSummary = (match) => {
  return Expense.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amount" },
        averageAmount: { $avg: "$amount" },
      },
    },
  ]);
};

/**
 * Aggregate revenue by source
 * @param {Object} match - Match conditions
 * @returns {Promise<Array>} Revenue by source
 */
export const aggregateRevenueBySource = (match) => {
  return Revenue.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$source",
        value: { $sum: "$amount" },
      },
    },
    { $sort: { value: -1 } },
  ]);
};

/**
 * Aggregate expense by category
 * @param {Object} match - Match conditions
 * @returns {Promise<Array>} Expense by category
 */
export const aggregateExpenseByCategory = (match) => {
  return Expense.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$category",
        value: { $sum: "$amount" },
      },
    },
    { $sort: { value: -1 } },
  ]);
};

/**
 * Aggregate payment methods distribution
 * @param {Object} match - Match conditions
 * @returns {Promise<Array>} Payment methods distribution
 */
export const aggregatePaymentMethods = (match) => {
  return Revenue.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$paymentMethod",
        value: { $sum: "$amount" },
      },
    },
    { $sort: { value: -1 } },
  ]);
};

/**
 * Aggregate department expenses
 * @param {Object} match - Match conditions
 * @returns {Promise<Array>} Department expenses
 */
export const aggregateDepartmentExpenses = (match) => {
  return Expense.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$department",
        value: { $sum: "$amount" },
      },
    },
    { $sort: { value: -1 } },
  ]);
};

/**
 * Aggregate staff task summary
 * @param {Object} match - Match conditions
 * @returns {Promise<Object>} Staff task summary
 */
export const aggregateStaffTaskSummary = (match) => {
  return StaffTask.aggregate([
    { $match: match },
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
  ]);
};

/**
 * Aggregate staff department performance
 * @param {Object} match - Match conditions
 * @returns {Promise<Array>} Department performance data
 */
export const aggregateStaffDepartmentPerformance = (match) => {
  return StaffTask.aggregate([
    { $match: match },
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
  ]);
};

/**
 * Aggregate top performing staff members
 * @param {Object} match - Match conditions
 * @returns {Promise<Array>} Top performers data
 */
export const aggregateTopPerformers = (match) => {
  return StaffTask.aggregate([
    {
      $match: {
        ...match,
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
  ]);
};

/**
 * Aggregate manager task status distribution
 * @param {Object} match - Match conditions
 * @returns {Promise<Array>} Manager task status distribution
 */
export const aggregateManagerTaskStatus = (match) => {
  return ManagerTask.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

/**
 * Aggregate staff task status distribution
 * @param {Object} match - Match conditions
 * @returns {Promise<Array>} Staff task status distribution
 */
export const aggregateStaffTaskStatus = (match) => {
  return StaffTask.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

/**
 * Aggregate occupancy data from bookings
 * @param {Date} start - Start date
 * @param {Date} end - End date
 * @returns {Promise<Object>} Occupancy data
 */
export const aggregateOccupancy = (start, end) => {
  return Booking.aggregate([
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
  ]);
};

/**
 * Get total available rooms count
 * @returns {Promise<number>} Total rooms count
 */
export const getTotalRoomsCount = () => {
  return Room.countDocuments({ status: { $ne: "OutOfService" } });
};

/**
 * Get count of overdue tasks
 * @param {Object} departmentFilter - Department filter
 * @param {Date} start - Start date
 * @param {Date} end - End date
 * @param {Date} now - Current date
 * @returns {Promise<number>} Count of overdue tasks
 */
export const getOverdueTasksCount = (departmentFilter, start, end, now) => {
  return StaffTask.countDocuments({
    ...departmentFilter,
    status: { $nin: ["completed", "cancelled"] },
    dueDate: { $exists: true, $lt: now },
    createdAt: { $gte: start, $lte: end },
  });
};
