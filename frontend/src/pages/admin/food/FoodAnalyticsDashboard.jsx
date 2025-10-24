import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Clock, 
  ChefHat,
  Star,
  ArrowUp,
  ArrowDown,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import FoodButton from '../../../components/food/FoodButton';
import api from '../../../services/api';

const FoodAnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [overview, orders, popularItems, peakHours, customers, kitchen, revenue] = await Promise.all([
        api.get('/food/analytics/overview'),
        api.get(`/food/analytics/orders?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        api.get(`/food/analytics/items/popular?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&limit=10`),
        api.get(`/food/analytics/peak-hours?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        api.get(`/food/analytics/customers?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        api.get(`/food/analytics/kitchen?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        api.get(`/food/analytics/revenue?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&groupBy=day`)
      ]);

      setAnalyticsData({
        overview: overview.data.data,
        orders: orders.data.data,
        popularItems: popularItems.data.data,
        peakHours: peakHours.data.data,
        customers: customers.data.data,
        kitchen: kitchen.data.data,
        revenue: revenue.data.data
      });
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-LK').format(num);
  };

  const COLORS = ['#f97316', '#ea580c', '#dc2626', '#b91c1c', '#991b1b'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <FoodButton onClick={fetchAnalyticsData} className="bg-orange-500 hover:bg-orange-600 text-white">
            Try Again
          </FoodButton>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'kitchen', label: 'Kitchen', icon: ChefHat }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Food Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">Comprehensive insights into your food service performance</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <FoodButton
                onClick={fetchAnalyticsData}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </FoodButton>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <OverviewTab data={analyticsData} formatCurrency={formatCurrency} formatNumber={formatNumber} />
        )}
        {activeTab === 'revenue' && (
          <RevenueTab data={analyticsData} formatCurrency={formatCurrency} />
        )}
        {activeTab === 'orders' && (
          <OrdersTab data={analyticsData} formatNumber={formatNumber} />
        )}
        {activeTab === 'customers' && (
          <CustomersTab data={analyticsData} formatCurrency={formatCurrency} formatNumber={formatNumber} />
        )}
        {activeTab === 'kitchen' && (
          <KitchenTab data={analyticsData} formatNumber={formatNumber} />
        )}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ data, formatCurrency, formatNumber }) => {
  const overview = data?.overview;
  const today = overview?.today;

  const stats = [
    {
      title: 'Today\'s Revenue',
      value: formatCurrency(today?.totalRevenue || 0),
      change: overview?.trends?.dailyGrowth || 0,
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Today\'s Orders',
      value: formatNumber(today?.totalOrders || 0),
      change: 0,
      icon: ShoppingCart,
      color: 'text-blue-600'
    },
    {
      title: 'Average Order Value',
      value: formatCurrency(today?.averageOrderValue || 0),
      change: 0,
      icon: TrendingUp,
      color: 'text-purple-600'
    },
    {
      title: 'Active Customers',
      value: formatNumber(data?.customers?.totalCustomers || 0),
      change: 0,
      icon: Users,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                {stat.change !== 0 && (
                  <div className={`flex items-center mt-2 ${stat.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                    <span className="text-sm font-medium ml-1">
                      {Math.abs(stat.change).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              <div className={`p-3 rounded-lg ${stat.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data?.revenue || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
              <Area type="monotone" dataKey="totalRevenue" stroke="#f97316" fill="#f97316" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Orders by Status */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={Object.entries(today?.ordersByStatus || {}).map(([status, count]) => ({ status, count }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, count }) => `${status}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {Object.entries(today?.ordersByStatus || {}).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Popular Items */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Items</h3>
        <div className="space-y-4">
          {data?.popularItems?.slice(0, 5).map((item, index) => (
            <div key={item._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-bold">{index + 1}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">{item.totalQuantity} orders</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatCurrency(item.totalRevenue)}</p>
                <p className="text-sm text-gray-600">{item.orderCount} times</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Revenue Tab Component
const RevenueTab = ({ data, formatCurrency }) => {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data?.revenue || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="_id" />
            <YAxis />
            <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
            <Line type="monotone" dataKey="totalRevenue" stroke="#f97316" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Orders Tab Component
const OrdersTab = ({ data, formatNumber }) => {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders by Hour</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data?.peakHours?.hourlyData || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="_id" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="orderCount" fill="#f97316" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Customers Tab Component
const CustomersTab = ({ data, formatCurrency, formatNumber }) => {
  const customers = data?.customers;
  
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Customers</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(customers?.totalCustomers || 0)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-sm font-medium text-gray-600">Repeat Customers</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(customers?.repeatCustomers || 0)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-sm font-medium text-gray-600">New Customers</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(customers?.newCustomers || 0)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-sm font-medium text-gray-600">Avg Lifetime Value</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(customers?.averageLifetimeValue || 0)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers</h3>
        <div className="space-y-4">
          {customers?.topCustomers?.slice(0, 10).map((customer, index) => (
            <div key={customer._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-bold">{index + 1}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{customer.customerName || customer._id}</p>
                  <p className="text-sm text-gray-600">{customer.orderCount} orders</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatCurrency(customer.totalSpent)}</p>
                <p className="text-sm text-gray-600">Total spent</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Kitchen Tab Component
const KitchenTab = ({ data, formatNumber }) => {
  const kitchen = data?.kitchen;
  
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-sm font-medium text-gray-600">Avg Prep Time</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{Math.round(kitchen?.averagePrepTime || 0)} min</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-sm font-medium text-gray-600">Completion Rate</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{Math.round(kitchen?.completionRate || 0)}%</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Orders</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(kitchen?.totalOrders || 0)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-sm font-medium text-gray-600">Completed Orders</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(kitchen?.completedOrders || 0)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders by Status</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={Object.entries(kitchen?.ordersByStatus || {}).map(([status, count]) => ({ status, count }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#f97316" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FoodAnalyticsDashboard;
