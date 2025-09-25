import React, { useState } from 'react';
import { Calendar, ChevronDown, Filter, X } from 'lucide-react';

const ReportFilters = ({ 
  onFiltersChange, 
  initialFilters = {},
  className = '',
  showDateRange = true,
  showPeriod = true,
  showDepartments = true,
  showChannels = true,
  showComparison = true
}) => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    period: 'monthly',
    departments: [],
    channels: [],
    compare: false,
    comparePeriod: 'previous',
    ...initialFilters
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const departments = [
    { value: 'Kitchen', label: 'Kitchen' },
    { value: 'Services', label: 'Services' },
    { value: 'Maintenance', label: 'Maintenance' },
    { value: 'Cleaning', label: 'Cleaning' }
  ];

  const channels = [
    { value: 'direct', label: 'Direct' },
    { value: 'online', label: 'Online' },
    { value: 'phone', label: 'Phone' },
    { value: 'walk-in', label: 'Walk-in' },
    { value: 'agent', label: 'Agent' },
    { value: 'corporate', label: 'Corporate' }
  ];

  const periods = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  const comparePeriods = [
    { value: 'previous', label: 'Previous Period' },
    { value: 'previous_year', label: 'Previous Year' }
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleArrayFilterChange = (key, value, checked) => {
    const currentArray = filters[key] || [];
    const newArray = checked 
      ? [...currentArray, value]
      : currentArray.filter(item => item !== value);
    
    handleFilterChange(key, newArray);
  };

  const clearFilters = () => {
    const clearedFilters = {
      startDate: '',
      endDate: '',
      period: 'monthly',
      departments: [],
      channels: [],
      compare: false,
      comparePeriod: 'previous'
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const setQuickDateRange = (days) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    handleFilterChange('endDate', endDate.toISOString().split('T')[0]);
    handleFilterChange('startDate', startDate.toISOString().split('T')[0]);
  };

  return (
    <div className={`bg-white rounded-lg shadow border ${className}`}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold">Report Filters</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-gray-700"
            >
              <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Date Range */}
        {showDateRange && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setQuickDateRange(7)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Last 7 days
              </button>
              <button
                onClick={() => setQuickDateRange(30)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Last 30 days
              </button>
              <button
                onClick={() => setQuickDateRange(90)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Last 90 days
              </button>
            </div>
          </div>
        )}

        {isExpanded && (
          <>
            {/* Period */}
            {showPeriod && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group By Period
                </label>
                <select
                  value={filters.period}
                  onChange={(e) => handleFilterChange('period', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {periods.map(period => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Departments */}
            {showDepartments && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departments
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {departments.map(dept => (
                    <label key={dept.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.departments.includes(dept.value)}
                        onChange={(e) => handleArrayFilterChange('departments', dept.value, e.target.checked)}
                        className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{dept.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Booking Channels */}
            {showChannels && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booking Channels
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {channels.map(channel => (
                    <label key={channel.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.channels.includes(channel.value)}
                        onChange={(e) => handleArrayFilterChange('channels', channel.value, e.target.checked)}
                        className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{channel.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Comparison */}
            {showComparison && (
              <div className="mb-6">
                <label className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    checked={filters.compare}
                    onChange={(e) => handleFilterChange('compare', e.target.checked)}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Compare with previous period</span>
                </label>
                
                {filters.compare && (
                  <select
                    value={filters.comparePeriod}
                    onChange={(e) => handleFilterChange('comparePeriod', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {comparePeriods.map(period => (
                      <option key={period.value} value={period.value}>
                        {period.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReportFilters;