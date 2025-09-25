import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Star,
  Building,
  Clock,
  AlertCircle
} from 'lucide-react';

import KPICard from '../../../components/manager/reports/KPICard';
import LineChartComponent from '../../../components/manager/reports/LineChartComponent';
import BarChartComponent from '../../../components/manager/reports/BarChartComponent';
import PieChartComponent from '../../../components/manager/reports/PieChartComponent';
import ReportFilters from '../../../components/manager/reports/ReportFilters';
import ExportOptions from '../../../components/manager/reports/ExportOptions';

const BookingReports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    period: 'daily',
    compare: false
  });

  useEffect(() => {
    fetchBookingReports();
  }, [filters]);

  const fetchBookingReports = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      queryParams.append('period', filters.period);
      queryParams.append('compare', filters.compare);
      
      const response = await api.get(`/reports/bookings?${queryParams}`);
      const data = response.data;
      setReportData(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (exportOptions) => {
    try {
      const response = await api.post('/reports/export', {
        reportType: 'booking',
        format: exportOptions.format,
        startDate: filters.startDate,
        endDate: filters.endDate,
        includeCharts: exportOptions.includeCharts
      });

      return response.data.data;
    } catch (error) {
      throw error;
    }
  };

  const formatChartData = (data) => {
    if (!data) return [];
    
    return data.map(item => ({
      date: item._id ? `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day || 1).padStart(2, '0')}` : item.date,
      bookings: item.bookings || 0,
      revenue: item.revenue || 0,
      averageValue: item.averageValue || 0
    }));
  };

  const formatPieData = (data) => {
    if (!data) return [];
    
    return data.map(item => ({
      name: item._id || 'Unknown',
      value: item.count || item.revenue || 0
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        <AlertCircle className="w-6 h-6 mr-2" />
        <span>Error: {error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Booking & Operations Report</h1>
          <p className="text-gray-600 mt-2">Comprehensive analysis of booking performance and operations</p>
        </div>
      </div>

      {/* Filters and Export */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <ReportFilters
            onFiltersChange={setFilters}
            initialFilters={filters}
            showDepartments={false}
          />
        </div>
        <div>
          <ExportOptions
            onExport={handleExport}
            reportType="booking"
          />
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KPICard
          title="Total Bookings"
          value={reportData?.summary?.totalBookings || 0}
          icon={Calendar}
          trend={{
            direction: 'up',
            percentage: 12.5
          }}
        />
        <KPICard
          title="Total Revenue"
          value={reportData?.summary?.totalRevenue || 0}
          unit="$"
          icon={DollarSign}
          trend={{
            direction: 'up',
            percentage: 8.3
          }}
        />
        <KPICard
          title="Occupancy Rate"
          value={reportData?.summary?.occupancyRate || 0}
          unit="%"
          target={85}
          icon={Building}
          trend={{
            direction: 'up',
            percentage: 5.2
          }}
        />
        <KPICard
          title="Avg Booking Value"
          value={reportData?.summary?.averageBookingValue || 0}
          unit="$"
          icon={TrendingUp}
          trend={{
            direction: 'down',
            percentage: 2.1
          }}
        />
        <KPICard
          title="Guest Satisfaction"
          value={reportData?.summary?.guestSatisfactionScore || 0}
          unit="/5"
          target={4.5}
          icon={Star}
          trend={{
            direction: 'up',
            percentage: 3.8
          }}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings Trend */}
        <LineChartComponent
          title="Booking Trends"
          data={formatChartData(reportData?.bookings?.byDate)}
          lines={[
            { key: 'bookings', name: 'Bookings', color: '#3B82F6' },
            { key: 'revenue', name: 'Revenue ($)', color: '#10B981' }
          ]}
          height={350}
        />

        {/* Booking Channels */}
        <PieChartComponent
          title="Booking Channels"
          data={formatPieData(reportData?.bookings?.byChannel)}
          height={350}
        />
      </div>

      {/* Task Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Tasks */}
        <BarChartComponent
          title="Tasks by Department"
          data={reportData?.tasks?.byDepartment?.map(dept => ({
            name: dept._id,
            total: dept.total,
            completed: dept.completed
          })) || []}
          bars={[
            { key: 'total', name: 'Total Tasks', color: '#8B5CF6' },
            { key: 'completed', name: 'Completed', color: '#10B981' }
          ]}
          height={350}
        />

        {/* Task Status */}
        <PieChartComponent
          title="Task Status Distribution"
          data={reportData?.tasks?.byStatus?.map(status => ({
            name: status._id.charAt(0).toUpperCase() + status._id.slice(1),
            value: status.count
          })) || []}
          height={350}
        />
      </div>

      {/* Staff Performance */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold">Top Performing Staff</h3>
          </div>
        </div>
        
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Staff Member</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Department</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Tasks Completed</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Completion Rate</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Avg Time</th>
                </tr>
              </thead>
              <tbody>
                {reportData?.staff?.topPerformers?.slice(0, 10).map((staff, index) => (
                  <tr key={staff.staffId} className="border-b border-gray-100">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-blue-600">
                            {index + 1}
                          </span>
                        </div>
                        {staff.staffName}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{staff.department}</td>
                    <td className="py-3 px-4">{staff.tasksCompleted}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${staff.completionRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{staff.completionRate.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-1" />
                        {staff.averageCompletionTime ? `${staff.averageCompletionTime.toFixed(0)}m` : 'N/A'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Guest Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Guest Insights</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Guests</span>
              <span className="font-semibold">{reportData?.guests?.totalGuests || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">New Guests</span>
              <span className="font-semibold text-green-600">{reportData?.guests?.newGuests || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Returning Guests</span>
              <span className="font-semibold text-blue-600">{reportData?.guests?.returningGuests || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">VIP Guests (3+ bookings)</span>
              <span className="font-semibold text-purple-600">{reportData?.guests?.frequentGuests?.length || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Common Guest Requests</h3>
          <div className="space-y-3">
            {reportData?.guests?.commonRequests?.slice(0, 5).map((request, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium">{request.title}</span>
                  <div className="text-xs text-gray-500 capitalize">{request.type}</div>
                </div>
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                  {request.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingReports;