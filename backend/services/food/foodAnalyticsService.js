import FoodOrder from '../../models/FoodOrder.js';
import MenuItem from '../../models/MenuItem.js';
import logger from '../../utils/logger.js';

class FoodAnalyticsService {
  /**
   * Get comprehensive order analytics for a date range
   */
  async getOrderAnalytics(startDate, endDate) {
    try {
      const dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };

      const [
        totalOrders,
        totalRevenue,
        averageOrderValue,
        ordersByStatus,
        ordersByDay,
        ordersByHour
      ] = await Promise.all([
        // Total orders count
        FoodOrder.countDocuments(dateFilter),
        
        // Total revenue
        FoodOrder.aggregate([
          { $match: dateFilter },
          { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]),
        
        // Average order value
        FoodOrder.aggregate([
          { $match: dateFilter },
          { $group: { _id: null, avg: { $avg: '$totalPrice' } } }
        ]),
        
        // Orders by status
        FoodOrder.aggregate([
          { $match: dateFilter },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        
        // Orders by day of week
        FoodOrder.aggregate([
          { $match: dateFilter },
          { $group: { _id: { $dayOfWeek: '$createdAt' }, count: { $sum: 1 } } }
        ]),
        
        // Orders by hour
        FoodOrder.aggregate([
          { $match: dateFilter },
          { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } }
        ])
      ]);

      return {
        totalOrders: totalOrders || 0,
        totalRevenue: totalRevenue[0]?.total || 0,
        averageOrderValue: averageOrderValue[0]?.avg || 0,
        ordersByStatus: ordersByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        ordersByDay: ordersByDay.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        ordersByHour: ordersByHour.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      };
    } catch (error) {
      logger.error('Failed to get order analytics', { error: error.message });
      throw error;
    }
  }

  /**
   * Get popular menu items
   */
  async getPopularItems(limit = 10, startDate, endDate) {
    try {
      const dateFilter = startDate && endDate ? {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      } : {};

      const popularItems = await FoodOrder.aggregate([
        { $match: dateFilter },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.foodId',
            name: { $first: '$items.name' },
            totalQuantity: { $sum: '$items.quantity' },
            totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: limit }
      ]);

      return popularItems;
    } catch (error) {
      logger.error('Failed to get popular items', { error: error.message });
      throw error;
    }
  }

  /**
   * Get peak hours analysis
   */
  async getPeakHours(startDate, endDate) {
    try {
      const dateFilter = startDate && endDate ? {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      } : {};

      const hourlyData = await FoodOrder.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: { $hour: '$createdAt' },
            orderCount: { $sum: 1 },
            totalRevenue: { $sum: '$totalPrice' },
            averageOrderValue: { $avg: '$totalPrice' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Find peak hours
      const peakHour = hourlyData.reduce((max, current) => 
        current.orderCount > max.orderCount ? current : max, 
        { orderCount: 0 }
      );

      return {
        hourlyData,
        peakHour: peakHour._id,
        peakOrderCount: peakHour.orderCount
      };
    } catch (error) {
      logger.error('Failed to get peak hours', { error: error.message });
      throw error;
    }
  }

  /**
   * Get customer insights
   */
  async getCustomerInsights(startDate, endDate) {
    try {
      const dateFilter = startDate && endDate ? {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      } : {};

      const [
        totalCustomers,
        repeatCustomers,
        newCustomers,
        customerLifetimeValue,
        topCustomers
      ] = await Promise.all([
        // Total unique customers
        FoodOrder.distinct('customerDetails.email', dateFilter),
        
        // Repeat customers (more than 1 order)
        FoodOrder.aggregate([
          { $match: dateFilter },
          { $group: { _id: '$customerDetails.email', orderCount: { $sum: 1 } } },
          { $match: { orderCount: { $gt: 1 } } },
          { $count: 'repeatCustomers' }
        ]),
        
        // New customers (first order in period)
        FoodOrder.aggregate([
          { $match: dateFilter },
          { $group: { _id: '$customerDetails.email', firstOrder: { $min: '$createdAt' } } },
          { $match: { firstOrder: { $gte: new Date(startDate) } } },
          { $count: 'newCustomers' }
        ]),
        
        // Customer lifetime value
        FoodOrder.aggregate([
          { $match: dateFilter },
          { $group: { _id: '$customerDetails.email', totalSpent: { $sum: '$totalPrice' } } },
          { $group: { _id: null, avgLifetimeValue: { $avg: '$totalSpent' } } }
        ]),
        
        // Top customers by revenue
        FoodOrder.aggregate([
          { $match: dateFilter },
          { $group: { 
            _id: '$customerDetails.email', 
            totalSpent: { $sum: '$totalPrice' },
            orderCount: { $sum: 1 },
            customerName: { $first: '$customerDetails.name' }
          }},
          { $sort: { totalSpent: -1 } },
          { $limit: 10 }
        ])
      ]);

      return {
        totalCustomers: totalCustomers.length,
        repeatCustomers: repeatCustomers[0]?.repeatCustomers || 0,
        newCustomers: newCustomers[0]?.newCustomers || 0,
        averageLifetimeValue: customerLifetimeValue[0]?.avgLifetimeValue || 0,
        topCustomers: topCustomers
      };
    } catch (error) {
      logger.error('Failed to get customer insights', { error: error.message });
      throw error;
    }
  }

  /**
   * Get kitchen performance metrics
   */
  async getKitchenPerformance(startDate, endDate) {
    try {
      const dateFilter = startDate && endDate ? {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      } : {};

      const [
        averagePrepTime,
        ordersByStatus,
        efficiencyMetrics,
        popularCategories
      ] = await Promise.all([
        // Average preparation time (time from confirmed to ready)
        FoodOrder.aggregate([
          { $match: { ...dateFilter, status: 'delivered' } },
          {
            $project: {
              prepTime: {
                $divide: [
                  { $subtract: ['$updatedAt', '$createdAt'] },
                  60000 // Convert to minutes
                ]
              }
            }
          },
          { $group: { _id: null, avgPrepTime: { $avg: '$prepTime' } } }
        ]),
        
        // Orders by status
        FoodOrder.aggregate([
          { $match: dateFilter },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        
        // Efficiency metrics
        FoodOrder.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              completedOrders: {
                $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
              },
              cancelledOrders: {
                $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
              }
            }
          }
        ]),
        
        // Popular categories
        FoodOrder.aggregate([
          { $match: dateFilter },
          { $unwind: '$items' },
          { $lookup: { from: 'menuitems', localField: 'items.foodId', foreignField: '_id', as: 'menuItem' } },
          { $unwind: '$menuItem' },
          { $group: { _id: '$menuItem.category', totalOrders: { $sum: 1 } } },
          { $sort: { totalOrders: -1 } },
          { $limit: 5 }
        ])
      ]);

      const efficiency = efficiencyMetrics[0];
      const completionRate = efficiency ? 
        (efficiency.completedOrders / efficiency.totalOrders) * 100 : 0;

      return {
        averagePrepTime: averagePrepTime[0]?.avgPrepTime || 0,
        completionRate: completionRate,
        ordersByStatus: ordersByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        popularCategories: popularCategories,
        totalOrders: efficiency?.totalOrders || 0,
        completedOrders: efficiency?.completedOrders || 0,
        cancelledOrders: efficiency?.cancelledOrders || 0
      };
    } catch (error) {
      logger.error('Failed to get kitchen performance', { error: error.message });
      throw error;
    }
  }

  /**
   * Get revenue trends
   */
  async getRevenueTrends(startDate, endDate, groupBy = 'day') {
    try {
      const dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };

      let groupFormat;
      switch (groupBy) {
        case 'hour':
          groupFormat = { $hour: '$createdAt' };
          break;
        case 'day':
          groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
          break;
        case 'week':
          groupFormat = { $week: '$createdAt' };
          break;
        case 'month':
          groupFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
          break;
        default:
          groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
      }

      const revenueTrends = await FoodOrder.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: groupFormat,
            totalRevenue: { $sum: '$totalPrice' },
            orderCount: { $sum: 1 },
            averageOrderValue: { $avg: '$totalPrice' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      return revenueTrends;
    } catch (error) {
      logger.error('Failed to get revenue trends', { error: error.message });
      throw error;
    }
  }

  /**
   * Get dashboard overview
   */
  async getDashboardOverview() {
    try {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const [
        todayStats,
        yesterdayStats,
        weekStats,
        monthStats
      ] = await Promise.all([
        this.getOrderAnalytics(startOfDay, today),
        this.getOrderAnalytics(yesterday, startOfDay),
        this.getOrderAnalytics(
          new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), 
          today
        ),
        this.getOrderAnalytics(
          new Date(today.getFullYear(), today.getMonth(), 1), 
          today
        )
      ]);

      return {
        today: todayStats,
        yesterday: yesterdayStats,
        thisWeek: weekStats,
        thisMonth: monthStats,
        trends: {
          dailyGrowth: todayStats.totalRevenue - yesterdayStats.totalRevenue,
          weeklyGrowth: todayStats.totalRevenue - weekStats.totalRevenue / 7,
          monthlyGrowth: todayStats.totalRevenue - monthStats.totalRevenue / 30
        }
      };
    } catch (error) {
      logger.error('Failed to get dashboard overview', { error: error.message });
      throw error;
    }
  }
}

export default new FoodAnalyticsService();
