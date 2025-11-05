import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  TrendingUp, DollarSign, ShoppingBag, Users, Clock, Utensils, Star, Activity, BarChart3
} from 'lucide-react';
import foodService from '../../../services/foodService';
import FoodButton from '../../../components/food/FoodButton';
import FoodCard from '../../../components/food/FoodCard';
import FoodSelect from '../../../components/food/FoodSelect';
import FoodInput from '../../../components/food/FoodInput';
import RevenueChart from '../../../components/food/analytics/RevenueChart';
import PopularItemsChart from '../../../components/food/analytics/PopularItemsChart';
import PeakHoursChart from '../../../components/food/analytics/PeakHoursChart';
import { toast } from 'sonner';

const EnhancedFoodAnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('7days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [chartType, setChartType] = useState('line');

  const getDates = (range) => {
    const endDate = new Date();
    const startDate = new Date();
    if (range === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === '7days') {
      startDate.setDate(endDate.getDate() - 7);
    } else if (range === '30days') {
      startDate.setDate(endDate.getDate() - 30);
    } else if (range === 'custom') {
      return { startDate: customStartDate, endDate: customEndDate };
    }
    return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
  };

  const { startDate, endDate } = getDates(timeRange);

  // Fetch overview data
  const { data: overview, isLoading: isLoadingOverview, error: errorOverview } = useQuery({
    queryKey: ['foodAnalyticsOverview', startDate, endDate],
    queryFn: () => foodService.getFoodAnalyticsOverview(startDate, endDate),
    onError: (err) => toast.error(`Failed to fetch overview: ${err.message}`),
  });

  // Fetch order trends
  const { data: orderTrends, isLoading: isLoadingOrderTrends, error: errorOrderTrends } = useQuery({
    queryKey: ['foodAnalyticsOrderTrends', startDate, endDate],
    queryFn: () => foodService.getFoodOrderTrends(startDate, endDate),
    onError: (err) => toast.error(`Failed to fetch order trends: ${err.message}`),
  });

  // Fetch popular items
  const { data: popularItems, isLoading: isLoadingPopularItems, error: errorPopularItems } = useQuery({
    queryKey: ['foodAnalyticsPopularItems', startDate, endDate],
    queryFn: () => foodService.getFoodPopularItems(startDate, endDate),
    onError: (err) => toast.error(`Failed to fetch popular items: ${err.message}`),
  });

  // Fetch peak hours
  const { data: peakHours, isLoading: isLoadingPeakHours, error: errorPeakHours } = useQuery({
    queryKey: ['foodAnalyticsPeakHours', startDate, endDate],
    queryFn: () => foodService.getFoodPeakHours(startDate, endDate),
    onError: (err) => toast.error(`Failed to fetch peak hours: ${err.message}`),
  });

  const formatCurrency = (value) => `LKR ${value?.toLocaleString() || '0'}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-6 bg-gray-50 min-h-screen"
    >
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Food Analytics Dashboard</h1>
        <div className="flex items-center space-x-4">
          <FoodSelect
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            options={[
              { value: 'line', label: 'Line Chart' },
              { value: 'bar', label: 'Bar Chart' },
              { value: 'pie', label: 'Pie Chart' },
            ]}
            className="w-32"
          />
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <FoodSelect
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          options={[
            { value: 'today', label: 'Today' },
            { value: '7days', label: 'Last 7 Days' },
            { value: '30days', label: 'Last 30 Days' },
            { value: 'custom', label: 'Custom Range' },
          ]}
          className="w-48"
        />
        {timeRange === 'custom' && (
          <>
            <FoodInput
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              placeholder="Start Date"
              className="w-48"
            />
            <FoodInput
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              placeholder="End Date"
              className="w-48"
            />
          </>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <FoodCard className="p-6 flex items-center justify-between bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div>
            <p className="text-sm opacity-80">Total Orders</p>
            <h2 className="text-3xl font-bold mt-1">
              {isLoadingOverview ? (
                <div className="animate-pulse bg-white bg-opacity-20 h-8 w-16 rounded"></div>
              ) : (
                overview?.totalOrders || 0
              )}
            </h2>
          </div>
          <ShoppingBag className="w-10 h-10 opacity-70" />
        </FoodCard>

        <FoodCard className="p-6 flex items-center justify-between bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div>
            <p className="text-sm opacity-80">Total Revenue</p>
            <h2 className="text-3xl font-bold mt-1">
              {isLoadingOverview ? (
                <div className="animate-pulse bg-white bg-opacity-20 h-8 w-20 rounded"></div>
              ) : (
                formatCurrency(overview?.totalRevenue)
              )}
            </h2>
          </div>
          <DollarSign className="w-10 h-10 opacity-70" />
        </FoodCard>

        <FoodCard className="p-6 flex items-center justify-between bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <div>
            <p className="text-sm opacity-80">Pending Orders</p>
            <h2 className="text-3xl font-bold mt-1">
              {isLoadingOverview ? (
                <div className="animate-pulse bg-white bg-opacity-20 h-8 w-16 rounded"></div>
              ) : (
                overview?.pendingOrders || 0
              )}
            </h2>
          </div>
          <Clock className="w-10 h-10 opacity-70" />
        </FoodCard>

        <FoodCard className="p-6 flex items-center justify-between bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div>
            <p className="text-sm opacity-80">Completed Orders</p>
            <h2 className="text-3xl font-bold mt-1">
              {isLoadingOverview ? (
                <div className="animate-pulse bg-white bg-opacity-20 h-8 w-16 rounded"></div>
              ) : (
                overview?.completedOrders || 0
              )}
            </h2>
          </div>
          <Utensils className="w-10 h-10 opacity-70" />
        </FoodCard>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RevenueChart 
          data={orderTrends} 
          type={chartType}
          title="Revenue Trends"
        />
        <PeakHoursChart 
          data={peakHours} 
          type={chartType}
          title="Peak Ordering Hours"
        />
      </div>

      {/* Popular Items */}
      <div className="mb-8">
        <PopularItemsChart 
          data={popularItems} 
          type={chartType}
          title="Popular Menu Items"
        />
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FoodCard className="p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-500" /> Customer Insights
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Repeat Customers</span>
              <span className="font-semibold text-blue-600">68%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Average Order Value</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(overview?.totalRevenue / Math.max(overview?.totalOrders, 1))}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Customer Satisfaction</span>
              <span className="font-semibold text-yellow-600">4.8/5</span>
            </div>
          </div>
        </FoodCard>

        <FoodCard className="p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
            <Utensils className="w-5 h-5 mr-2 text-green-500" /> Kitchen Performance
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Avg Prep Time</span>
              <span className="font-semibold text-green-600">18 min</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Efficiency Rate</span>
              <span className="font-semibold text-blue-600">94%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Quality Score</span>
              <span className="font-semibold text-purple-600">4.9/5</span>
            </div>
          </div>
        </FoodCard>
      </div>

      {/* Export and Actions */}
      <div className="mt-8 flex justify-end space-x-4">
        <FoodButton
          variant="outline"
          onClick={() => toast.info('Export feature coming soon!')}
        >
          Export Data
        </FoodButton>
        <FoodButton
          onClick={() => window.print()}
        >
          Print Report
        </FoodButton>
      </div>
    </motion.div>
  );
};

export default EnhancedFoodAnalyticsDashboard;
