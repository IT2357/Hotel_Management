// controllers/manager/dashboardController.js
import { 
  getTaskStatistics, 
  getRecentTasks, 
  getOverdueTasks,
  getTodayTaskStats 
} from '../../services/dashboard/taskStatsService.js';
import { getStaffStatistics } from '../../services/dashboard/staffStatsService.js';
import { getDepartmentPerformanceMetrics } from '../../services/dashboard/departmentService.js';

// Get dashboard data for manager
export const getDashboardData = async (req, res) => {
  try {
    // Get date range for statistics (default to last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Fetch all dashboard data using service functions
    const [taskStatistics, staffStatistics, recentTasks, overdueTasks] = await Promise.all([
      getTaskStatistics(startDate, endDate),
      getStaffStatistics(),
      getRecentTasks(10),
      getOverdueTasks(5)
    ]);

    // Format the response
    const dashboardData = {
      taskStatistics,
      staffStatistics,
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
    const quickStats = await getTodayTaskStats();

    res.json({
      success: true,
      data: quickStats
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
    const departmentPerformance = await getDepartmentPerformanceMetrics(days);

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
