import Booking from '../../models/Booking.js';
import Task from '../../models/Task.js';
import { User } from '../../models/User.js';
import Revenue from '../../models/Revenue.js';
import Expense from '../../models/Expense.js';
import KPI from '../../models/KPI.js';
import Forecast from '../../models/Forecast.js';
import ReportConfig from '../../models/ReportConfig.js';
import { reportService } from '../../services/analytics/reportService.js';
import { kpiService } from '../../services/analytics/kpiService.js';
import { forecastService } from '../../services/analytics/forecastService.js';
import { exportService } from '../../services/analytics/exportService.js';
import { validateDateRange, validateReportFilters } from '../../utils/validators.js';
import { AppError } from '../../services/error/AppError.js';

/**
 * Get dashboard overview with key metrics
 */
export const getDashboardOverview = async (req, res, next) => {
  try {
    const { period = 'today' } = req.query;
    
    // Calculate date range based on period
    const getDateRange = () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (period) {
        case 'today':
          return { startDate: today, endDate: now };
        case 'week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - 7);
          return { startDate: weekStart, endDate: now };
        case 'month':
          const monthStart = new Date(today);
          monthStart.setMonth(today.getMonth() - 1);
          return { startDate: monthStart, endDate: now };
        case 'year':
          const yearStart = new Date(today);
          yearStart.setFullYear(today.getFullYear() - 1);
          return { startDate: yearStart, endDate: now };
        default:
          return { startDate: today, endDate: now };
      }
    };

    const { startDate, endDate } = getDateRange();

    // Get today's key metrics
    const [
      todayBookings,
      todayRevenue,
      occupancyRate,
      guestSatisfaction,
      bookingStats,
      taskStats,
      financialStats,
      kpiStats,
      recentActivity,
      alerts
    ] = await Promise.all([
      // Today's bookings count
      Booking.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
      }),
      
      // Today's revenue
      Revenue.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).then(result => result[0]?.total || 0),
      
      // Current occupancy rate
      reportService.getOccupancyRate({ startDate, endDate }),
      
      // Guest satisfaction score
      reportService.getGuestSatisfactionScore({ startDate, endDate }),
      
      // Booking statistics
      reportService.getBookingStatistics({ startDate, endDate }),
      
      // Task statistics
      reportService.getTaskStatistics({ startDate, endDate }),
      
      // Financial statistics
      reportService.getFinancialStatistics({ startDate, endDate }),
      
      // KPI statistics
      kpiService.getKPIOverview({ startDate, endDate }),
      
      // Recent activity
      reportService.getRecentActivity({ limit: 5 }),
      
      // Performance alerts
      reportService.getPerformanceAlerts({ startDate, endDate })
    ]);

    // Get staff stats for ManagerHomePage (consider online if logged in within last 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const staffStats = await User.aggregate([
      { $match: { role: 'staff', isActive: true } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          online: {
            $sum: {
              $cond: [
                { $gte: ['$lastLogin', thirtyMinutesAgo] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const staffData = staffStats[0] || { total: 0, online: 0 };
    const staffOnline = staffData.online;
    const totalStaff = staffData.total;

    // Get active tasks count
    const activeTasks = await Task.countDocuments({
      status: { $in: ['assigned', 'in-progress'] }
    });

    const dashboardData = {
      todayBookings,
      todayRevenue,
      occupancyRate: occupancyRate || 0,
      guestSatisfaction: guestSatisfaction || 0,
      bookingStats: {
        total: bookingStats?.totalBookings || 0,
        ...bookingStats
      },
      taskStats: {
        pending: taskStats?.pendingTasks || 0,
        completed: taskStats?.completedTasks || 0,
        active: activeTasks,
        topDepartment: taskStats?.topDepartment || 'Kitchen',
        ...taskStats
      },
      financialStats: {
        revenue: financialStats?.totalRevenue || 0,
        expenses: financialStats?.totalExpenses || 0,
        profitMargin: financialStats?.profitMargin || 0,
        ...financialStats
      },
      kpiStats: {
        onTrack: kpiStats?.onTrackCount || 0,
        total: kpiStats?.totalKPIs || 0,
        avgPerformance: kpiStats?.averagePerformance || 0,
        criticalAlerts: kpiStats?.criticalAlerts || 0,
        ...kpiStats
      },
      staffStats: {
        online: staffOnline,
        total: totalStaff,
        status: `${staffOnline}/${totalStaff} staff online`
      },
      recentActivity: recentActivity || [],
      alerts: alerts || [],
      // Additional fields for ManagerHomePage compatibility
      bookingChange: period === 'today' ? '+12% from yesterday' : 'No comparison available',
      revenueChange: period === 'today' ? '+8.5% from yesterday' : 'No comparison available'
    };

    res.status(200).json({
      success: true,
      data: dashboardData,
      message: 'Dashboard overview retrieved successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard overview error:', error);
    next(new AppError('Failed to fetch dashboard overview', 500));
  }
};

/**
 * Get comprehensive booking reports with analytics
 */
export const getBookingReports = async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      period = 'daily',
      groupBy = 'date',
      includeForecasting = false,
      compare = false,
      comparePeriod = 'previous'
    } = req.query;

    // Validate inputs
    const dateRange = validateDateRange(startDate, endDate);
    if (!dateRange.isValid) {
      throw new AppError(dateRange.message, 400);
    }

    // Get booking analytics
    const bookingData = await reportService.getBookingAnalytics({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      period,
      groupBy
    });

    // Get task statistics related to bookings
    const taskStats = await reportService.getTaskStatistics({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      groupBy: 'department'
    });

    // Get staff performance data
    const staffPerformance = await reportService.getStaffPerformance({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });

    // Get guest insights
    const guestInsights = await reportService.getGuestInsights({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });

    let comparisonData = null;
    if (compare === 'true') {
      comparisonData = await reportService.getComparisonData({
        currentStart: dateRange.startDate,
        currentEnd: dateRange.endDate,
        comparePeriod,
        type: 'booking'
      });
    }

    let forecastData = null;
    if (includeForecasting === 'true') {
      forecastData = await forecastService.getBookingForecast({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        period
      });
    }

    const response = {
      success: true,
      data: {
        summary: {
          totalBookings: bookingData.totalBookings,
          totalRevenue: bookingData.totalRevenue,
          averageBookingValue: bookingData.averageBookingValue,
          occupancyRate: bookingData.occupancyRate,
          guestSatisfactionScore: guestInsights.averageRating,
        },
        bookings: {
          byDate: bookingData.byDate,
          byChannel: bookingData.byChannel,
          byStatus: bookingData.byStatus,
          trends: bookingData.trends
        },
        tasks: {
          total: taskStats.total,
          byDepartment: taskStats.byDepartment,
          byStatus: taskStats.byStatus,
          completionRate: taskStats.completionRate,
          averageCompletionTime: taskStats.averageCompletionTime
        },
        staff: {
          performance: staffPerformance.staffMetrics,
          topPerformers: staffPerformance.topPerformers,
          departmentStats: staffPerformance.departmentStats
        },
        guests: {
          totalGuests: guestInsights.totalGuests,
          newGuests: guestInsights.newGuests,
          returningGuests: guestInsights.returningGuests,
          frequentGuests: guestInsights.frequentGuests,
          commonRequests: guestInsights.commonRequests
        },
        comparison: comparisonData,
        forecast: forecastData,
        generatedAt: new Date(),
        period: {
          start: dateRange.startDate,
          end: dateRange.endDate,
          groupBy: period
        }
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Get comprehensive financial reports
 */
export const getFinancialReports = async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      period = 'monthly',
      includeBreakdown = true,
      compare = false,
      comparePeriod = 'previous'
    } = req.query;

    const dateRange = validateDateRange(startDate, endDate);
    if (!dateRange.isValid) {
      throw new AppError(dateRange.message, 400);
    }

    // Get revenue analytics
    const revenueData = await reportService.getRevenueAnalytics({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      period,
      includeBreakdown: includeBreakdown === 'true'
    });

    // Get expense analytics
    const expenseData = await reportService.getExpenseAnalytics({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      period,
      includeBreakdown: includeBreakdown === 'true'
    });

    // Calculate profit metrics
    const profitMetrics = await reportService.calculateProfitMetrics({
      revenueData,
      expenseData,
      period
    });

    let comparisonData = null;
    if (compare === 'true') {
      comparisonData = await reportService.getComparisonData({
        currentStart: dateRange.startDate,
        currentEnd: dateRange.endDate,
        comparePeriod,
        type: 'financial'
      });
    }

    const response = {
      success: true,
      data: {
        summary: {
          totalRevenue: revenueData.total,
          totalExpenses: expenseData.total,
          grossProfit: profitMetrics.grossProfit,
          netProfit: profitMetrics.netProfit,
          profitMargin: profitMetrics.profitMargin,
          revenueGrowth: profitMetrics.revenueGrowth
        },
        revenue: {
          total: revenueData.total,
          bySource: revenueData.bySource,
          byPeriod: revenueData.byPeriod,
          trends: revenueData.trends,
          breakdown: includeBreakdown ? revenueData.breakdown : null
        },
        expenses: {
          total: expenseData.total,
          byCategory: expenseData.byCategory,
          byDepartment: expenseData.byDepartment,
          byPeriod: expenseData.byPeriod,
          trends: expenseData.trends,
          breakdown: includeBreakdown ? expenseData.breakdown : null
        },
        profitability: {
          grossProfit: profitMetrics.grossProfit,
          netProfit: profitMetrics.netProfit,
          profitMargin: profitMetrics.profitMargin,
          profitTrends: profitMetrics.trends,
          costStructure: profitMetrics.costStructure
        },
        comparison: comparisonData,
        generatedAt: new Date(),
        period: {
          start: dateRange.startDate,
          end: dateRange.endDate,
          groupBy: period
        }
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Get KPI dashboard data
 */
export const getKPIDashboard = async (req, res, next) => {
  try {
    const {
      period = 'daily',
      includeTrends = true,
      includeAlerts = true
    } = req.query;

    // Get current KPIs
    const currentKPIs = await kpiService.getCurrentKPIs(period);
    
    // Get KPI trends if requested
    let trends = null;
    if (includeTrends === 'true') {
      trends = await kpiService.getKPITrends(period, 30); // Last 30 periods
    }

    // Check for alerts if requested
    let alerts = null;
    if (includeAlerts === 'true') {
      alerts = await kpiService.checkKPIAlerts(currentKPIs);
    }

    // Get department performance
    const departmentPerformance = await kpiService.getDepartmentPerformance();

    const response = {
      success: true,
      data: {
        kpis: {
          occupancy: {
            current: currentKPIs.occupancyRate,
            target: 85,
            trend: trends?.occupancyRate || null
          },
          revenue: {
            current: currentKPIs.totalRevenue,
            target: currentKPIs.revenueTarget,
            trend: trends?.totalRevenue || null
          },
          profitMargin: {
            current: currentKPIs.profitMargin,
            target: 25,
            trend: trends?.profitMargin || null
          },
          guestSatisfaction: {
            current: currentKPIs.guestSatisfactionScore,
            target: 4.5,
            trend: trends?.guestSatisfactionScore || null
          },
          taskCompletion: {
            current: currentKPIs.taskCompletionRate,
            target: 95,
            trend: trends?.taskCompletionRate || null
          },
          averageRoomRate: {
            current: currentKPIs.averageRoomRate,
            trend: trends?.averageRoomRate || null
          }
        },
        performance: {
          revenuePerRoom: currentKPIs.revenuePerAvailableRoom,
          taskEfficiency: currentKPIs.averageTaskCompletionTime,
          staffUtilization: currentKPIs.staffUtilizationRate,
          guestRetention: currentKPIs.guestRetentionRate
        },
        departments: departmentPerformance,
        alerts: alerts,
        lastUpdated: currentKPIs.calculatedAt,
        period: period
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Export report as PDF or Excel
 */
export const exportReport = async (req, res, next) => {
  try {
    const {
      reportType,
      format = 'pdf',
      startDate,
      endDate,
      includeCharts = true
    } = req.body;

    if (!['pdf', 'excel'].includes(format)) {
      throw new AppError('Invalid export format. Use pdf or excel.', 400);
    }

    if (!['booking', 'financial', 'kpi'].includes(reportType)) {
      throw new AppError('Invalid report type.', 400);
    }

    const dateRange = validateDateRange(startDate, endDate);
    if (!dateRange.isValid) {
      throw new AppError(dateRange.message, 400);
    }

    // Get report data based on type
    let reportData;
    switch (reportType) {
      case 'booking':
        reportData = await reportService.getBookingAnalytics({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        });
        break;
      case 'financial':
        reportData = await reportService.getFinancialAnalytics({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        });
        break;
      case 'kpi':
        reportData = await kpiService.getKPIReport({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        });
        break;
    }

    // Generate export file
    const exportResult = await exportService.generateReport({
      type: reportType,
      format,
      data: reportData,
      includeCharts: includeCharts === 'true',
      dateRange: {
        start: dateRange.startDate,
        end: dateRange.endDate
      },
      generatedBy: req.user.id
    });

    res.json({
      success: true,
      data: {
        downloadUrl: exportResult.downloadUrl,
        fileName: exportResult.fileName,
        fileSize: exportResult.fileSize,
        format: format,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get AI forecasting data
 */
export const getForecast = async (req, res, next) => {
  try {
    const {
      type = 'booking_demand',
      period = 'monthly',
      horizon = 6 // months
    } = req.query;

    const forecast = await forecastService.generateForecast({
      type,
      period,
      horizon: parseInt(horizon)
    });

    res.json({
      success: true,
      data: forecast
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Save custom report configuration
 */
export const saveReportConfig = async (req, res, next) => {
  try {
    const reportConfig = new ReportConfig({
      ...req.body,
      createdBy: req.user.id
    });

    await reportConfig.save();

    res.status(201).json({
      success: true,
      data: reportConfig
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get saved report configurations
 */
export const getReportConfigs = async (req, res, next) => {
  try {
    const { type, isTemplate } = req.query;
    
    const filter = {
      $or: [
        { createdBy: req.user.id },
        { isPublic: true },
        { 'sharedWith.userId': req.user.id }
      ],
      isActive: true
    };

    if (type) filter.type = type;
    if (isTemplate !== undefined) filter.isTemplate = isTemplate === 'true';

    const configs = await ReportConfig.find(filter)
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: configs
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Schedule automated reports
 */
export const scheduleReport = async (req, res, next) => {
  try {
    const { configId } = req.params;
    const { schedule } = req.body;

    const config = await ReportConfig.findById(configId);
    if (!config) {
      throw new AppError('Report configuration not found', 404);
    }

    // Check if user has permission to schedule
    if (config.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('Not authorized to schedule this report', 403);
    }

    config.isScheduled = true;
    config.schedule = schedule;
    await config.save();

    // Add to scheduling queue
    await reportService.addToSchedule(config);

    res.json({
      success: true,
      message: 'Report scheduled successfully',
      data: config
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update KPI calculations
 */
export const updateKPIs = async (req, res, next) => {
  try {
    const { period = 'daily', force = false } = req.query;

    const result = await kpiService.calculateAndStoreKPIs({
      period,
      force: force === 'true'
    });

    res.json({
      success: true,
      message: 'KPIs updated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};