// controllers/manager/performanceController.js
import Task from '../../models/Task.js';
import { User } from '../../models/User.js';
import StaffProfile from '../../models/profiles/StaffProfile.js';

// Get overall performance metrics
export const getPerformance = async (req, res) => {
  try {
    const { startDate, endDate, department, staffId } = req.query;
    
    // Set default date range if not provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Build match criteria
    const matchCriteria = {
      createdAt: { $gte: start, $lte: end }
    };

    if (department) {
      matchCriteria.department = department;
    }

    if (staffId) {
      matchCriteria.assignedTo = staffId;
    }

    // Get task performance metrics
    const taskMetrics = await Task.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          pendingTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          inProgressTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
          },
          overdueTasks: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ['$dueDate', new Date()] },
                    { $nin: ['$status', ['completed', 'cancelled']] }
                  ]
                },
                1,
                0
              ]
            }
          },
          averageCompletionTime: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                { $subtract: ['$completedAt', '$assignedAt'] },
                null
              ]
            }
          }
        }
      }
    ]);

    // Get department-wise performance
    const departmentMetrics = await Task.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$department',
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          averageCompletionTime: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                { $subtract: ['$completedAt', '$assignedAt'] },
                null
              ]
            }
          }
        }
      },
      {
        $project: {
          department: '$_id',
          totalTasks: 1,
          completedTasks: 1,
          completionRate: {
            $multiply: [
              { $divide: ['$completedTasks', '$totalTasks'] },
              100
            ]
          },
          averageCompletionHours: {
            $divide: ['$averageCompletionTime', 1000 * 60 * 60]
          }
        }
      }
    ]);

    // Get staff performance if not filtered by specific staff
    let staffMetrics = [];
    if (!staffId) {
      staffMetrics = await Task.aggregate([
        { $match: { ...matchCriteria, assignedTo: { $ne: null } } },
        {
          $group: {
            _id: '$assignedTo',
            totalTasks: { $sum: 1 },
            completedTasks: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            averageCompletionTime: {
              $avg: {
                $cond: [
                  { $eq: ['$status', 'completed'] },
                  { $subtract: ['$completedAt', '$assignedAt'] },
                  null
                ]
              }
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'staff'
          }
        },
        {
          $unwind: '$staff'
        },
        {
          $project: {
            staffId: '$_id',
            staffName: '$staff.name',
            totalTasks: 1,
            completedTasks: 1,
            completionRate: {
              $multiply: [
                { $divide: ['$completedTasks', '$totalTasks'] },
                100
              ]
            },
            averageCompletionHours: {
              $divide: ['$averageCompletionTime', 1000 * 60 * 60]
            }
          }
        }
      ]);
    }

    const metrics = taskMetrics[0] || {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      inProgressTasks: 0,
      overdueTasks: 0,
      averageCompletionTime: 0
    };

    res.json({
      success: true,
      data: {
        overall: {
          ...metrics,
          completionRate: metrics.totalTasks > 0 
            ? ((metrics.completedTasks / metrics.totalTasks) * 100).toFixed(2)
            : 0,
          averageCompletionHours: metrics.averageCompletionTime 
            ? (metrics.averageCompletionTime / (1000 * 60 * 60)).toFixed(2)
            : 0
        },
        departments: departmentMetrics,
        staff: staffMetrics,
        dateRange: {
          startDate: start,
          endDate: end
        }
      }
    });

  } catch (error) {
    console.error('Error fetching performance data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance data',
      error: error.message
    });
  }
};

// Get individual staff performance
export const getStaffPerformance = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { startDate, endDate } = req.query;

    // Set default date range
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get staff user info
    const staff = await User.findById(staffId).populate('staffProfile');
    if (!staff || staff.role !== 'staff') {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Get staff task metrics
    const staffMetrics = await Task.aggregate([
      {
        $match: {
          assignedTo: staffId,
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          pendingTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          inProgressTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
          },
          overdueTasks: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ['$dueDate', new Date()] },
                    { $nin: ['$status', ['completed', 'cancelled']] }
                  ]
                },
                1,
                0
              ]
            }
          },
          averageCompletionTime: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                { $subtract: ['$completedAt', '$assignedAt'] },
                null
              ]
            }
          }
        }
      }
    ]);

    // Get tasks by priority
    const tasksByPriority = await Task.aggregate([
      {
        $match: {
          assignedTo: staffId,
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const metrics = staffMetrics[0] || {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      inProgressTasks: 0,
      overdueTasks: 0,
      averageCompletionTime: 0
    };

    res.json({
      success: true,
      data: {
        staff: {
          id: staff._id,
          name: staff.name,
          email: staff.email,
          department: staff.staffProfile?.department,
          position: staff.staffProfile?.position
        },
        metrics: {
          ...metrics,
          completionRate: metrics.totalTasks > 0 
            ? ((metrics.completedTasks / metrics.totalTasks) * 100).toFixed(2)
            : 0,
          averageCompletionHours: metrics.averageCompletionTime 
            ? (metrics.averageCompletionTime / (1000 * 60 * 60)).toFixed(2)
            : 0
        },
        tasksByPriority: tasksByPriority.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        dateRange: {
          startDate: start,
          endDate: end
        }
      }
    });

  } catch (error) {
    console.error('Error fetching staff performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff performance',
      error: error.message
    });
  }
};

// Get performance trends over time
export const getPerformanceTrends = async (req, res) => {
  try {
    const { days = 30, department } = req.query;
    const endDate = new Date();
    const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

    // Build match criteria
    const matchCriteria = {
      createdAt: { $gte: startDate, $lte: endDate }
    };

    if (department) {
      matchCriteria.department = department;
    }

    // Get daily task trends
    const dailyTrends = await Task.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          tasksCreated: { $sum: 1 },
          tasksCompleted: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          tasksCreated: 1,
          tasksCompleted: 1
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        trends: dailyTrends,
        dateRange: {
          startDate,
          endDate
        }
      }
    });

  } catch (error) {
    console.error('Error fetching performance trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance trends',
      error: error.message
    });
  }
};
