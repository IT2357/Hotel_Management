// services/dashboard/departmentService.js
import Task from '../../models/Task.js';

/**
 * Get department performance metrics
 * @param {Number} days - Number of days to analyze
 * @returns {Array} Department performance data
 */
export const getDepartmentPerformanceMetrics = async (days = 7) => {
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

  return departmentPerformance;
};
