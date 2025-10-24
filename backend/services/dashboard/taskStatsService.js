// services/dashboard/taskStatsService.js
import Task from '../../models/Task.js';

/**
 * Get task statistics for a given date range
 * @param {Date} startDate - Start date for statistics
 * @param {Date} endDate - End date for statistics
 * @returns {Object} Task statistics including total, by status, department, and priority
 */
export const getTaskStatistics = async (startDate, endDate) => {
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

  return {
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
  };
};

/**
 * Get recent tasks
 * @param {Number} limit - Number of tasks to retrieve
 * @returns {Array} Array of recent tasks
 */
export const getRecentTasks = async (limit = 10) => {
  return await Task.find()
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('title description status priority department guestName roomNumber createdAt dueDate');
};

/**
 * Get overdue tasks
 * @param {Number} limit - Number of tasks to retrieve
 * @returns {Array} Array of overdue tasks
 */
export const getOverdueTasks = async (limit = 5) => {
  return await Task.find({
    dueDate: { $lt: new Date() },
    status: { $nin: ['completed', 'cancelled'] }
  })
    .populate('assignedTo', 'name email')
    .sort({ dueDate: 1 })
    .limit(limit)
    .select('title description status priority department guestName roomNumber dueDate');
};

/**
 * Get quick statistics for today
 * @returns {Object} Today's task statistics
 */
export const getTodayTaskStats = async () => {
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

  return {
    tasksCreatedToday: todayStats[0],
    tasksCompletedToday: todayStats[1],
    pendingTasks: todayStats[2],
    overdueTasks: todayStats[3]
  };
};
