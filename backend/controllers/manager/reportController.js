import Task from "../../models/Task.js";
import TaskFeedback from "../../models/TaskFeedback.js";
import { Staff } from "../../models/User.js";
import StaffProfile from "../../models/profiles/StaffProfile.js";
import mongoose from "mongoose";

/**
 * Report Controller for Hotel Task Management System
 * Handles all reporting and analytics operations
 */

// @desc    Get comprehensive task reports
// @route   GET /api/reports/tasks
// @access  Manager, Admin
export const getTaskReports = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      department,
      staffId,
      reportType = 'overview'
    } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // Build base match stage
    let baseMatch = { isActive: true };
    if (Object.keys(dateFilter).length > 0) {
      baseMatch.createdAt = dateFilter;
    }
    if (department) baseMatch.department = department;
    if (staffId) baseMatch.assignedTo = new mongoose.Types.ObjectId(staffId);

    let reportData = {};

    switch (reportType) {
      case 'overview':
        reportData = await getOverviewReport(baseMatch);
        break;
      case 'performance':
        reportData = await getPerformanceReport(baseMatch);
        break;
      case 'department':
        reportData = await getDepartmentReport(baseMatch);
        break;
      case 'staff':
        reportData = await getStaffReport(baseMatch);
        break;
      case 'guest-satisfaction':
        reportData = await getGuestSatisfactionReport(baseMatch);
        break;
      default:
        reportData = await getOverviewReport(baseMatch);
    }

    res.status(200).json({
      success: true,
      data: reportData,
      filters: { startDate, endDate, department, staffId, reportType }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error generating task reports",
      error: error.message
    });
  }
};

// Overview Report - High-level statistics
const getOverviewReport = async (baseMatch) => {
  const overview = await Task.aggregate([
    { $match: baseMatch },
    {
      $group: {
        _id: null,
        totalTasks: { $sum: 1 },
        completedTasks: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
        },
        pendingTasks: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
        },
        assignedTasks: {
          $sum: { $cond: [{ $eq: ["$status", "assigned"] }, 1, 0] }
        },
        inProgressTasks: {
          $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] }
        },
        averageCompletionTime: { $avg: "$actualDuration" },
        averageGuestRating: { $avg: "$guestRating" },
        overdueTasks: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ["$dueDate", null] },
                  { $gt: [new Date(), "$dueDate"] },
                  { $ne: ["$status", "completed"] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  // Task completion trend over time
  const completionTrend = await Task.aggregate([
    { $match: { ...baseMatch, status: "completed" } },
    {
      $group: {
        _id: {
          year: { $year: "$completedAt" },
          month: { $month: "$completedAt" },
          day: { $dayOfMonth: "$completedAt" }
        },
        count: { $sum: 1 },
        avgDuration: { $avg: "$actualDuration" },
        avgRating: { $avg: "$guestRating" }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
  ]);

  // Task type distribution
  const typeDistribution = await Task.aggregate([
    { $match: baseMatch },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
        },
        avgDuration: { $avg: "$actualDuration" }
      }
    }
  ]);

  return {
    overview: overview[0] || {},
    completionTrend,
    typeDistribution
  };
};

// Performance Report - Task performance metrics
const getPerformanceReport = async (baseMatch) => {
  // Task performance by priority
  const priorityPerformance = await Task.aggregate([
    { $match: baseMatch },
    {
      $group: {
        _id: "$priority",
        totalTasks: { $sum: 1 },
        completedTasks: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
        },
        avgCompletionTime: { $avg: "$actualDuration" },
        avgGuestRating: { $avg: "$guestRating" },
        onTimeCompletion: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$status", "completed"] },
                  { $ne: ["$dueDate", null] },
                  { $lte: ["$completedAt", "$dueDate"] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  // Response time analysis
  const responseTimeAnalysis = await Task.aggregate([
    { 
      $match: { 
        ...baseMatch,
        assignedAt: { $exists: true },
        startedAt: { $exists: true }
      }
    },
    {
      $project: {
        responseTime: {
          $divide: [
            { $subtract: ["$assignedAt", "$requestedAt"] },
            1000 * 60 // Convert to minutes
          ]
        },
        processingTime: {
          $divide: [
            { $subtract: ["$startedAt", "$assignedAt"] },
            1000 * 60
          ]
        },
        department: 1,
        priority: 1
      }
    },
    {
      $group: {
        _id: { department: "$department", priority: "$priority" },
        avgResponseTime: { $avg: "$responseTime" },
        avgProcessingTime: { $avg: "$processingTime" },
        taskCount: { $sum: 1 }
      }
    }
  ]);

  return {
    priorityPerformance,
    responseTimeAnalysis
  };
};

// Department Report - Department-wise analysis
const getDepartmentReport = async (baseMatch) => {
  const departmentStats = await Task.aggregate([
    { $match: baseMatch },
    {
      $group: {
        _id: "$department",
        totalTasks: { $sum: 1 },
        completedTasks: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
        },
        pendingTasks: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
        },
        avgCompletionTime: { $avg: "$actualDuration" },
        avgGuestRating: { $avg: "$guestRating" },
        taskTypes: { $addToSet: "$type" }
      }
    }
  ]);

  // Task distribution by department over time
  const departmentTrend = await Task.aggregate([
    { $match: baseMatch },
    {
      $group: {
        _id: {
          department: "$department",
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ]);

  return {
    departmentStats,
    departmentTrend
  };
};

// Staff Report - Individual staff performance
const getStaffReport = async (baseMatch) => {
  const staffPerformance = await Task.aggregate([
    { 
      $match: { 
        ...baseMatch,
        assignedTo: { $exists: true }
      }
    },
    {
      $group: {
        _id: "$assignedTo",
        totalAssigned: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
        },
        inProgress: {
          $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] }
        },
        avgCompletionTime: { $avg: "$actualDuration" },
        avgGuestRating: { $avg: "$guestRating" },
        onTimeCompletions: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$status", "completed"] },
                  { $ne: ["$dueDate", null] },
                  { $lte: ["$completedAt", "$dueDate"] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "staffInfo"
      }
    },
    {
      $project: {
        staffName: { $arrayElemAt: ["$staffInfo.name", 0] },
        staffEmail: { $arrayElemAt: ["$staffInfo.email", 0] },
        totalAssigned: 1,
        completed: 1,
        inProgress: 1,
        avgCompletionTime: 1,
        avgGuestRating: 1,
        onTimeCompletions: 1,
        completionRate: {
          $multiply: [
            { $divide: ["$completed", "$totalAssigned"] },
            100
          ]
        },
        onTimeRate: {
          $multiply: [
            { $divide: ["$onTimeCompletions", "$completed"] },
            100
          ]
        }
      }
    },
    { $sort: { completionRate: -1 } }
  ]);

  return { staffPerformance };
};

// Guest Satisfaction Report
const getGuestSatisfactionReport = async (baseMatch) => {
  const satisfactionStats = await Task.aggregate([
    { 
      $match: { 
        ...baseMatch,
        guestRating: { $exists: true }
      }
    },
    {
      $group: {
        _id: null,
        totalRatings: { $sum: 1 },
        averageRating: { $avg: "$guestRating" },
        ratingDistribution: {
          $push: "$guestRating"
        },
        departmentRatings: {
          $push: {
            department: "$department",
            rating: "$guestRating"
          }
        }
      }
    }
  ]);

  // Rating distribution by department
  const departmentSatisfaction = await Task.aggregate([
    { 
      $match: { 
        ...baseMatch,
        guestRating: { $exists: true }
      }
    },
    {
      $group: {
        _id: "$department",
        avgRating: { $avg: "$guestRating" },
        totalRatings: { $sum: 1 },
        ratingBreakdown: {
          $push: "$guestRating"
        }
      }
    }
  ]);

  // Feedback analysis
  const feedbackStats = await TaskFeedback.aggregate([
    {
      $lookup: {
        from: "tasks",
        localField: "taskId",
        foreignField: "_id",
        as: "task"
      }
    },
    {
      $match: {
        "task.createdAt": baseMatch.createdAt || { $exists: true },
        feedbackType: "guest-to-staff",
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        totalFeedback: { $sum: 1 },
        avgRating: { $avg: "$rating" },
        positiveFeecback: {
          $sum: { $cond: [{ $gte: ["$rating", 4] }, 1, 0] }
        },
        negativeFeecback: {
          $sum: { $cond: [{ $lte: ["$rating", 2] }, 1, 0] }
        }
      }
    }
  ]);

  return {
    satisfactionStats: satisfactionStats[0] || {},
    departmentSatisfaction,
    feedbackStats: feedbackStats[0] || {}
  };
};

// @desc    Get staff workload report
// @route   GET /api/reports/workload
// @access  Manager, Admin
export const getWorkloadReport = async (req, res) => {
  try {
    const { department, startDate, endDate } = req.query;

    let departmentFilter = {};
    if (department) {
      const departmentMap = {
        'Kitchen': 'Kitchen',
        'Services': 'Service',
        'Maintenance': 'Maintenance',
        'Cleaning': 'Housekeeping'
      };
      departmentFilter.department = departmentMap[department];
    }

    // Get all active staff with their profiles
    const staffProfiles = await StaffProfile.find({
      isActive: true,
      ...departmentFilter
    }).populate('userId', 'name email');

    const workloadData = [];

    for (const profile of staffProfiles) {
      const staffId = profile.userId._id;
      
      // Build task filter
      let taskFilter = {
        assignedTo: staffId,
        isActive: true
      };

      if (startDate || endDate) {
        taskFilter.createdAt = {};
        if (startDate) taskFilter.createdAt.$gte = new Date(startDate);
        if (endDate) taskFilter.createdAt.$lte = new Date(endDate);
      }

      // Get task statistics for this staff member
      const taskStats = await Task.aggregate([
        { $match: taskFilter },
        {
          $group: {
            _id: null,
            totalTasks: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
            },
            inProgress: {
              $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] }
            },
            pending: {
              $sum: { $cond: [{ $eq: ["$status", "assigned"] }, 1, 0] }
            },
            avgCompletionTime: { $avg: "$actualDuration" },
            totalWorkHours: { $sum: "$actualDuration" }
          }
        }
      ]);

      const stats = taskStats[0] || {
        totalTasks: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        avgCompletionTime: 0,
        totalWorkHours: 0
      };

      workloadData.push({
        staffId,
        name: profile.userId.name,
        email: profile.userId.email,
        department: profile.department,
        position: profile.position,
        ...stats,
        workloadScore: calculateWorkloadScore(stats)
      });
    }

    // Sort by workload score (highest first)
    workloadData.sort((a, b) => b.workloadScore - a.workloadScore);

    res.status(200).json({
      success: true,
      data: {
        staff: workloadData,
        summary: {
          totalStaff: workloadData.length,
          averageWorkload: workloadData.reduce((acc, staff) => acc + staff.workloadScore, 0) / workloadData.length,
          overloadedStaff: workloadData.filter(staff => staff.workloadScore > 80).length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error generating workload report",
      error: error.message
    });
  }
};

// Helper function to calculate workload score
const calculateWorkloadScore = (stats) => {
  const { totalTasks, inProgress, pending, avgCompletionTime } = stats;
  
  let score = 0;
  score += totalTasks * 5; // Base score for total tasks
  score += inProgress * 15; // Higher weight for tasks in progress
  score += pending * 10; // Weight for pending tasks
  
  // Adjust for efficiency (lower completion time = better)
  if (avgCompletionTime > 0) {
    score += (avgCompletionTime / 60) * 2; // Convert minutes to hours
  }
  
  return Math.min(Math.round(score), 100); // Cap at 100
};

// @desc    Get delayed tasks report
// @route   GET /api/reports/delayed
// @access  Manager, Admin
export const getDelayedTasksReport = async (req, res) => {
  try {
    const { department, severity = 'all' } = req.query;

    const currentDate = new Date();
    let matchStage = {
      isActive: true,
      status: { $in: ['pending', 'assigned', 'in-progress'] },
      dueDate: { $exists: true, $lt: currentDate }
    };

    if (department) matchStage.department = department;

    const delayedTasks = await Task.find(matchStage)
      .populate('guestId', 'name phone')
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name')
      .sort({ dueDate: 1 });

    // Categorize by delay severity
    const categorizedTasks = {
      critical: [], // > 24 hours overdue
      high: [],     // 12-24 hours overdue
      medium: [],   // 6-12 hours overdue
      low: []       // < 6 hours overdue
    };

    delayedTasks.forEach(task => {
      const hoursOverdue = (currentDate - task.dueDate) / (1000 * 60 * 60);
      
      if (hoursOverdue > 24) categorizedTasks.critical.push(task);
      else if (hoursOverdue > 12) categorizedTasks.high.push(task);
      else if (hoursOverdue > 6) categorizedTasks.medium.push(task);
      else categorizedTasks.low.push(task);
    });

    // Filter by severity if specified
    let filteredTasks = delayedTasks;
    if (severity !== 'all') {
      filteredTasks = categorizedTasks[severity] || [];
    }

    res.status(200).json({
      success: true,
      data: {
        tasks: filteredTasks,
        summary: {
          total: delayedTasks.length,
          critical: categorizedTasks.critical.length,
          high: categorizedTasks.high.length,
          medium: categorizedTasks.medium.length,
          low: categorizedTasks.low.length
        },
        categorized: severity === 'all' ? categorizedTasks : undefined
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error generating delayed tasks report",
      error: error.message
    });
  }
};

// @desc    Export report data
// @route   GET /api/reports/export
// @access  Manager, Admin
export const exportReport = async (req, res) => {
  try {
    const { type, format = 'json', ...filters } = req.query;

    let reportData;
    switch (type) {
      case 'tasks':
        reportData = await getTaskReports({ query: filters }, res);
        break;
      case 'workload':
        reportData = await getWorkloadReport({ query: filters }, res);
        break;
      case 'delayed':
        reportData = await getDelayedTasksReport({ query: filters }, res);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid report type"
        });
    }

    // For now, return JSON format
    // In a real implementation, you might want to support CSV, Excel, etc.
    res.status(200).json({
      success: true,
      message: `${type} report exported successfully`,
      format,
      data: reportData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error exporting report",
      error: error.message
    });
  }
};