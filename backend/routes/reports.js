import express from 'express';
import path from 'path';
import {
  getDashboardOverview,
  getBookingReports,
  getFinancialReports,
  getKPIDashboard,
  exportReport,
  getForecast,
  saveReportConfig,
  getReportConfigs,
  scheduleReport,
  updateKPIs
} from '../controllers/dashboard/reportController.js';
import { getManagerOverviewReport } from '../controllers/manager/managerReportController.js';
import { 
  getTaskReports, 
  getWorkloadReport, 
  getDelayedTasksReport 
} from '../controllers/manager/taskReportController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleAuth.js';
import { validateReportRequest } from '../middleware/validation.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/reports/dashboard-overview
 * @desc    Get dashboard overview with key metrics and stats
 * @access  Manager, Admin
 * @query   period (today, week, month, year)
 */
router.get(
  '/dashboard-overview',
  authorizeRoles(['manager', 'admin']),
  getDashboardOverview
);

router.get(
  '/manager/overview',
  authorizeRoles(['manager', 'admin']),
  getManagerOverviewReport
);

/**
 * @route   GET /api/reports/tasks
 * @desc    Get task performance reports
 * @access  Manager, Admin
 * @query   startDate, endDate, department, reportType
 */
router.get(
  '/tasks',
  authorizeRoles(['manager', 'admin']),
  getTaskReports
);

/**
 * @route   GET /api/reports/workload
 * @desc    Get staff workload reports
 * @access  Manager, Admin
 * @query   startDate, endDate, department
 */
router.get(
  '/workload',
  authorizeRoles(['manager', 'admin']),
  getWorkloadReport
);

/**
 * @route   GET /api/reports/delayed-tasks
 * @desc    Get delayed tasks report
 * @access  Manager, Admin
 * @query   department, severity
 */
router.get(
  '/delayed-tasks',
  authorizeRoles(['manager', 'admin']),
  getDelayedTasksReport
);

/**
 * @route   GET /api/reports/bookings
 * @desc    Get comprehensive booking reports and analytics
 * @access  Manager, Admin
 * @query   startDate, endDate, period, groupBy, includeForecasting, compare, comparePeriod
 */
router.get(
  '/bookings',
  authorizeRoles(['manager', 'admin']),
  validateReportRequest,
  getBookingReports
);

/**
 * @route   GET /api/reports/finance
 * @desc    Get comprehensive financial reports
 * @access  Manager, Admin
 * @query   startDate, endDate, period, includeBreakdown, compare, comparePeriod
 */
router.get(
  '/finance',
  authorizeRoles(['manager', 'admin']),
  validateReportRequest,
  getFinancialReports
);

/**
 * @route   GET /api/reports/kpis
 * @desc    Get KPI dashboard data with trends and alerts
 * @access  Manager, Admin
 * @query   period, includeTrends, includeAlerts
 */
router.get(
  '/kpis',
  authorizeRoles(['manager', 'admin']),
  getKPIDashboard
);

/**
 * @route   GET /api/reports/export
 * @desc    Export report data
 * @access  Manager, Admin
 * @query   type, format, startDate, endDate, includeCharts
 */
router.get(
  '/export',
  authorizeRoles(['manager', 'admin']),
  exportReport
);

/**
 * @route   GET /api/reports/exports/:filename
 * @desc    Download exported report file
 * @access  Manager, Admin
 * @param   filename - The exported file name
 */
router.get(
  '/exports/:filename',
  authorizeRoles(['manager', 'admin']),
  (req, res) => {
    const { filename } = req.params;
    const filePath = `./exports/${filename}`;
    
    // Check if file exists and send it
    res.download(filePath, (err) => {
      if (err) {
        console.error('Download error:', err);
        return res.status(404).json({
          success: false,
          message: 'File not found or download error'
        });
      }
    });
  }
);

/**
 * @route   GET /api/reports/forecast
 * @desc    Get AI forecasting data
 * @access  Manager, Admin
 * @query   type, period, horizon
 */
router.get(
  '/forecast',
  authorizeRoles(['manager', 'admin']),
  getForecast
);

/**
 * @route   POST /api/reports/configs
 * @desc    Save custom report configuration
 * @access  Manager, Admin
 * @body    Report configuration object
 */
router.post(
  '/configs',
  authorizeRoles(['manager', 'admin']),
  saveReportConfig
);

/**
 * @route   GET /api/reports/configs
 * @desc    Get saved report configurations
 * @access  Manager, Admin
 * @query   type, isTemplate
 */
router.get(
  '/configs',
  authorizeRoles(['manager', 'admin']),
  getReportConfigs
);

/**
 * @route   POST /api/reports/configs/:configId/schedule
 * @desc    Schedule automated report generation
 * @access  Manager, Admin
 * @params  configId
 * @body    schedule configuration
 */
router.post(
  '/configs/:configId/schedule',
  authorizeRoles(['manager', 'admin']),
  scheduleReport
);

/**
 * @route   POST /api/reports/kpis/update
 * @desc    Manually trigger KPI calculations
 * @access  Manager, Admin
 * @query   period, force
 */
router.post(
  '/kpis/update',
  authorizeRoles(['manager', 'admin']),
  updateKPIs
);

/**
 * @route   GET /api/reports/summary
 * @desc    Get quick summary for dashboard widgets
 * @access  Manager, Admin
 */
router.get(
  '/summary',
  authorizeRoles(['manager', 'admin']),
  async (req, res, next) => {
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      // Get quick metrics for dashboard
      const [bookingData, financialData, kpiData] = await Promise.all([
        reportService.getBookingAnalytics({
          startDate: thirtyDaysAgo,
          endDate: today,
          period: 'daily'
        }),
        reportService.getFinancialAnalytics({
          startDate: thirtyDaysAgo,
          endDate: today,
          period: 'daily'
        }),
        kpiService.getCurrentKPIs('daily')
      ]);

      res.json({
        success: true,
        data: {
          bookings: {
            total: bookingData.totalBookings,
            growth: bookingData.growth,
            occupancyRate: kpiData.occupancyRate
          },
          revenue: {
            total: financialData.totalRevenue,
            growth: financialData.revenueGrowth,
            averagePerBooking: bookingData.averageBookingValue
          },
          tasks: {
            completionRate: kpiData.taskCompletionRate,
            averageTime: kpiData.averageTaskCompletionTime,
            pending: kpiData.pendingTasks
          },
          satisfaction: {
            score: kpiData.guestSatisfactionScore,
            reviews: kpiData.totalReviews
          },
          lastUpdated: new Date()
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/reports/download/:filename
 * @desc    Download exported report file
 * @access  Manager, Admin
 * @param   filename - The exported file name
 */
router.get(
  '/download/:filename',
  authorizeRoles(['manager', 'admin']),
  (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), 'exports', filename);
    
    console.log('📥 Download request for:', filename);
    console.log('📂 File path:', filePath);
    
    // Check if file exists and send it
    res.download(filePath, (err) => {
      if (err) {
        console.error('❌ Download error:', err);
        return res.status(404).json({
          success: false,
          message: 'File not found or download error'
        });
      }
      console.log('✅ File download completed:', filename);
    });
  }
);

export default router;