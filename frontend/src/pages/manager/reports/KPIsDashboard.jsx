import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Clock,
  Users,
  Star,
  AlertTriangle,
  CheckCircle,
  BarChart3
} from 'lucide-react';

import KPICard from '../../../components/manager/reports/KPICard';
import LineChartComponent from '../../../components/manager/reports/LineChartComponent';
import BarChartComponent from '../../../components/manager/reports/BarChartComponent';
import ReportFilters from '../../../components/manager/reports/ReportFilters';
import ExportOptions from '../../../components/manager/reports/ExportOptions';

const KPIsDashboard = () => {
  const [kpiData, setKpiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    period: 'daily'
  });

  useEffect(() => {
    fetchKPIData();
  }, [filters]);

  const fetchKPIData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      queryParams.append('period', filters.period);
      
      const response = await api.get(`/reports/kpis?${queryParams}`);
      setKpiData(response.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (exportOptions) => {
    try {
      const response = await api.post('/reports/export', {
        reportType: 'kpi',
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

  const formatTrendData = (data) => {
    if (!data) return [];
    
    return data.map(item => ({
      date: item._id ? `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day || 1).padStart(2, '0')}` : item.date,
      occupancyRate: item.occupancyRate || 0,
      revenue: item.revenue || 0,
      guestSatisfaction: item.guestSatisfaction || 0,
      taskCompletion: item.taskCompletionRate || 0
    }));
  };

  const getKPIStatus = (value, target, type = 'higher') => {
    const percentage = target > 0 ? (value / target) * 100 : 0;
    
    if (type === 'higher') {
      if (percentage >= 100) return { status: 'excellent', color: 'green' };
      if (percentage >= 80) return { status: 'good', color: 'blue' };
      if (percentage >= 60) return { status: 'warning', color: 'yellow' };
      return { status: 'critical', color: 'red' };
    } else {
      if (percentage <= 100) return { status: 'excellent', color: 'green' };
      if (percentage <= 120) return { status: 'good', color: 'blue' };
      if (percentage <= 150) return { status: 'warning', color: 'yellow' };
      return { status: 'critical', color: 'red' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        <AlertTriangle className="w-6 h-6 mr-2" />
        <span>Error: {error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">KPI Dashboard</h1>
          <p className="text-gray-600 mt-2">Key Performance Indicators and metrics overview</p>
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
            reportType="kpi"
          />
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Occupancy Rate"
          value={kpiData?.primary?.occupancyRate?.current || 0}
          unit="%"
          target={85}
          icon={Users}
          trend={{
            direction: kpiData?.primary?.occupancyRate?.trend >= 0 ? 'up' : 'down',
            percentage: Math.abs(kpiData?.primary?.occupancyRate?.trend || 0)
          }}
        />
        <KPICard
          title="Guest Satisfaction"
          value={kpiData?.primary?.guestSatisfaction?.current || 0}
          unit="/5"
          target={4.5}
          icon={Star}
          trend={{
            direction: kpiData?.primary?.guestSatisfaction?.trend >= 0 ? 'up' : 'down',
            percentage: Math.abs(kpiData?.primary?.guestSatisfaction?.trend || 0)
          }}
        />
        <KPICard
          title="Task Completion Rate"
          value={kpiData?.primary?.taskCompletionRate?.current || 0}
          unit="%"
          target={95}
          icon={CheckCircle}
          trend={{
            direction: kpiData?.primary?.taskCompletionRate?.trend >= 0 ? 'up' : 'down',
            percentage: Math.abs(kpiData?.primary?.taskCompletionRate?.trend || 0)
          }}
        />
        <KPICard
          title="Revenue per Room"
          value={kpiData?.primary?.revenuePerRoom?.current || 0}
          unit="$"
          target={150}
          icon={TrendingUp}
          trend={{
            direction: kpiData?.primary?.revenuePerRoom?.trend >= 0 ? 'up' : 'down',
            percentage: Math.abs(kpiData?.primary?.revenuePerRoom?.trend || 0)
          }}
        />
      </div>

      {/* KPI Trends Chart */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold">KPI Trends</h3>
          </div>
        </div>
        <div className="p-6">
          <LineChartComponent
            data={formatTrendData(kpiData?.trends)}
            lines={[
              { key: 'occupancyRate', name: 'Occupancy Rate (%)', color: '#3B82F6' },
              { key: 'guestSatisfaction', name: 'Guest Satisfaction (x20)', color: '#10B981' },
              { key: 'taskCompletion', name: 'Task Completion (%)', color: '#8B5CF6' }
            ]}
            height={400}
          />
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPICard
          title="Average Response Time"
          value={kpiData?.secondary?.avgResponseTime?.current || 0}
          unit="mins"
          target={15}
          icon={Clock}
          trend={{
            direction: kpiData?.secondary?.avgResponseTime?.trend <= 0 ? 'up' : 'down',
            percentage: Math.abs(kpiData?.secondary?.avgResponseTime?.trend || 0)
          }}
          reverseGood={true}
        />
        <KPICard
          title="Staff Efficiency"
          value={kpiData?.secondary?.staffEfficiency?.current || 0}
          unit="%"
          target={90}
          icon={Target}
          trend={{
            direction: kpiData?.secondary?.staffEfficiency?.trend >= 0 ? 'up' : 'down',
            percentage: Math.abs(kpiData?.secondary?.staffEfficiency?.trend || 0)
          }}
        />
        <KPICard
          title="Cost per Guest"
          value={kpiData?.secondary?.costPerGuest?.current || 0}
          unit="$"
          target={50}
          icon={TrendingDown}
          trend={{
            direction: kpiData?.secondary?.costPerGuest?.trend <= 0 ? 'up' : 'down',
            percentage: Math.abs(kpiData?.secondary?.costPerGuest?.trend || 0)
          }}
          reverseGood={true}
        />
      </div>

      {/* Department Performance */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold">Department Performance</h3>
          </div>
        </div>
        <div className="p-6">
          <BarChartComponent
            data={kpiData?.departments?.map(dept => ({
              name: dept.name,
              performance: dept.performanceScore,
              efficiency: dept.efficiencyScore,
              satisfaction: dept.satisfactionScore
            })) || []}
            bars={[
              { key: 'performance', name: 'Performance', color: '#3B82F6' },
              { key: 'efficiency', name: 'Efficiency', color: '#10B981' },
              { key: 'satisfaction', name: 'Satisfaction', color: '#F59E0B' }
            ]}
            height={350}
          />
        </div>
      </div>

      {/* KPI Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Alerts */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <h3 className="text-lg font-semibold">Performance Alerts</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {kpiData?.alerts?.map((alert, index) => (
                <div key={index} className={`flex items-start gap-3 p-3 rounded-lg ${
                  alert.severity === 'critical' ? 'bg-red-50' :
                  alert.severity === 'warning' ? 'bg-yellow-50' : 'bg-blue-50'
                }`}>
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    alert.severity === 'critical' ? 'bg-red-500' :
                    alert.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div>
                    <div className={`font-medium ${
                      alert.severity === 'critical' ? 'text-red-800' :
                      alert.severity === 'warning' ? 'text-yellow-800' : 'text-blue-800'
                    }`}>
                      {alert.title}
                    </div>
                    <div className={`text-sm ${
                      alert.severity === 'critical' ? 'text-red-700' :
                      alert.severity === 'warning' ? 'text-yellow-700' : 'text-blue-700'
                    }`}>
                      {alert.description}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {alert.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Achievement Highlights */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold">Achievement Highlights</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {kpiData?.achievements?.map((achievement, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-green-800">
                      {achievement.title}
                    </div>
                    <div className="text-sm text-green-700">
                      {achievement.description}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Achieved: {achievement.date}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Comparison Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">KPI Targets vs Actual</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  KPI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {kpiData?.comparison?.map((kpi, index) => {
                const status = getKPIStatus(kpi.current, kpi.target, kpi.type);
                const progress = kpi.target > 0 ? Math.min((kpi.current / kpi.target) * 100, 100) : 0;
                
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {kpi.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {kpi.current}{kpi.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {kpi.target}{kpi.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full bg-${status.color}-500`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{progress.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-800`}>
                        {status.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {kpi.trend >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                        )}
                        <span className={`text-sm font-medium ${kpi.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {kpi.trend >= 0 ? '+' : ''}{kpi.trend.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default KPIsDashboard;