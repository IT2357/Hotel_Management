import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  BarChart3,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Target,
  Star,
  Clock,
  AlertTriangle,
  Bell,
  Download,
  Settings,
  Filter,
  RefreshCw
} from 'lucide-react';

const ManagerReportsDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('today');

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/reports/dashboard-overview?period=${dateRange}`);
      setDashboardData(response.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickStats = [
    {
      title: "Today's Bookings",
      value: dashboardData?.todayBookings || 0,
      change: "+12%",
      changeType: "increase",
      icon: Calendar,
      color: "blue"
    },
    {
      title: "Today's Revenue",
      value: `$${(dashboardData?.todayRevenue || 0).toLocaleString()}`,
      change: "+8.5%",
      changeType: "increase",
      icon: DollarSign,
      color: "green"
    },
    {
      title: "Occupancy Rate",
      value: `${dashboardData?.occupancyRate || 0}%`,
      change: "+5.2%",
      changeType: "increase",
      icon: Users,
      color: "purple"
    },
    {
      title: "Guest Satisfaction",
      value: `${dashboardData?.guestSatisfaction || 0}/5`,
      change: "+0.3",
      changeType: "increase",
      icon: Star,
      color: "yellow"
    }
  ];

  const reportCategories = [
    {
      title: "Booking & Operations Report",
      description: "Total bookings, sources, task statistics, staff performance, and guest insights",
      icon: Calendar,
      color: "blue",
      stats: {
        totalBookings: dashboardData?.bookingStats?.total || 0,
        pendingTasks: dashboardData?.taskStats?.pending || 0,
        completedTasks: dashboardData?.taskStats?.completed || 0,
        topDepartment: dashboardData?.taskStats?.topDepartment || "Kitchen"
      },
      route: "/manager/reports/bookings"
    },
    {
      title: "Financial Report",
      description: "Revenue, expenses, profit analysis, and expense breakdown by category",
      icon: DollarSign,
      color: "green",
      stats: {
        totalRevenue: dashboardData?.financialStats?.revenue || 0,
        totalExpenses: dashboardData?.financialStats?.expenses || 0,
        netProfit: (dashboardData?.financialStats?.revenue || 0) - (dashboardData?.financialStats?.expenses || 0),
        profitMargin: dashboardData?.financialStats?.profitMargin || 0
      },
      route: "/manager/reports/financial"
    },
    {
      title: "KPI Dashboard",
      description: "Key performance indicators, targets vs actual, and performance trends",
      icon: Target,
      color: "purple",
      stats: {
        kpisOnTrack: dashboardData?.kpiStats?.onTrack || 0,
        kpisTotal: dashboardData?.kpiStats?.total || 0,
        avgPerformance: dashboardData?.kpiStats?.avgPerformance || 0,
        criticalAlerts: dashboardData?.kpiStats?.criticalAlerts || 0
      },
      route: "/manager/reports/kpis"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
          <p>Error loading dashboard: {error}</p>
          <button 
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manager Reports Dashboard</h1>
              <p className="text-gray-600 mt-2">Comprehensive hotel performance analytics and insights</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4" />
                Export All
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-${stat.color}-100`}>
                    <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  {stat.changeType === 'increase' ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-gray-500 text-sm ml-1">vs yesterday</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Performance Alerts */}
        {dashboardData?.alerts && dashboardData.alerts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold">Performance Alerts</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.alerts.map((alert, index) => (
                <div key={index} className={`p-4 rounded-lg border-l-4 ${
                  alert.severity === 'critical' ? 'bg-red-50 border-red-500' :
                  alert.severity === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                  'bg-blue-50 border-blue-500'
                }`}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                      alert.severity === 'critical' ? 'text-red-600' :
                      alert.severity === 'warning' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`} />
                    <div>
                      <p className={`font-medium text-sm ${
                        alert.severity === 'critical' ? 'text-red-800' :
                        alert.severity === 'warning' ? 'text-yellow-800' :
                        'text-blue-800'
                      }`}>
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{alert.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Report Categories */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Report Categories</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {reportCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 rounded-full bg-${category.color}-100`}>
                        <Icon className={`w-6 h-6 text-${category.color}-600`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-6">{category.description}</p>
                    
                    {/* Category-specific stats */}
                    <div className="space-y-3 mb-6">
                      {category.title.includes('Booking') && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total Bookings</span>
                            <span className="font-semibold">{category.stats.totalBookings}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Pending Tasks</span>
                            <span className="font-semibold text-orange-600">{category.stats.pendingTasks}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Completed Tasks</span>
                            <span className="font-semibold text-green-600">{category.stats.completedTasks}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Top Department</span>
                            <span className="font-semibold text-blue-600">{category.stats.topDepartment}</span>
                          </div>
                        </>
                      )}
                      
                      {category.title.includes('Financial') && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total Revenue</span>
                            <span className="font-semibold text-green-600">${category.stats.totalRevenue.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total Expenses</span>
                            <span className="font-semibold text-red-600">${category.stats.totalExpenses.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Net Profit</span>
                            <span className={`font-semibold ${category.stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ${category.stats.netProfit.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Profit Margin</span>
                            <span className="font-semibold">{category.stats.profitMargin}%</span>
                          </div>
                        </>
                      )}
                      
                      {category.title.includes('KPI') && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">KPIs On Track</span>
                            <span className="font-semibold text-green-600">{category.stats.kpisOnTrack}/{category.stats.kpisTotal}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Avg Performance</span>
                            <span className="font-semibold">{category.stats.avgPerformance}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Critical Alerts</span>
                            <span className="font-semibold text-red-600">{category.stats.criticalAlerts}</span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => navigate(category.route)}
                        className={`flex-1 py-3 px-4 bg-${category.color}-600 text-white rounded-lg hover:bg-${category.color}-700 transition-colors font-medium`}
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => {
                          const reportType = category.title.includes('Booking') ? 'booking' : 
                                           category.title.includes('Financial') ? 'financial' : 'kpi';
                          const url = `/manager/reports/view?type=${reportType}&period=${dateRange}`;
                          console.log('Navigating to:', url); // Debug log
                          navigate(url);
                        }}
                        className={`flex-1 py-3 px-4 bg-${category.color}-100 text-${category.color}-700 border border-${category.color}-200 rounded-lg hover:bg-${category.color}-200 transition-colors font-medium`}
                      >
                        View Report
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <button 
              onClick={() => {
                const url = `/manager/reports/view?type=dashboard&period=${dateRange}`;
                console.log('Quick Action - Navigating to:', url); // Debug log
                navigate(url);
              }}
              className="flex items-center gap-3 p-4 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-700">View Dashboard Report</span>
            </button>
            <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Export All Reports</span>
            </button>
            <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Bell className="w-5 h-5 text-orange-600" />
              <span className="font-medium">Schedule Reports</span>
            </button>
            <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span className="font-medium">AI Forecasting</span>
            </button>
            <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Settings className="w-5 h-5 text-gray-600" />
              <span className="font-medium">Report Settings</span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All</button>
          </div>
          <div className="space-y-3">
            {dashboardData?.recentActivity?.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 py-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                </div>
              </div>
            )) || (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerReportsDashboard;