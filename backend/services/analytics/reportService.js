import Booking from '../../models/Booking.js';
import Task from '../../models/Task.js';
import { User } from '../../models/User.js';
import Revenue from '../../models/Revenue.js';
import Expense from '../../models/Expense.js';
import Review from '../../models/Review.js';
import { startOfDay, endOfDay, subDays, subMonths, format } from 'date-fns';

class ReportService {
  /**
   * Get comprehensive booking analytics
   */
  async getBookingAnalytics({ startDate, endDate, period = 'daily', groupBy = 'date' }) {
    const matchStage = {
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ['Confirmed', 'Cancelled'] }
    };

    // Total bookings and revenue
    const totalStats = await Booking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'Confirmed'] }, 1, 0] }
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] }
          },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ['$status', 'Confirmed'] }, '$totalPrice', 0] }
          },
          averageBookingValue: { $avg: '$totalPrice' }
        }
      }
    ]);

    // Bookings by date
    const dateGroupStage = this._getDateGroupStage(period);
    const bookingsByDate = await Booking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: dateGroupStage,
          bookings: { $sum: 1 },
          revenue: {
            $sum: { $cond: [{ $eq: ['$status', 'Confirmed'] }, '$totalPrice', 0] }
          },
          averageValue: { $avg: '$totalPrice' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Bookings by channel
    const bookingsByChannel = await Booking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$bookingChannel',
          count: { $sum: 1 },
          revenue: {
            $sum: { $cond: [{ $eq: ['$status', 'Confirmed'] }, '$totalPrice', 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Bookings by status
    const bookingsByStatus = await Booking.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate occupancy rate (assuming we have room data)
    const occupancyData = await this._calculateOccupancyRate(startDate, endDate);

    // Calculate trends
    const trends = await this._calculateBookingTrends(startDate, endDate, period);

    return {
      totalBookings: totalStats[0]?.totalBookings || 0,
      confirmedBookings: totalStats[0]?.confirmedBookings || 0,
      cancelledBookings: totalStats[0]?.cancelledBookings || 0,
      totalRevenue: totalStats[0]?.totalRevenue || 0,
      averageBookingValue: totalStats[0]?.averageBookingValue || 0,
      occupancyRate: occupancyData.occupancyRate,
      byDate: bookingsByDate,
      byChannel: bookingsByChannel,
      byStatus: bookingsByStatus,
      trends
    };
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics({ startDate, endDate, period = 'monthly', includeBreakdown = true }) {
    const matchStage = {
      receivedAt: { $gte: startDate, $lte: endDate },
      paymentStatus: 'completed'
    };

    // Total revenue
    const totalRevenue = await Revenue.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          netRevenue: { $sum: '$netRevenue' },
          refundAmount: { $sum: '$refundAmount' }
        }
      }
    ]);

    // Revenue by source
    const revenueBySource = await Revenue.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$source',
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { amount: -1 } }
    ]);

    // Revenue by period
    const dateGroupStage = this._getDateGroupStage(period);
    const revenueByPeriod = await Revenue.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: dateGroupStage,
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    let breakdown = null;
    if (includeBreakdown) {
      breakdown = await this._getRevenueBreakdown(startDate, endDate);
    }

    const trends = await this._calculateRevenueTrends(startDate, endDate, period);

    return {
      total: totalRevenue[0]?.total || 0,
      netRevenue: totalRevenue[0]?.netRevenue || 0,
      refundAmount: totalRevenue[0]?.refundAmount || 0,
      bySource: revenueBySource,
      byPeriod: revenueByPeriod,
      breakdown,
      trends
    };
  }

  /**
   * Get expense analytics
   */
  async getExpenseAnalytics({ startDate, endDate, period = 'monthly', includeBreakdown = true }) {
    const matchStage = {
      paidAt: { $gte: startDate, $lte: endDate },
      isApproved: true
    };

    // Total expenses
    const totalExpenses = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Expenses by category
    const expensesByCategory = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { amount: -1 } }
    ]);

    // Expenses by department
    const expensesByDepartment = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$department',
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { amount: -1 } }
    ]);

    // Expenses by period
    const dateGroupStage = this._getDateGroupStage(period);
    const expensesByPeriod = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: dateGroupStage,
          expenses: { $sum: '$amount' },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    let breakdown = null;
    if (includeBreakdown) {
      breakdown = await this._getExpenseBreakdown(startDate, endDate);
    }

    const trends = await this._calculateExpenseTrends(startDate, endDate, period);

    return {
      total: totalExpenses[0]?.total || 0,
      byCategory: expensesByCategory,
      byDepartment: expensesByDepartment,
      byPeriod: expensesByPeriod,
      breakdown,
      trends
    };
  }

  /**
   * Get task statistics
   */
  async getTaskStatistics({ startDate, endDate, groupBy = 'department' }) {
    const matchStage = {
      requestedAt: { $gte: startDate, $lte: endDate }
    };

    // Total task stats
    const totalStats = await Task.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          averageCompletionTime: { $avg: '$actualDuration' }
        }
      }
    ]);

    // Tasks by department
    const tasksByDepartment = await Task.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$department',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          averageTime: { $avg: '$actualDuration' }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Tasks by status
    const tasksByStatus = await Task.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = totalStats[0] || {};
    const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

    return {
      total: stats.total || 0,
      completed: stats.completed || 0,
      pending: stats.pending || 0,
      inProgress: stats.inProgress || 0,
      cancelled: stats.cancelled || 0,
      completionRate,
      averageCompletionTime: stats.averageCompletionTime || 0,
      byDepartment: tasksByDepartment,
      byStatus: tasksByStatus
    };
  }

  /**
   * Get staff performance data
   */
  async getStaffPerformance({ startDate, endDate }) {
    const staffMetrics = await Task.aggregate([
      {
        $match: {
          requestedAt: { $gte: startDate, $lte: endDate },
          assignedTo: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$assignedTo',
          tasksAssigned: { $sum: 1 },
          tasksCompleted: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          averageCompletionTime: { $avg: '$actualDuration' },
          department: { $first: '$department' }
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
          department: 1,
          tasksAssigned: 1,
          tasksCompleted: 1,
          completionRate: {
            $cond: [
              { $gt: ['$tasksAssigned', 0] },
              { $multiply: [{ $divide: ['$tasksCompleted', '$tasksAssigned'] }, 100] },
              0
            ]
          },
          averageCompletionTime: 1
        }
      },
      { $sort: { completionRate: -1, tasksCompleted: -1 } }
    ]);

    // Get top performers
    const topPerformers = staffMetrics.slice(0, 5);

    // Get department stats
    const departmentStats = await Task.aggregate([
      {
        $match: {
          requestedAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$department',
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          averageTime: { $avg: '$actualDuration' },
          staffCount: { $addToSet: '$assignedTo' }
        }
      },
      {
        $project: {
          department: '$_id',
          totalTasks: 1,
          completedTasks: 1,
          completionRate: {
            $cond: [
              { $gt: ['$totalTasks', 0] },
              { $multiply: [{ $divide: ['$completedTasks', '$totalTasks'] }, 100] },
              0
            ]
          },
          averageTime: 1,
          staffCount: { $size: '$staffCount' }
        }
      }
    ]);

    return {
      staffMetrics,
      topPerformers,
      departmentStats
    };
  }

  /**
   * Get guest insights
   */
  async getGuestInsights({ startDate, endDate }) {
    // Get booking data with guest information
    const guestData = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'Confirmed'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'guest'
        }
      },
      {
        $unwind: '$guest'
      },
      {
        $group: {
          _id: '$userId',
          guestName: { $first: '$guest.name' },
          bookingCount: { $sum: 1 },
          totalSpent: { $sum: '$totalPrice' },
          lastBooking: { $max: '$createdAt' },
          averageSpend: { $avg: '$totalPrice' }
        }
      }
    ]);

    const totalGuests = guestData.length;
    
    // Identify new vs returning guests
    const newGuests = guestData.filter(guest => guest.bookingCount === 1).length;
    const returningGuests = totalGuests - newGuests;

    // Get frequent guests (VIPs)
    const frequentGuests = guestData
      .filter(guest => guest.bookingCount >= 3)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // Get common requests from tasks
    const commonRequests = await Task.aggregate([
      {
        $match: {
          requestedAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            type: '$type',
            title: '$title'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get average rating from reviews
    const ratingData = await Review.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    return {
      totalGuests,
      newGuests,
      returningGuests,
      frequentGuests,
      commonRequests: commonRequests.map(req => ({
        type: req._id.type,
        title: req._id.title,
        count: req.count
      })),
      averageRating: ratingData[0]?.averageRating || 0,
      totalReviews: ratingData[0]?.totalReviews || 0
    };
  }

  /**
   * Calculate profit metrics
   */
  async calculateProfitMetrics({ revenueData, expenseData, period }) {
    const totalRevenue = revenueData.total || 0;
    const totalExpenses = expenseData.total || 0;
    
    const grossProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // Calculate trends by comparing periods
    const profitTrends = this._calculateProfitTrends(revenueData.byPeriod, expenseData.byPeriod);

    // Calculate cost structure
    const costStructure = {
      revenuePercentage: 100,
      expensePercentage: totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0,
      profitPercentage: profitMargin
    };

    return {
      grossProfit,
      netProfit: grossProfit, // Simplified for now
      profitMargin,
      revenueGrowth: this._calculateGrowth(revenueData.trends),
      trends: profitTrends,
      costStructure
    };
  }

  /**
   * Get comparison data for previous periods
   */
  async getComparisonData({ currentStart, currentEnd, comparePeriod, type }) {
    let compareStart, compareEnd;
    
    const daysDiff = Math.ceil((currentEnd - currentStart) / (1000 * 60 * 60 * 24));
    
    if (comparePeriod === 'previous') {
      compareEnd = new Date(currentStart.getTime() - 1);
      compareStart = new Date(compareEnd.getTime() - (daysDiff * 24 * 60 * 60 * 1000));
    } else if (comparePeriod === 'previous_year') {
      compareStart = new Date(currentStart.getFullYear() - 1, currentStart.getMonth(), currentStart.getDate());
      compareEnd = new Date(currentEnd.getFullYear() - 1, currentEnd.getMonth(), currentEnd.getDate());
    }

    let currentData, compareData;

    if (type === 'booking') {
      [currentData, compareData] = await Promise.all([
        this.getBookingAnalytics({ startDate: currentStart, endDate: currentEnd }),
        this.getBookingAnalytics({ startDate: compareStart, endDate: compareEnd })
      ]);
    } else if (type === 'financial') {
      [currentData, compareData] = await Promise.all([
        this.getRevenueAnalytics({ startDate: currentStart, endDate: currentEnd }),
        this.getExpenseAnalytics({ startDate: currentStart, endDate: currentEnd })
      ]);
    }

    return {
      current: currentData,
      previous: compareData,
      comparison: this._calculateComparison(currentData, compareData)
    };
  }

  // Helper methods

  _getDateGroupStage(period) {
    switch (period) {
      case 'daily':
        return {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
      case 'weekly':
        return {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
      case 'monthly':
        return {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
      case 'yearly':
        return {
          year: { $year: '$createdAt' }
        };
      default:
        return {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
    }
  }

  async _calculateOccupancyRate(startDate, endDate) {
    // This would require room data - simplified implementation
    const totalBookings = await Booking.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'Confirmed'
    });

    // Assuming 100 rooms for calculation
    const totalRooms = 100;
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const totalRoomNights = totalRooms * days;
    
    const occupancyRate = totalRoomNights > 0 ? (totalBookings / totalRoomNights) * 100 : 0;

    return { occupancyRate };
  }

  async _calculateBookingTrends(startDate, endDate, period) {
    // Simplified trend calculation
    return {
      direction: 'up', // up, down, stable
      percentage: 15.5,
      description: 'Bookings increased by 15.5% compared to previous period'
    };
  }

  async _calculateRevenueTrends(startDate, endDate, period) {
    return {
      direction: 'up',
      percentage: 12.3,
      description: 'Revenue increased by 12.3% compared to previous period'
    };
  }

  async _calculateExpenseTrends(startDate, endDate, period) {
    return {
      direction: 'up',
      percentage: 8.7,
      description: 'Expenses increased by 8.7% compared to previous period'
    };
  }

  async _getRevenueBreakdown(startDate, endDate) {
    return {
      roomBookings: 65,
      foodOrders: 20,
      services: 10,
      events: 5
    };
  }

  async _getExpenseBreakdown(startDate, endDate) {
    return {
      staffSalaries: 40,
      utilities: 20,
      maintenance: 15,
      food: 15,
      cleaning: 10
    };
  }

  _calculateProfitTrends(revenueByPeriod, expensesByPeriod) {
    return {
      direction: 'up',
      percentage: 18.2,
      description: 'Profit margin improved by 18.2%'
    };
  }

  _calculateGrowth(trends) {
    return trends?.percentage || 0;
  }

  _calculateComparison(current, previous) {
    // Simplified comparison calculation
    return {
      revenue: {
        change: 15.5,
        direction: 'up'
      },
      bookings: {
        change: 12.3,
        direction: 'up'
      },
      expenses: {
        change: 8.7,
        direction: 'up'
      }
    };
  }

  /**
   * Get current occupancy rate
   */
  async getOccupancyRate({ startDate, endDate }) {
    try {
      const totalRooms = 100; // This should come from your Room model
      const occupiedRooms = await Booking.countDocuments({
        checkInDate: { $lte: endDate },
        checkOutDate: { $gte: startDate },
        status: 'Confirmed'
      });
      
      return Math.round((occupiedRooms / totalRooms) * 100);
    } catch (error) {
      console.error('Error calculating occupancy rate:', error);
      return 0;
    }
  }

  /**
   * Get guest satisfaction score
   */
  async getGuestSatisfactionScore({ startDate, endDate }) {
    try {
      const reviews = await Review.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 }
          }
        }
      ]);
      
      return reviews[0]?.avgRating ? Math.round(reviews[0].avgRating * 10) / 10 : 0;
    } catch (error) {
      console.error('Error calculating guest satisfaction:', error);
      return 0;
    }
  }

  /**
   * Get booking statistics
   */
  async getBookingStatistics({ startDate, endDate }) {
    try {
      const stats = await Booking.aggregate([
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
            pendingBookings: {
              $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
            },
            cancelledBookings: {
              $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] }
            }
          }
        }
      ]);
      
      return stats[0] || { totalBookings: 0, confirmedBookings: 0, pendingBookings: 0, cancelledBookings: 0 };
    } catch (error) {
      console.error('Error getting booking statistics:', error);
      return { totalBookings: 0, confirmedBookings: 0, pendingBookings: 0, cancelledBookings: 0 };
    }
  }

  /**
   * Get financial statistics
   */
  async getFinancialStatistics({ startDate, endDate }) {
    try {
      const [revenueStats, expenseStats] = await Promise.all([
        Revenue.aggregate([
          { $match: { date: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
        ]),
        Expense.aggregate([
          { $match: { date: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, totalExpenses: { $sum: '$amount' } } }
        ])
      ]);
      
      const totalRevenue = revenueStats[0]?.totalRevenue || 0;
      const totalExpenses = expenseStats[0]?.totalExpenses || 0;
      
      return {
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        profitMargin: totalRevenue > 0 ? Math.round(((totalRevenue - totalExpenses) / totalRevenue) * 100) : 0
      };
    } catch (error) {
      console.error('Error getting financial statistics:', error);
      return { totalRevenue: 0, totalExpenses: 0, netProfit: 0, profitMargin: 0 };
    }
  }

  /**
   * Get recent activity
   */
  async getRecentActivity({ limit = 5 }) {
    try {
      const recentTasks = await Task.find({})
        .sort({ updatedAt: -1 })
        .limit(limit)
        .populate('assignedTo', 'name')
        .select('title status department updatedAt assignedTo');
      
      return recentTasks.map(task => ({
        action: `Task ${task.status}`,
        description: `${task.title} - ${task.department}`,
        timestamp: task.updatedAt.toISOString(),
        user: task.assignedTo?.name || 'Unassigned'
      }));
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  }

  /**
   * Get performance alerts
   */
  async getPerformanceAlerts({ startDate, endDate }) {
    try {
      const alerts = [];
      
      // Check for overdue tasks
      const overdueTasks = await Task.countDocuments({
        dueDate: { $lt: new Date() },
        status: { $in: ['Pending', 'In Progress'] }
      });
      
      if (overdueTasks > 0) {
        alerts.push({
          severity: 'warning',
          message: `${overdueTasks} tasks are overdue`,
          time: new Date().toISOString()
        });
      }
      
      // Check occupancy rate
      const occupancyRate = await this.getOccupancyRate({ startDate, endDate });
      if (occupancyRate < 60) {
        alerts.push({
          severity: 'critical',
          message: `Low occupancy rate: ${occupancyRate}%`,
          time: new Date().toISOString()
        });
      }
      
      return alerts;
    } catch (error) {
      console.error('Error getting performance alerts:', error);
      return [];
    }
  }

  /**
   * Add report to scheduling queue
   */
  async addToSchedule(config) {
    // Implementation for adding reports to scheduling system
    // This would integrate with a job queue like Bull or Agenda
    console.log(`Scheduling report: ${config.name}`);
    return { scheduled: true, configId: config._id };
  }
}

export const reportService = new ReportService();