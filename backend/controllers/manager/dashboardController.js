// controllers/manager/dashboardController.js
import Task from '../../models/manager/Task.js';
import Staff from '../../models/profiles/StaffProfile.js';

export const getDashboardData = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    // Get task status distribution
    const taskStatusDistribution = await Task.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statusCounts = {
      pending: 0,
      'in-progress': 0,
      completed: 0,
      assigned: 0,
      rejected: 0
    };

    taskStatusDistribution.forEach(item => {
      if (statusCounts.hasOwnProperty(item._id)) {
        statusCounts[item._id] = item.count;
      }
    });

    // Combine assigned and in-progress for UI
    statusCounts['in-progress'] += statusCounts.assigned;

    const totalTasks = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
    const pendingTasks = statusCounts.pending;
    const completedToday = await Task.countDocuments({ 
      status: 'completed', 
      completedAt: { $gte: today, $lt: tomorrow } 
    });

    // Staff metrics
    const [staffOnline, totalStaff] = await Promise.all([
      Staff.countDocuments({ isOnline: true, isActive: true }),
      Staff.countDocuments({ isActive: true })
    ]);

    // Average completion time calculation
    const completedTasks = await Task.find({ 
      status: 'completed', 
      actualTime: { $exists: true, $ne: null } 
    }).select('actualTime');
    
    const avgCompletionTime = completedTasks.length > 0 
      ? Math.round(completedTasks.reduce((sum, task) => sum + task.actualTime, 0) / completedTasks.length)
      : 31;

    // Efficiency rate (completed vs total tasks created in last 7 days)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const [tasksCreatedWeek, tasksCompletedWeek] = await Promise.all([
      Task.countDocuments({ createdAt: { $gte: weekAgo } }),
      Task.countDocuments({ status: 'completed', completedAt: { $gte: weekAgo } })
    ]);

    const efficiencyRate = tasksCreatedWeek > 0 ? Math.round((tasksCompletedWeek / tasksCreatedWeek) * 100) : 94;

    // Recent activity with more details
    const recentTasks = await Task.find({})
      .populate('assignedTo', 'name role department')
      .populate('guest', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    // Top performers based on completed tasks and ratings
    const topPerformers = await Staff.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $lookup: {
          from: 'tasks',
          localField: '_id',
          foreignField: 'assignedTo',
          as: 'assignedTasks'
        }
      },
      {
        $addFields: {
          completedTasks: {
            $size: {
              $filter: {
                input: '$assignedTasks',
                cond: { $eq: ['$$this.status', 'completed'] }
              }
            }
          },
          avgCompletionTime: {
            $avg: {
              $map: {
                input: {
                  $filter: {
                    input: '$assignedTasks',
                    cond: { 
                      $and: [
                        { $eq: ['$$this.status', 'completed'] },
                        { $ne: ['$$this.actualTime', null] }
                      ]
                    }
                  }
                },
                in: '$$this.actualTime'
              }
            }
          }
        }
      },
      {
        $project: {
          name: 1,
          role: 1,
          department: 1,
          rating: 1,
          isOnline: 1,
          completedTasks: 1,
          avgCompletionTime: 1,
          tasksCompleted: '$completedTasks'
        }
      },
      { $sort: { rating: -1, completedTasks: -1 } },
      { $limit: 5 }
    ]);

    // Calculate percentages for status distribution
    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0
    })).filter(item => item.count > 0);

    res.json({
      metrics: {
        totalTasks: {
          value: totalTasks,
          change: -12, // Mock percentage change
          label: 'Active tasks in system'
        },
        pendingTasks: {
          value: pendingTasks,
          label: 'Awaiting assignment'
        },
        staffOnline: {
          value: staffOnline,
          total: totalStaff,
          label: 'Currently available'
        },
        avgCompletionTime: {
          value: avgCompletionTime,
          unit: 'm',
          change: 8, // Mock percentage change
          label: 'Task completion time'
        },
        completedToday: {
          value: completedToday,
          label: 'Tasks finished'
        },
        averageRating: {
          value: 4.7,
          change: 5, // Mock percentage change
          label: 'Staff performance'
        },
        inProgress: {
          value: statusCounts['in-progress'],
          label: 'Currently being handled'
        },
        efficiencyRate: {
          value: efficiencyRate,
          change: 3, // Mock percentage change
          label: 'Task completion rate'
        }
      },
      statusDistribution,
      recentActivity: recentTasks.map(task => ({
        id: task._id,
        title: task.title,
        category: task.category,
        status: task.status,
        priority: task.priority,
        guestName: task.guestName,
        roomNumber: task.roomNumber,
        assignedTo: task.assignedTo,
        createdAt: task.createdAt,
        timeAgo: getTimeAgo(task.createdAt)
      })),
      topPerformers: topPerformers.map((staff, index) => ({
        id: staff._id,
        name: staff.name,
        role: staff.role,
        department: staff.department,
        rating: staff.rating || (4.9 - index * 0.1), // Mock ratings if not available
        tasksCompleted: staff.completedTasks,
        successRate: Math.max(95 - index * 2, 90), // Mock success rate
        avgTime: Math.round(staff.avgCompletionTime) || (25 + index * 5), // Mock avg time
        isOnline: staff.isOnline,
        rank: index + 1
      }))
    });
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

function getTimeAgo(date) {
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
}