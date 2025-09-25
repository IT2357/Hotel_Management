import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  FileText,
  Download,
  Settings,
  Bell,
  Home,
  ChevronRight
} from 'lucide-react';

import BookingReports from './reports/BookingReports';
import FinancialReports from './reports/FinancialReports';
import KPIsDashboard from './reports/KPIsDashboard';
import ManagerReportsDashboard from './ManagerReportsDashboard';

const ManagerDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set active tab based on current route
    const path = location.pathname.split('/').pop();
    if (['bookings', 'financial', 'kpis'].includes(path)) {
      setActiveTab(path);
    } else {
      setActiveTab('overview');
    }
  }, [location]);

  useEffect(() => {
    fetchDashboardOverview();
  }, []);

  const fetchDashboardOverview = async () => {
    try {
      const response = await api.get('/reports/dashboard-overview');
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigationItems = [
    {
      id: 'overview',
      name: 'Reports Home',
      icon: Home,
      path: '/manager/reports'
    },
    {
      id: 'bookings',
      name: 'Booking Reports',
      icon: Calendar,
      path: '/manager/reports/bookings'
    },
    {
      id: 'financial',
      name: 'Financial Reports',
      icon: DollarSign,
      path: '/manager/reports/financial'
    },
    {
      id: 'kpis',
      name: 'KPI Dashboard',
      icon: TrendingUp,
      path: '/manager/reports/kpis'
    }
  ];

  const OverviewDashboard = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-600 mt-2">Hotel performance overview and key metrics</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            Export Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData?.todayBookings || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+12%</span>
            <span className="text-gray-500 ml-1">vs yesterday</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${dashboardData?.todayRevenue?.toLocaleString() || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+8%</span>
            <span className="text-gray-500 ml-1">vs yesterday</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData?.occupancyRate || 0}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+5%</span>
            <span className="text-gray-500 ml-1">vs last week</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData?.pendingTasks || 0}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Bell className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-orange-600 font-medium">
              {dashboardData?.urgentTasks || 0} urgent
            </span>
            <span className="text-gray-500 ml-1">tasks require attention</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Booking Reports</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            View comprehensive booking analytics, guest insights, and operational performance metrics.
          </p>
          <button 
            onClick={() => window.location.href = '/manager/dashboard/bookings'}
            className="w-full bg-blue-50 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-100 transition-colors"
          >
            View Booking Reports
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold">Financial Reports</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Access detailed financial analysis, revenue tracking, expense management, and profit insights.
          </p>
          <button 
            onClick={() => window.location.href = '/manager/dashboard/financial'}
            className="w-full bg-green-50 text-green-600 py-2 px-4 rounded-lg hover:bg-green-100 transition-colors"
          >
            View Financial Reports
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold">KPI Dashboard</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Monitor key performance indicators, track targets, and analyze performance trends.
          </p>
          <button 
            onClick={() => window.location.href = '/manager/dashboard/kpis'}
            className="w-full bg-purple-50 text-purple-600 py-2 px-4 rounded-lg hover:bg-purple-100 transition-colors"
          >
            View KPI Dashboard
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {dashboardData?.recentActivity?.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    navigate(item.path);
                  }}
                  className={`flex items-center gap-2 py-4 px-2 border-b-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<ManagerReportsDashboard />} />
          <Route path="/bookings" element={<BookingReports />} />
          <Route path="/financial" element={<FinancialReports />} />
          <Route path="/kpis" element={<KPIsDashboard />} />
          <Route path="*" element={<Navigate to="/manager/reports" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default ManagerDashboard;