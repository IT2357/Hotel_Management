// controllers/manager/dashboardController.js
import Task from '../../models/Task.js';
import { User } from '../../models/User.js';
import StaffProfile from '../../models/profiles/StaffProfile.js';

// Get dashboard data for manager
export const getDashboardData = async (req, res) => {
  try {
    // Get date range for statistics (default to last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Get task statistics
    const taskStats = await Promise.all([
      // Total tasks
      Task.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
      }),
      
      // Tasks by status
      Task.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Tasks by department
      Task.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$department',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Tasks by priority
      Task.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Get staff statistics
    const staffStats = await Promise.all([
      // Total active staff
      User.countDocuments({ role: 'staff', isActive: true }),
      
      // Staff by department
      StaffProfile.aggregate([
        {
          $group: {
            _id: '$department',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Staff by availability
      StaffProfile.aggregate([
        {
          $group: {
            _id: '$availability',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Get recent tasks (last 10)
    const recentTasks = await Task.find()
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title description status priority department guestName roomNumber createdAt dueDate');

    // Get overdue tasks
    const overdueTasks = await Task.find({
      dueDate: { $lt: new Date() },
      status: { $nin: ['completed', 'cancelled'] }
    })
      .populate('assignedTo', 'name email')
      .sort({ dueDate: 1 })
      .limit(5)
      .select('title description status priority department guestName roomNumber dueDate');

    // Format the response
    const dashboardData = {
      taskStatistics: {
        total: taskStats[0] || 0,
        byStatus: taskStats[1].reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byDepartment: taskStats[2].reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byPriority: taskStats[3].reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },
      staffStatistics: {
        totalActive: staffStats[0] || 0,
        byDepartment: staffStats[1].reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byAvailability: staffStats[2].reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },
      recentTasks,
      overdueTasks,
      dateRange: {
        startDate,
        endDate
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
};

// Get quick statistics for dashboard widgets
export const getQuickStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const todayStats = await Promise.all([
      // Tasks created today
      Task.countDocuments({
        createdAt: { $gte: startOfDay, $lt: endOfDay }
      }),
      
      // Tasks completed today
      Task.countDocuments({
        status: 'completed',
        completedAt: { $gte: startOfDay, $lt: endOfDay }
      }),
      
      // Pending tasks
      Task.countDocuments({
        status: 'pending'
      }),
      
      // Overdue tasks
      Task.countDocuments({
        dueDate: { $lt: today },
        status: { $nin: ['completed', 'cancelled'] }
      })
    ]);

    res.json({
      success: true,
      data: {
        tasksCreatedToday: todayStats[0],
        tasksCompletedToday: todayStats[1],
        pendingTasks: todayStats[2],
        overdueTasks: todayStats[3]
      }
    });

  } catch (error) {
    console.error('Error fetching quick stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quick statistics',
      error: error.message
    });
  }
};

// Get department performance overview
export const getDepartmentPerformance = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const departmentPerformance = await Task.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$department',
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          },
          averageCompletionTime: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                {
                  $subtract: ['$completedAt', '$assignedAt']
                },
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
          averageCompletionTime: {
            $divide: ['$averageCompletionTime', 1000 * 60 * 60] // Convert to hours
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: departmentPerformance
    });

  } catch (error) {
    console.error('Error fetching department performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department performance',
      error: error.message
    });
  }
};
