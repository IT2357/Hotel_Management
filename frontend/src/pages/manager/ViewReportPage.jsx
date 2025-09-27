import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import {
  ArrowLeft,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  Target,
  AlertCircle,
  FileText,
  Eye,
  Settings
} from 'lucide-react';

// Import our report components
import LineChartComponent from '../../components/manager/reports/LineChartComponent';
import BarChartComponent from '../../components/manager/reports/BarChartComponent';
import PieChartComponent from '../../components/manager/reports/PieChartComponent';
import KPICard from '../../components/manager/reports/KPICard';
import ReportFilters from '../../components/manager/reports/ReportFilters';
import ExportOptions from '../../components/manager/reports/ExportOptions';

const ViewReportPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get report type from URL params
  const reportType = searchParams.get('type') || 'dashboard';
  
  console.log('ViewReportPage loaded with reportType:', reportType); // Debug log
  
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    period: searchParams.get('period') || 'month',
    department: searchParams.get('department') || 'all',
    compare: searchParams.get('compare') === 'true' || false
  });

  // Display options
  const [displayOptions, setDisplayOptions] = useState({
    showCharts: true,
    showTables: true,
    showKPIs: true,
    chartType: 'mixed' // 'line', 'bar', 'pie', 'mixed'
  });

  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Report type configurations
  const reportConfigs = {
    dashboard: {
      title: 'Dashboard Overview',
      icon: BarChart3,
      endpoint: '/reports/dashboard-overview',
      description: 'Comprehensive overview of hotel operations and key metrics'
    },
    booking: {
      title: 'Booking Reports',
      icon: Users,
      endpoint: '/reports/bookings',
      description: 'Detailed booking analytics and trends'
    },
    financial: {
      title: 'Financial Reports',
      icon: DollarSign,
      endpoint: '/reports/finance',
      description: 'Revenue, expenses, and financial performance'
    },
    kpi: {
      title: 'KPI Dashboard',
      icon: Target,
      endpoint: '/reports/kpis',
      description: 'Key performance indicators and metrics'
    }
  };

  const currentConfig = reportConfigs[reportType] || reportConfigs.dashboard;
  const IconComponent = currentConfig.icon;

  useEffect(() => {
    fetchReportData();
  }, [reportType, filters]);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          queryParams.append(key, value);
        }
      });

      const response = await api.get(`${currentConfig.endpoint}?${queryParams}`);
      setReportData(response.data.data);

      // Update URL params
      setSearchParams({
        type: reportType,
        ...filters
      });

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch report data');
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReportData();
    setRefreshing(false);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  const handleExport = async (exportOptions) => {
    try {
      const response = await api.post('/reports/export', {
        reportType: reportType,
        format: exportOptions.format,
        ...filters,
        includeCharts: exportOptions.includeCharts
      });

      // Handle file download with authentication
      if (response.data.data.downloadUrl) {
        try {
          const token = localStorage.getItem('token');
          const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
          // Remove /api from baseURL if downloadUrl already includes it
          const cleanBaseURL = baseURL.replace('/api', '');
          const downloadResponse = await fetch(`${cleanBaseURL}${response.data.data.downloadUrl}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (downloadResponse.ok) {
            const blob = await downloadResponse.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = response.data.data.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          } else {
            throw new Error(`Download failed: ${downloadResponse.statusText}`);
          }
        } catch (downloadError) {
          console.error('Download error:', downloadError);
          alert('Download failed. Please try again.');
        }
      }
      
      setExportModalOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const renderKPICards = () => {
    if (!reportData || !displayOptions.showKPIs) return null;

    const kpis = [];

    switch (reportType) {
      case 'dashboard':
        kpis.push(
          { title: 'Today\'s Bookings', value: reportData.todayBookings || 0, icon: Users, trend: 12 },
          { title: 'Revenue', value: `$${(reportData.todayRevenue || 0).toLocaleString()}`, icon: DollarSign, trend: 8 },
          { title: 'Occupancy Rate', value: `${(reportData.occupancyRate || 0)}%`, icon: BarChart3, trend: -3 },
          { title: 'Guest Satisfaction', value: `${(reportData.guestSatisfaction || 0).toFixed(1)}/5`, icon: Target, trend: 5 }
        );
        break;
      case 'booking':
        if (reportData.summary) {
          kpis.push(
            { title: 'Total Bookings', value: reportData.summary.totalBookings || 0, icon: Users },
            { title: 'Confirmed', value: reportData.summary.confirmedBookings || 0, icon: Target },
            { title: 'Cancelled', value: reportData.summary.cancelledBookings || 0, icon: AlertCircle },
            { title: 'Avg. Value', value: `$${(reportData.summary.averageBookingValue || 0).toFixed(2)}`, icon: DollarSign }
          );
        }
        break;
      case 'financial':
        if (reportData.summary) {
          kpis.push(
            { title: 'Total Revenue', value: `$${(reportData.summary.totalRevenue || 0).toLocaleString()}`, icon: DollarSign },
            { title: 'Total Expenses', value: `$${(reportData.summary.totalExpenses || 0).toLocaleString()}`, icon: TrendingUp },
            { title: 'Net Profit', value: `$${(reportData.summary.netProfit || 0).toLocaleString()}`, icon: Target },
            { title: 'Profit Margin', value: `${(reportData.summary.profitMargin || 0).toFixed(1)}%`, icon: BarChart3 }
          );
        }
        break;
      case 'kpi':
        if (reportData.kpis) {
          kpis.push(
            { title: 'Occupancy', value: `${(reportData.kpis.occupancy?.current || 0)}%`, icon: BarChart3 },
            { title: 'Revenue', value: `$${(reportData.kpis.revenue?.current || 0).toLocaleString()}`, icon: DollarSign },
            { title: 'Guest Satisfaction', value: `${(reportData.kpis.guestSatisfaction?.current || 0).toFixed(1)}`, icon: Target },
            { title: 'Task Completion', value: `${(reportData.kpis.taskCompletion?.current || 0)}%`, icon: Clock }
          );
        }
        break;
    }

    if (kpis.length === 0) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, index) => (
          <KPICard
            key={index}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            trend={kpi.trend}
          />
        ))}
      </div>
    );
  };

  const renderCharts = () => {
    if (!reportData || !displayOptions.showCharts) return null;

    const charts = [];

    switch (reportType) {
      case 'dashboard':
        if (reportData.bookingStats?.trendData) {
          charts.push(
            <div key="booking-trend" className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Booking Trends</h3>
              <LineChartComponent data={reportData.bookingStats.trendData} />
            </div>
          );
        }
        break;
      
      case 'booking':
        if (reportData.bookingsByDate) {
          charts.push(
            <div key="bookings-by-date" className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Bookings by Date</h3>
              <BarChartComponent data={reportData.bookingsByDate} />
            </div>
          );
        }
        if (reportData.bookingsBySource) {
          charts.push(
            <div key="bookings-by-source" className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Booking Sources</h3>
              <PieChartComponent data={reportData.bookingsBySource} />
            </div>
          );
        }
        break;

      case 'financial':
        if (reportData.revenueData) {
          charts.push(
            <div key="revenue-trend" className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
              <LineChartComponent data={reportData.revenueData} />
            </div>
          );
        }
        if (reportData.expenseBreakdown) {
          charts.push(
            <div key="expense-breakdown" className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Expense Breakdown</h3>
              <PieChartComponent data={reportData.expenseBreakdown} />
            </div>
          );
        }
        break;

      case 'kpi':
        if (reportData.performance) {
          const performanceData = Object.entries(reportData.performance).map(([key, value]) => ({
            name: key.replace(/([A-Z])/g, ' $1').trim(),
            value: value
          }));
          charts.push(
            <div key="performance-metrics" className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
              <BarChartComponent data={performanceData} />
            </div>
          );
        }
        break;
    }

    if (charts.length === 0) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {charts}
      </div>
    );
  };

  const renderDataTable = () => {
    if (!reportData || !displayOptions.showTables) return null;

    // This would render appropriate tables based on report type
    // For now, we'll show a placeholder
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Detailed Data</h3>
        <div className="text-gray-500 text-center py-8">
          <FileText className="h-12 w-12 mx-auto mb-4" />
          <p>Detailed data table will be displayed here</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/manager/reports')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div className="flex items-center space-x-3">
                <IconComponent className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{currentConfig.title}</h1>
                  <p className="text-gray-600">{currentConfig.description}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              
              <button
                onClick={() => setExportModalOpen(true)}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <ReportFilters
            filters={filters}
            onFiltersChange={handleFilterChange}
            reportType={reportType}
          />
        </div>

        {/* Display Options */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Display Options
          </h3>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={displayOptions.showKPIs}
                onChange={(e) => setDisplayOptions(prev => ({ ...prev, showKPIs: e.target.checked }))}
                className="mr-2"
              />
              Show KPIs
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={displayOptions.showCharts}
                onChange={(e) => setDisplayOptions(prev => ({ ...prev, showCharts: e.target.checked }))}
                className="mr-2"
              />
              Show Charts
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={displayOptions.showTables}
                onChange={(e) => setDisplayOptions(prev => ({ ...prev, showTables: e.target.checked }))}
                className="mr-2"
              />
              Show Tables
            </label>
          </div>
        </div>

        {/* Report Content */}
        {reportData ? (
          <div className="space-y-8">
            {/* KPI Cards */}
            {renderKPICards()}

            {/* Charts */}
            {renderCharts()}

            {/* Data Table */}
            {renderDataTable()}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-600 mb-4">
              No data found for the selected filters. Try adjusting your date range or filters.
            </p>
            <button
              onClick={() => setFilters({ startDate: '', endDate: '', period: 'month', department: 'all', compare: false })}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Export Modal */}
        {exportModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <ExportOptions
                onExport={handleExport}
                onCancel={() => setExportModalOpen(false)}
                reportType={reportType}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewReportPage;