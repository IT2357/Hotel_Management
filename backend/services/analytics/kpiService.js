import KPI from '../../models/KPI.js';
import Booking from '../../models/Booking.js';
import Task from '../../models/Task.js';
import Revenue from '../../models/Revenue.js';
import Expense from '../../models/Expense.js';
import { User } from '../../models/User.js';
import Review from '../../models/Review.js';
import Room from '../../models/Room.js';
import { startOfDay, endOfDay, subDays, subWeeks, subMonths, subQuarters, subYears } from 'date-fns';

class KPIService {
  /**
   * Calculate and store KPIs for a given period
   */
  async calculateAndStoreKPIs({ period = 'daily', force = false }) {
    const today = new Date();
    let startDate, endDate;

    // Determine date range based on period
    switch (period) {
      case 'daily':
        startDate = startOfDay(today);
        endDate = endOfDay(today);
        break;
      case 'weekly':
        startDate = startOfDay(subDays(today, 7));
        endDate = endOfDay(today);
        break;
      case 'monthly':
        startDate = startOfDay(subMonths(today, 1));
        endDate = endOfDay(today);
        break;
      case 'quarterly':
        startDate = startOfDay(subQuarters(today, 1));
        endDate = endOfDay(today);
        break;
      case 'yearly':
        startDate = startOfDay(subYears(today, 1));
        endDate = endOfDay(today);
        break;
      default:
        startDate = startOfDay(today);
        endDate = endOfDay(today);
    }

    // Check if KPI already exists for this period
    const existingKPI = await KPI.findOne({
      date: startDate,
      period
    });

    if (existingKPI && !force) {
      return existingKPI;
    }

    // Calculate all KPIs
    const kpiData = await this._calculateAllKPIs(startDate, endDate, period);

    // Update or create KPI record
    const kpi = await KPI.findOneAndUpdate(
      { date: startDate, period },
      kpiData,
      { upsert: true, new: true }
    );

    return kpi;
  }

  /**
   * Get current KPIs for a period
   */
  async getCurrentKPIs(period = 'daily') {
    try {
      const today = new Date();
      let date;

      switch (period) {
        case 'daily':
          date = startOfDay(today);
          break;
        case 'weekly':
          date = startOfDay(subDays(today, 7));
          break;
        case 'monthly':
          date = startOfDay(subMonths(today, 1));
          break;
        default:
          date = startOfDay(today);
      }

      let kpi = await KPI.findOne({ date, period }).sort({ calculatedAt: -1 });

      if (!kpi) {
        // Try to calculate KPIs if not found
        try {
          kpi = await this.calculateAndStoreKPIs({ period });
        } catch (calculateError) {
          console.warn('Could not calculate KPIs, returning defaults:', calculateError.message);
          // Return default KPI values when calculation fails
          return this._getDefaultKPIs(date, period);
        }
      }

      return kpi;
    } catch (error) {
      console.error('Error getting current KPIs:', error);
      // Return default values on any error
      return this._getDefaultKPIs(new Date(), period);
    }
  }

  /**
   * Get KPI trends over time
   */
  async getKPITrends(period = 'daily', count = 30) {
    const kpis = await KPI.find({ period })
      .sort({ date: -1 })
      .limit(count);

    if (kpis.length === 0) {
      return null;
    }

    // Calculate trends for key metrics
    const trends = {};
    const metrics = [
      'occupancyRate', 'totalRevenue', 'profitMargin', 
      'guestSatisfactionScore', 'taskCompletionRate', 'averageRoomRate'
    ];

    metrics.forEach(metric => {
      const values = kpis.map(kpi => kpi[metric] || 0).reverse();
      trends[metric] = this._calculateTrend(values);
    });

    return trends;
  }

  /**
   * Check for KPI alerts based on thresholds
   */
  async checkKPIAlerts(currentKPIs) {
    const alerts = [];

    // Define default thresholds (these could come from ReportConfig)
    const thresholds = {
      occupancyRate: { min: 70, max: 100 },
      profitMargin: { min: 20, max: 100 },
      taskCompletionRate: { min: 90, max: 100 },
      guestSatisfactionScore: { min: 4.0, max: 5.0 }
    };

    // Check each KPI against thresholds
    Object.entries(thresholds).forEach(([metric, threshold]) => {
      const value = currentKPIs[metric] || 0;
      
      if (value < threshold.min) {
        alerts.push({
          type: 'warning',
          metric,
          message: `${metric} is below threshold: ${value} < ${threshold.min}`,
          value,
          threshold: threshold.min,
          severity: 'medium'
        });
      }
      
      if (metric === 'occupancyRate' && value < 50) {
        alerts.push({
          type: 'critical',
          metric,
          message: `Critical: ${metric} is critically low: ${value}%`,
          value,
          threshold: 50,
          severity: 'high'
        });
      }
      
      if (metric === 'profitMargin' && value < 10) {
        alerts.push({
          type: 'critical',
          metric,
          message: `Critical: ${metric} is critically low: ${value}%`,
          value,
          threshold: 10,
          severity: 'high'
        });
      }
    });

    return alerts;
  }

  /**
   * Get department performance metrics
   */
  async getDepartmentPerformance() {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);

    const departmentStats = await Task.aggregate([
      {
        $match: {
          requestedAt: { $gte: thirtyDaysAgo, $lte: today }
        }
      },
      {
        $group: {
          _id: '$department',
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          averageCompletionTime: { $avg: '$actualDuration' },
          pendingTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          department: '$_id',
          totalTasks: 1,
          completedTasks: 1,
          pendingTasks: 1,
          completionRate: {
            $cond: [
              { $gt: ['$totalTasks', 0] },
              { $multiply: [{ $divide: ['$completedTasks', '$totalTasks'] }, 100] },
              0
            ]
          },
          averageCompletionTime: 1,
          efficiency: {
            $cond: [
              { $gt: ['$averageCompletionTime', 0] },
              { $divide: [60, '$averageCompletionTime'] }, // tasks per hour
              0
            ]
          }
        }
      },
      { $sort: { completionRate: -1 } }
    ]);

    return departmentStats;
  }

  /**
   * Get KPI report data
   */
  async getKPIReport({ startDate, endDate }) {
    const kpis = await KPI.find({
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // Calculate summary statistics
    const summary = this._calculateKPISummary(kpis);
    
    return {
      kpis,
      summary,
      period: {
        start: startDate,
        end: endDate,
        count: kpis.length
      }
    };
  }

  // Private helper methods

  /**
   * Calculate all KPIs for a given period
   */
  async _calculateAllKPIs(startDate, endDate, period) {
    // Run all calculations in parallel for better performance
    const [
      bookingMetrics,
      revenueMetrics,
      expenseMetrics,
      taskMetrics,
      staffMetrics,
      guestMetrics,
      roomMetrics
    ] = await Promise.all([
      this._calculateBookingMetrics(startDate, endDate),
      this._calculateRevenueMetrics(startDate, endDate),
      this._calculateExpenseMetrics(startDate, endDate),
      this._calculateTaskMetrics(startDate, endDate),
      this._calculateStaffMetrics(startDate, endDate),
      this._calculateGuestMetrics(startDate, endDate),
      this._calculateRoomMetrics(startDate, endDate)
    ]);

    // Calculate derived metrics
    const profitMetrics = this._calculateProfitMetrics(revenueMetrics, expenseMetrics);
    const channelDistribution = await this._calculateChannelDistribution(startDate, endDate);

    return {
      date: startDate,
      period,
      
      // Booking metrics
      ...bookingMetrics,
      
      // Revenue metrics
      ...revenueMetrics,
      
      // Expense metrics
      ...expenseMetrics,
      
      // Profit metrics
      ...profitMetrics,
      
      // Task metrics
      ...taskMetrics,
      
      // Staff metrics
      ...staffMetrics,
      
      // Guest metrics
      ...guestMetrics,
      
      // Room metrics
      ...roomMetrics,
      
      // Channel distribution
      channelDistribution,
      
      calculatedAt: new Date(),
      calculatedBy: 'system'
    };
  }

  async _calculateBookingMetrics(startDate, endDate) {
    const bookingStats = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'Confirmed'] }, 1, 0] }
          },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ['$status', 'Confirmed'] }, '$totalPrice', 0] }
          },
          averageRoomRate: { $avg: '$totalPrice' }
        }
      }
    ]);

    const stats = bookingStats[0] || {};
    const totalRooms = 100; // This should come from Room model
    const totalBookings = stats.totalBookings || 0;
    
    return {
      totalBookings,
      totalRooms,
      occupiedRooms: stats.confirmedBookings || 0,
      occupancyRate: totalRooms > 0 ? ((stats.confirmedBookings || 0) / totalRooms) * 100 : 0,
      averageRoomRate: stats.averageRoomRate || 0,
      revenuePerAvailableRoom: totalRooms > 0 ? (stats.totalRevenue || 0) / totalRooms : 0
    };
  }

  async _calculateRevenueMetrics(startDate, endDate) {
    const revenueStats = await Revenue.aggregate([
      {
        $match: {
          receivedAt: { $gte: startDate, $lte: endDate },
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          roomRevenue: {
            $sum: { $cond: [{ $eq: ['$source', 'room_booking'] }, '$amount', 0] }
          },
          foodRevenue: {
            $sum: { $cond: [{ $eq: ['$source', 'food_order'] }, '$amount', 0] }
          },
          serviceRevenue: {
            $sum: { 
              $cond: [
                { $in: ['$source', ['event_service', 'laundry_service', 'spa_service', 'transportation']] }, 
                '$amount', 
                0
              ] 
            }
          },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    const stats = revenueStats[0] || {};
    
    return {
      totalRevenue: stats.totalRevenue || 0,
      roomRevenue: stats.roomRevenue || 0,
      foodRevenue: stats.foodRevenue || 0,
      serviceRevenue: stats.serviceRevenue || 0,
      averageRevenuePerBooking: stats.transactionCount > 0 ? (stats.totalRevenue || 0) / stats.transactionCount : 0
    };
  }

  async _calculateExpenseMetrics(startDate, endDate) {
    const expenseStats = await Expense.aggregate([
      {
        $match: {
          paidAt: { $gte: startDate, $lte: endDate },
          isApproved: true
        }
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
          staffExpenses: {
            $sum: { $cond: [{ $eq: ['$category', 'staff_salaries'] }, '$amount', 0] }
          },
          maintenanceExpenses: {
            $sum: { $cond: [{ $eq: ['$category', 'maintenance'] }, '$amount', 0] }
          },
          foodExpenses: {
            $sum: { $cond: [{ $eq: ['$category', 'food_raw_materials'] }, '$amount', 0] }
          },
          utilitiesExpenses: {
            $sum: { $cond: [{ $eq: ['$category', 'utilities'] }, '$amount', 0] }
          },
          otherExpenses: {
            $sum: { 
              $cond: [
                { $nin: ['$category', ['staff_salaries', 'maintenance', 'food_raw_materials', 'utilities']] },
                '$amount',
                0
              ]
            }
          }
        }
      }
    ]);

    const stats = expenseStats[0] || {};
    
    return {
      totalExpenses: stats.totalExpenses || 0,
      staffExpenses: stats.staffExpenses || 0,
      maintenanceExpenses: stats.maintenanceExpenses || 0,
      foodExpenses: stats.foodExpenses || 0,
      utilitiesExpenses: stats.utilitiesExpenses || 0,
      otherExpenses: stats.otherExpenses || 0
    };
  }

  _calculateProfitMetrics(revenueMetrics, expenseMetrics) {
    const totalRevenue = revenueMetrics.totalRevenue || 0;
    const totalExpenses = expenseMetrics.totalExpenses || 0;
    
    const grossProfit = totalRevenue - totalExpenses;
    const netProfit = grossProfit; // Simplified
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return {
      grossProfit,
      netProfit,
      profitMargin
    };
  }

  async _calculateTaskMetrics(startDate, endDate) {
    const taskStats = await Task.aggregate([
      {
        $match: {
          requestedAt: { $gte: startDate, $lte: endDate }
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
          cancelledTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          averageTaskCompletionTime: { $avg: '$actualDuration' },
          kitchenTasks: {
            $sum: { $cond: [{ $eq: ['$department', 'Kitchen'] }, 1, 0] }
          },
          servicesTasks: {
            $sum: { $cond: [{ $eq: ['$department', 'Services'] }, 1, 0] }
          },
          maintenanceTasks: {
            $sum: { $cond: [{ $eq: ['$department', 'Maintenance'] }, 1, 0] }
          },
          cleaningTasks: {
            $sum: { $cond: [{ $eq: ['$department', 'Cleaning'] }, 1, 0] }
          }
        }
      }
    ]);

    const stats = taskStats[0] || {};
    const totalTasks = stats.totalTasks || 0;
    
    return {
      totalTasks,
      completedTasks: stats.completedTasks || 0,
      pendingTasks: stats.pendingTasks || 0,
      cancelledTasks: stats.cancelledTasks || 0,
      taskCompletionRate: totalTasks > 0 ? ((stats.completedTasks || 0) / totalTasks) * 100 : 0,
      averageTaskCompletionTime: stats.averageTaskCompletionTime || 0,
      departmentTasks: {
        Kitchen: stats.kitchenTasks || 0,
        Services: stats.servicesTasks || 0,
        Maintenance: stats.maintenanceTasks || 0,
        Cleaning: stats.cleaningTasks || 0
      }
    };
  }

  async _calculateStaffMetrics(startDate, endDate) {
    const staffStats = await User.aggregate([
      {
        $match: {
          role: 'staff',
          isActive: true
        }
      },
      {
        $group: {
          _id: null,
          totalStaff: { $sum: 1 },
          activeStaff: {
            $sum: { $cond: [{ $gte: ['$lastLogin', subDays(new Date(), 7)] }, 1, 0] }
          }
        }
      }
    ]);

    const taskStats = await Task.aggregate([
      {
        $match: {
          requestedAt: { $gte: startDate, $lte: endDate },
          assignedTo: { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          totalAssignedTasks: { $sum: 1 },
          uniqueStaff: { $addToSet: '$assignedTo' }
        }
      }
    ]);

    const staff = staffStats[0] || {};
    const tasks = taskStats[0] || {};
    const totalStaff = staff.totalStaff || 1;
    
    return {
      totalStaff,
      activeStaff: staff.activeStaff || 0,
      averageTasksPerStaff: totalStaff > 0 ? (tasks.totalAssignedTasks || 0) / totalStaff : 0,
      staffUtilizationRate: totalStaff > 0 ? ((staff.activeStaff || 0) / totalStaff) * 100 : 0
    };
  }

  async _calculateGuestMetrics(startDate, endDate) {
    const guestStats = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'Confirmed'
        }
      },
      {
        $group: {
          _id: '$userId',
          bookingCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          totalGuests: { $sum: 1 },
          newGuests: {
            $sum: { $cond: [{ $eq: ['$bookingCount', 1] }, 1, 0] }
          },
          returningGuests: {
            $sum: { $cond: [{ $gt: ['$bookingCount', 1] }, 1, 0] }
          }
        }
      }
    ]);

    const reviewStats = await Review.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      }
    ]);

    const guests = guestStats[0] || {};
    const reviews = reviewStats[0] || {};
    const totalGuests = guests.totalGuests || 1;
    
    return {
      totalGuests,
      newGuests: guests.newGuests || 0,
      returningGuests: guests.returningGuests || 0,
      guestRetentionRate: totalGuests > 0 ? ((guests.returningGuests || 0) / totalGuests) * 100 : 0,
      totalReviews: reviews.totalReviews || 0,
      averageRating: reviews.averageRating || 0,
      guestSatisfactionScore: (reviews.averageRating || 0) * 20 // Convert 0-5 to 0-100
    };
  }

  async _calculateRoomMetrics(startDate, endDate) {
    // This would require actual room data
    // For now, returning default values
    return {
      totalRooms: 100,
      occupiedRooms: 0, // This will be calculated in booking metrics
      revenuePerAvailableRoom: 0 // This will be calculated in booking metrics
    };
  }

  async _calculateChannelDistribution(startDate, endDate) {
    const channelStats = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'Confirmed'
        }
      },
      {
        $group: {
          _id: '$bookingChannel',
          count: { $sum: 1 }
        }
      }
    ]);

    const distribution = {
      direct: 0,
      online: 0,
      phone: 0,
      walkIn: 0,
      agent: 0,
      corporate: 0
    };

    channelStats.forEach(stat => {
      if (distribution.hasOwnProperty(stat._id)) {
        distribution[stat._id] = stat.count;
      }
    });

    return distribution;
  }

  _calculateTrend(values) {
    if (values.length < 2) {
      return { direction: 'stable', change: 0 };
    }

    const recent = values.slice(-7).reduce((a, b) => a + b, 0) / 7;
    const previous = values.slice(-14, -7).reduce((a, b) => a + b, 0) / 7;
    
    if (previous === 0) {
      return { direction: 'stable', change: 0 };
    }

    const change = ((recent - previous) / previous) * 100;
    const direction = change > 5 ? 'up' : change < -5 ? 'down' : 'stable';

    return { direction, change: Math.abs(change) };
  }

  _calculateKPISummary(kpis) {
    if (kpis.length === 0) {
      return {};
    }

    const latest = kpis[kpis.length - 1];
    const previous = kpis.length > 1 ? kpis[kpis.length - 2] : null;

    const summary = {
      latest: {
        occupancyRate: latest.occupancyRate,
        totalRevenue: latest.totalRevenue,
        profitMargin: latest.profitMargin,
        taskCompletionRate: latest.taskCompletionRate,
        guestSatisfactionScore: latest.guestSatisfactionScore
      }
    };

    if (previous) {
      summary.changes = {
        occupancyRate: latest.occupancyRate - previous.occupancyRate,
        totalRevenue: latest.totalRevenue - previous.totalRevenue,
        profitMargin: latest.profitMargin - previous.profitMargin,
        taskCompletionRate: latest.taskCompletionRate - previous.taskCompletionRate,
        guestSatisfactionScore: latest.guestSatisfactionScore - previous.guestSatisfactionScore
      };
    }

    return summary;
  }

  /**
   * Get KPI overview for dashboard
   */
  async getKPIOverview({ startDate, endDate }) {
    try {
      // Get recent KPIs
      const kpis = await KPI.find({
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: -1 }).limit(10);

      if (!kpis || kpis.length === 0) {
        return {
          onTrackCount: 0,
          totalKPIs: 0,
          averagePerformance: 0,
          criticalAlerts: 0
        };
      }

      // Calculate overview stats
      const totalKPIs = kpis.length;
      let onTrackCount = 0;
      let totalPerformance = 0;
      let criticalAlerts = 0;

      kpis.forEach(kpi => {
        // Count KPIs that are on track (above threshold)
        if (kpi.occupancyRate >= 0.7 || kpi.taskCompletionRate >= 0.8 || kpi.guestSatisfactionScore >= 4.0) {
          onTrackCount++;
        }

        // Calculate average performance (simple average of key metrics)
        const performance = (
          (kpi.occupancyRate || 0) * 0.3 +
          (kpi.taskCompletionRate || 0) * 0.3 +
          ((kpi.guestSatisfactionScore || 0) / 5) * 0.4
        );
        totalPerformance += performance;

        // Count critical alerts (low performance indicators)
        if (kpi.occupancyRate < 0.5 || kpi.taskCompletionRate < 0.6 || kpi.guestSatisfactionScore < 3.0) {
          criticalAlerts++;
        }
      });

      return {
        onTrackCount,
        totalKPIs,
        averagePerformance: totalKPIs > 0 ? (totalPerformance / totalKPIs) * 100 : 0,
        criticalAlerts
      };

    } catch (error) {
      console.error('Error getting KPI overview:', error);
      return {
        onTrackCount: 0,
        totalKPIs: 0,
        averagePerformance: 0,
        criticalAlerts: 0
      };
    }
  }

  /**
   * Get default KPI values when calculation fails
   */
  _getDefaultKPIs(date, period) {
    return {
      date,
      period,
      occupancyRate: 0,
      totalRevenue: 0,
      profitMargin: 0,
      guestSatisfactionScore: 0,
      taskCompletionRate: 0,
      averageRoomRate: 0,
      revenuePerAvailableRoom: 0,
      averageTaskCompletionTime: 0,
      staffUtilizationRate: 0,
      guestRetentionRate: 0,
      revenueTarget: 10000,
      calculatedAt: new Date(),
      calculatedBy: 'default'
    };
  }
}

export const kpiService = new KPIService();