import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  CheckSquare, 
  Users, 
  Calendar,
  DollarSign,
  TrendingUp,
  Settings,
  Bell,
  Clock,
  Target,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import api from '../../services/api';

const ManagerHomePage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports/dashboard-overview?period=today');
      setDashboardData(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error fetching dashboard data:', err);
      // Set default values in case of error
      setDashboardData({
        todayBookings: 0,
        todayRevenue: 0,
        taskStats: { active: 0 },
        staffStats: { online: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  const quickStats = dashboardData ? [
    {
      title: "Active Tasks",
      value: dashboardData.taskStats?.active || 0,
      change: dashboardData.taskStats?.changeFromYesterday || "No change",
      icon: CheckSquare,
      color: "blue"
    },
    {
      title: "Today's Bookings",
      value: dashboardData.todayBookings || 0,
      change: dashboardData.bookingChange || "No change",
      icon: Calendar,
      color: "green"
    },
    {
      title: "Revenue Today",
      value: `$${(dashboardData.todayRevenue || 0).toLocaleString()}`,
      change: dashboardData.revenueChange || "No change",
      icon: DollarSign,
      color: "purple"
    },
    {
      title: "Staff Online",
      value: dashboardData.staffStats?.online || 0,
      change: dashboardData.staffStats?.status || "All departments active",
      icon: Users,
      color: "orange"
    }
  ] : [];

  const mainSections = [
    {
      title: "Task Management",
      description: "Manage daily operations, assign tasks to staff, track progress, and monitor department performance.",
      icon: CheckSquare,
      color: "blue",
      route: "/manager/dashboard",
      features: [
        "Assign tasks to staff",
        "Track task progress",
        "Department workload analysis",
        "Staff performance metrics"
      ]
    },
    {
      title: "Reports & Analytics",
      description: "Comprehensive reporting system with booking analytics, financial reports, and KPI dashboards.",
      icon: BarChart3,
      color: "green",
      route: "/manager/reports",
      features: [
        "Booking & Operations Reports",
        "Financial Analysis",
        "KPI Dashboard",
        "AI Forecasting & Exports"
      ]
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
              <p className="text-gray-600 mt-2">Hotel Management System</p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={fetchDashboardData}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                <RefreshCw className="w-5 h-5" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800">
                <Bell className="w-5 h-5" />
                <span className="hidden sm:inline">Notifications</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800">
                <Settings className="w-5 h-5" />
                <span className="hidden sm:inline">Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
              <span className="text-yellow-700">
                {error} - Showing default values
              </span>
            </div>
          </div>
        </div>
      )}

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
                <p className={`text-sm text-${stat.color}-600 mt-3`}>{stat.change}</p>
              </div>
            );
          })}
        </div>

        {/* Main Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {mainSections.map((section, index) => {
            const Icon = section.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`p-4 rounded-full bg-${section.color}-100`}>
                      <Icon className={`w-8 h-8 text-${section.color}-600`} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-6">{section.description}</p>
                  
                  <div className="space-y-3 mb-8">
                    {section.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full bg-${section.color}-500`}></div>
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Link
                    to={section.route}
                    className={`block w-full text-center py-4 px-6 bg-${section.color}-600 text-white rounded-lg hover:bg-${section.color}-700 transition-colors font-semibold`}
                  >
                    Access {section.title}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
          <h3 className="text-lg font-semibold mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to="/manager/tasks/assign"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <CheckSquare className="w-6 h-6 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">Assign Task</span>
            </Link>
            <Link
              to="/manager/reports/bookings"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Calendar className="w-6 h-6 text-green-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">Booking Reports</span>
            </Link>
            <Link
              to="/manager/reports/financial"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <DollarSign className="w-6 h-6 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">Financial Reports</span>
            </Link>
            <Link
              to="/manager/reports/kpis"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Target className="w-6 h-6 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">KPI Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            <Link to="/manager/dashboard" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All Tasks
            </Link>
          </div>
          <div className="space-y-4">
            {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
              dashboardData.recentActivity.map((activity, index) => {
                const statusColors = {
                  'Task completed': 'bg-green-500',
                  'Task in-progress': 'bg-blue-500', 
                  'Task assigned': 'bg-orange-500',
                  'Task pending': 'bg-yellow-500',
                  'Task cancelled': 'bg-red-500'
                };
                
                const colorClass = statusColors[activity.action] || 'bg-gray-500';
                const timeAgo = new Date(activity.timestamp).toLocaleString();
                
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`w-2 h-2 ${colorClass} rounded-full mt-2`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className="text-sm text-gray-600">{activity.action} by {activity.user}</p>
                      <p className="text-xs text-gray-500">{timeAgo}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">No recent activity available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerHomePage;