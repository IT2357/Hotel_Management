import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calculator,
  PieChart,
  Target,
  AlertTriangle,
  CreditCard
} from 'lucide-react';

import KPICard from '../../../components/manager/reports/KPICard';
import LineChartComponent from '../../../components/manager/reports/LineChartComponent';
import BarChartComponent from '../../../components/manager/reports/BarChartComponent';
import PieChartComponent from '../../../components/manager/reports/PieChartComponent';
import ReportFilters from '../../../components/manager/reports/ReportFilters';
import ExportOptions from '../../../components/manager/reports/ExportOptions';

const FinancialReports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    period: 'daily',
    departments: [],
    compare: false
  });

  useEffect(() => {
    fetchFinancialReports();
  }, [filters]);

  const fetchFinancialReports = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      queryParams.append('period', filters.period);
      queryParams.append('compare', filters.compare);
      if (filters.departments.length > 0) {
        queryParams.append('departments', filters.departments.join(','));
      }
      
      const response = await api.get(`/reports/finance?${queryParams}`);
      setReportData(response.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (exportOptions) => {
    try {
      const response = await api.post('/reports/export', {
        reportType: 'financial',
        format: exportOptions.format,
        startDate: filters.startDate,
        endDate: filters.endDate,
        departments: filters.departments,
        includeCharts: exportOptions.includeCharts
      });

      return response.data.data;
    } catch (error) {
      throw error;
    }
  };

  const formatFinancialData = (data) => {
    if (!data) return [];
    
    return data.map(item => ({
      date: item._id ? `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day || 1).padStart(2, '0')}` : item.date,
      revenue: item.revenue || 0,
      expenses: item.expenses || 0,
      profit: (item.revenue || 0) - (item.expenses || 0)
    }));
  };

  const formatExpenseData = (data) => {
    if (!data) return [];
    
    return data.map(item => ({
      name: item._id || 'Other',
      value: item.amount || 0
    }));
  };

  const formatDepartmentData = (data) => {
    if (!data) return [];
    
    return data.map(item => ({
      name: item._id,
      revenue: item.revenue || 0,
      expenses: item.expenses || 0,
      profit: (item.revenue || 0) - (item.expenses || 0)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
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

  const profitMargin = reportData?.summary?.totalRevenue > 0 
    ? ((reportData.summary.netProfit / reportData.summary.totalRevenue) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Report</h1>
          <p className="text-gray-600 mt-2">Comprehensive financial analysis and performance metrics</p>
        </div>
      </div>

      {/* Filters and Export */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <ReportFilters
            onFiltersChange={setFilters}
            initialFilters={filters}
            showDepartments={true}
          />
        </div>
        <div>
          <ExportOptions
            onExport={handleExport}
            reportType="financial"
          />
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Revenue"
          value={reportData?.summary?.totalRevenue || 0}
          unit="$"
          icon={DollarSign}
          trend={{
            direction: 'up',
            percentage: 15.2
          }}
        />
        <KPICard
          title="Total Expenses"
          value={reportData?.summary?.totalExpenses || 0}
          unit="$"
          icon={TrendingDown}
          trend={{
            direction: 'down',
            percentage: 3.1
          }}
        />
        <KPICard
          title="Net Profit"
          value={reportData?.summary?.netProfit || 0}
          unit="$"
          icon={TrendingUp}
          trend={{
            direction: reportData?.summary?.netProfit >= 0 ? 'up' : 'down',
            percentage: 22.5
          }}
        />
        <KPICard
          title="Profit Margin"
          value={profitMargin}
          unit="%"
          target={25}
          icon={Calculator}
          trend={{
            direction: 'up',
            percentage: 5.8
          }}
        />
      </div>

      {/* Revenue vs Expenses Chart */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Revenue vs Expenses Trend</h3>
        </div>
        <div className="p-6">
          <LineChartComponent
            data={formatFinancialData(reportData?.trends?.byDate)}
            lines={[
              { key: 'revenue', name: 'Revenue', color: '#10B981' },
              { key: 'expenses', name: 'Expenses', color: '#EF4444' },
              { key: 'profit', name: 'Profit', color: '#3B82F6' }
            ]}
            height={400}
          />
        </div>
      </div>

      {/* Expense Breakdown and Department Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold">Expense Breakdown</h3>
            </div>
          </div>
          <div className="p-6">
            <PieChartComponent
              data={formatExpenseData(reportData?.expenses?.byCategory)}
              height={300}
              showLegend={true}
            />
          </div>
        </div>

        {/* Department Performance */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Department Performance</h3>
          </div>
          <div className="p-6">
            <BarChartComponent
              data={formatDepartmentData(reportData?.departments)}
              bars={[
                { key: 'revenue', name: 'Revenue', color: '#10B981' },
                { key: 'expenses', name: 'Expenses', color: '#EF4444' }
              ]}
              height={300}
            />
          </div>
        </div>
      </div>

      {/* Financial Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Sources */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold">Revenue Sources</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {reportData?.revenue?.sources?.map((source, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{source._id}</div>
                    <div className="text-sm text-gray-500">
                      {((source.amount / reportData.summary.totalRevenue) * 100).toFixed(1)}% of total
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${source.amount.toLocaleString()}</div>
                    <div className="text-sm text-green-600">+{source.growth || 0}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Expense Categories */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Top Expense Categories</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {reportData?.expenses?.topCategories?.slice(0, 5).map((expense, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{expense._id}</div>
                    <div className="text-sm text-gray-500">
                      {((expense.amount / reportData.summary.totalExpenses) * 100).toFixed(1)}% of total
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${expense.amount.toLocaleString()}</div>
                    <div className={`text-sm ${expense.growth >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {expense.growth >= 0 ? '+' : ''}{expense.growth || 0}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Financial Alerts */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <h3 className="text-lg font-semibold">Financial Alerts</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {/* Profit Margin Alert */}
              {profitMargin < 20 && (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-yellow-800">Low Profit Margin</div>
                    <div className="text-sm text-yellow-700">
                      Current margin: {profitMargin.toFixed(1)}% (Target: 25%)
                    </div>
                  </div>
                </div>
              )}

              {/* High Expense Growth */}
              {reportData?.expenses?.growthRate > 10 && (
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-red-800">Rising Expenses</div>
                    <div className="text-sm text-red-700">
                      Expenses increased by {reportData.expenses.growthRate}% this period
                    </div>
                  </div>
                </div>
              )}

              {/* Revenue Target */}
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium text-blue-800">Revenue Target</div>
                  <div className="text-sm text-blue-700">
                    {reportData?.summary?.totalRevenue >= (reportData?.targets?.revenue || 0) 
                      ? 'Target achieved!' 
                      : `${(((reportData?.targets?.revenue || 0) - (reportData?.summary?.totalRevenue || 0)) / 1000).toFixed(0)}k remaining`
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Comparison Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Monthly Financial Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expenses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Profit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData?.monthlyComparison?.map((month, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {month.period}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${month.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${month.expenses.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${month.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${month.profit.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {month.margin.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${month.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {month.growth >= 0 ? '+' : ''}{month.growth.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;