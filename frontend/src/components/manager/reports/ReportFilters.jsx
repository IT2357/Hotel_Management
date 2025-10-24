import React, { useState } from 'react';
import { ChevronDown, Filter, X, Calendar, Clock } from 'lucide-react';

const THEMES = {
  light: {
    container: 'bg-white rounded-lg shadow border border-gray-200',
    headerBorder: 'border-b border-gray-200',
    icon: 'text-gray-600',
    heading: 'text-lg font-semibold text-gray-900',
    buttonClear: 'text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1',
    toggleButton: 'text-gray-500 hover:text-gray-700',
    sectionSpacing: 'mb-6',
    label: 'block text-sm font-medium text-gray-700 mb-2',
    input: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
    pill: 'px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors',
    checkbox: 'mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500',
    checkboxLabel: 'text-sm',
    compareLabel: 'text-sm font-medium text-gray-700',
    subLabel: 'text-sm text-gray-600',
  },
  manager: {
    container: 'relative overflow-hidden rounded-3xl bg-white shadow-lg border border-gray-100',
    headerBorder: 'border-b border-gray-100',
    icon: 'text-white',
    heading: 'text-xl font-black text-gray-900 tracking-tight',
    buttonClear: 'text-sm text-gray-600 hover:text-red-600 flex items-center gap-2 transition-all font-semibold hover:scale-105',
    toggleButton: 'text-gray-600 hover:text-indigo-600 transition-all hover:scale-110',
    sectionSpacing: 'mb-6',
    label: 'block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider',
    input: 'w-full px-4 py-3 border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium transition-all hover:border-indigo-300',
    pill: 'px-4 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-gray-100 to-gray-50 hover:from-indigo-100 hover:to-purple-100 text-gray-700 hover:text-indigo-700 border border-gray-200 hover:border-indigo-300 transition-all hover:shadow-md hover:-translate-y-0.5',
    checkbox: 'mr-3 rounded-md border-gray-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 w-5 h-5 transition-all',
    checkboxLabel: 'text-sm text-gray-700 font-medium hover:text-indigo-700 transition-colors',
    compareLabel: 'text-sm font-semibold text-gray-900 hover:text-indigo-700 transition-colors',
    subLabel: 'text-sm text-gray-500',
  },
};

const ReportFilters = ({ 
  onFiltersChange, 
  initialFilters = {},
  className = '',
  showDateRange = true,
  showPeriod = true,
  showDepartments = true,
  showChannels = true,
  showComparison = true,
  variant = 'light'
}) => {
  const theme = THEMES[variant] ?? THEMES.light;
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
    <div className={`${theme.container} ${className}`}>
      {/* Background gradient overlay for manager theme */}
      {variant === 'manager' && (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 pointer-events-none" />
      )}
      
      <div className={`relative p-6 ${theme.headerBorder}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center rounded-xl p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
              <Filter className={`w-5 h-5 ${theme.icon}`} />
            </div>
            <div>
              <h3 className={theme.heading}>Report Filters</h3>
              <p className="text-xs text-gray-500 font-medium">Customize your report data</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={clearFilters}
              className={theme.buttonClear}
            >
              <X className="w-4 h-4" />
              Clear
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-2 rounded-lg hover:bg-gray-100 ${theme.toggleButton}`}
            >
              <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="relative p-6">
        {/* Date Range */}
        {showDateRange && (
          <div className={theme.sectionSpacing}>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <label className={theme.label}>
                Date Range
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="relative">
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className={theme.input}
                />
              </div>
              <div className="relative">
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className={theme.input}
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setQuickDateRange(7)}
                className={theme.pill}
              >
                Last 7 days
              </button>
              <button
                onClick={() => setQuickDateRange(30)}
                className={theme.pill}
              >
                Last 30 days
              </button>
              <button
                onClick={() => setQuickDateRange(90)}
                className={theme.pill}
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
              <div className={theme.sectionSpacing}>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <label className={theme.label}>
                    Group By Period
                  </label>
                </div>
                <select
                  value={filters.period}
                  onChange={(e) => handleFilterChange('period', e.target.value)}
                  className={theme.input}
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
              <div className={theme.sectionSpacing}>
                <label className={theme.label}>
                  Departments
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {departments.map(dept => (
                    <label key={dept.value} className="flex items-center p-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.departments.includes(dept.value)}
                        onChange={(e) => handleArrayFilterChange('departments', dept.value, e.target.checked)}
                        className={theme.checkbox}
                      />
                      <span className={theme.checkboxLabel}>{dept.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Booking Channels */}
            {showChannels && (
              <div className={theme.sectionSpacing}>
                <label className={theme.label}>
                  Booking Channels
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {channels.map(channel => (
                    <label key={channel.value} className="flex items-center p-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.channels.includes(channel.value)}
                        onChange={(e) => handleArrayFilterChange('channels', channel.value, e.target.checked)}
                        className={theme.checkbox}
                      />
                      <span className={theme.checkboxLabel}>{channel.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Comparison */}
            {showComparison && (
              <div className={theme.sectionSpacing}>
                <label className="flex items-center p-4 rounded-xl border-2 border-gray-200 hover:border-indigo-300 bg-gradient-to-r from-gray-50 to-white hover:from-indigo-50 hover:to-purple-50 transition-all cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={filters.compare}
                    onChange={(e) => handleFilterChange('compare', e.target.checked)}
                    className={theme.checkbox}
                  />
                  <div className="flex-1">
                    <span className={theme.compareLabel}>Compare with previous period</span>
                    <p className="text-xs text-gray-500 mt-0.5">View trends and changes over time</p>
                  </div>
                </label>
                
                {filters.compare && (
                  <select
                    value={filters.comparePeriod}
                    onChange={(e) => handleFilterChange('comparePeriod', e.target.value)}
                    className={theme.input}
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