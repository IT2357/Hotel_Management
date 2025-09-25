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