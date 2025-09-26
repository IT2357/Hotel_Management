import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Home,
  Plus,
  FileText
} from 'lucide-react';
import api from '../../services/api';
import { ManagerDashboardTemplate } from '../../templates/manager';

const ManagerHomePage = () => {
  const navigate = useNavigate();
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
        todayBookings: 12,
        todayRevenue: 8450,
        taskStats: { active: 8 },
        staffStats: { online: 24 }
      });
    } finally {
      setLoading(false);
    }
  };

  // Configure stats for the dashboard template
  const dashboardStats = dashboardData ? [
    {
      title: "Active Tasks",
      value: dashboardData.taskStats?.active || 0,
      change: "+2 from yesterday",
      changeType: 'increase',
      icon: CheckSquare,
      color: "blue",
      onClick: () => navigate('/manager/tasks')
    },
    {
      title: "Today's Bookings",
      value: dashboardData.todayBookings || 0,
      change: "+5% from yesterday",
      changeType: 'increase',
      icon: Calendar,
      color: "green",
      onClick: () => navigate('/manager/reports/bookings')
    },
    {
      title: "Revenue Today",
      value: `$${(dashboardData.todayRevenue || 0).toLocaleString()}`,
      change: "+12% from yesterday",
      changeType: 'increase',
      icon: DollarSign,
      color: "purple",
      onClick: () => navigate('/manager/reports/financial')
    },
    {
      title: "Staff Online",
      value: dashboardData.staffStats?.online || 0,
      change: "85% attendance",
      changeType: 'increase',
      icon: Users,
      color: "orange",
      onClick: () => navigate('/manager/staff-performance')
    }
  ] : [];

  // Header actions
  const headerActions = [
    {
      label: "Settings",
      icon: Settings,
      onClick: () => navigate('/manager/settings'),
      variant: 'default'
    },
    {
      label: "Create Task",
      icon: Plus,
      onClick: () => navigate('/manager/tasks/create'),
      variant: 'primary'
    }
  ];

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

  return (
    <ManagerDashboardTemplate
      title="Manager Home"
      subtitle="Hotel Management System Overview"
      icon={Home}
      loading={loading}
      error={error}
      onRefresh={fetchDashboardData}
      stats={dashboardStats}
      actions={headerActions}
    >
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
            <span className="text-sm font-medium text-gray-700">View Bookings</span>
          </Link>
          <Link
            to="/manager/tasks/create"
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Target className="w-6 h-6 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Create Task</span>
          </Link>
          <Link
            to="/manager/reports/kpis"
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <TrendingUp className="w-6 h-6 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">View KPIs</span>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold mb-6">Recent Activity</h3>
        <div className="space-y-4">
          {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
            dashboardData.recentActivity.slice(0, 5).map((activity, index) => {
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
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">No recent activity available</p>
              <p className="text-gray-400 text-xs mt-1">Activity will appear here as tasks are completed</p>
            </div>
          )}
        </div>
      </div>
    </ManagerDashboardTemplate>
  );
};

export default ManagerHomePage;
