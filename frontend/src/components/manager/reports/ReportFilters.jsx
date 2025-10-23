import React, { useState } from 'react';
import { ChevronDown, Filter, X } from 'lucide-react';

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
    container: 'rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-700 to-indigo-800 shadow-2xl border-0',
    headerBorder: 'border-b border-white/10',
    icon: 'text-yellow-300',
    heading: 'text-xl font-black text-white tracking-tight',
    buttonClear: 'text-sm text-blue-100 hover:text-yellow-300 flex items-center gap-2 transition-all font-bold hover:scale-110',
    toggleButton: 'text-blue-100 hover:text-yellow-300 transition-all hover:scale-110',
    sectionSpacing: 'mb-6',
    label: 'block text-xs font-black text-blue-200 mb-2.5 uppercase tracking-widest',
    input: 'w-full px-4 py-3 border-0 bg-white/10 backdrop-blur-sm text-white placeholder-blue-200/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 font-semibold transition-all hover:bg-white/15',
    pill: 'px-5 py-2.5 text-sm font-bold rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all text-white hover:shadow-lg hover:-translate-y-0.5',
    checkbox: 'mr-3 rounded-md border-white/30 bg-white/10 text-yellow-400 focus:ring-yellow-400 focus:ring-offset-0 w-4 h-4',
    checkboxLabel: 'text-sm text-white font-semibold',
    compareLabel: 'text-sm font-bold text-white',
    subLabel: 'text-sm text-blue-200',
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
      <div className={`p-6 ${theme.headerBorder}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-yellow-400/20 backdrop-blur-sm">
              <Filter className={`w-5 h-5 ${theme.icon}`} />
            </div>
            <h3 className={theme.heading}>Report Filters</h3>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={clearFilters}
              className={theme.buttonClear}
            >
              <X className="w-4 h-4" />
              Clear
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={theme.toggleButton}
            >
              <ChevronDown className={`w-6 h-6 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Date Range */}
        {showDateRange && (
          <div className={theme.sectionSpacing}>
            <label className={theme.label}>
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className={theme.input}
                />
              </div>
              <div>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className={theme.input}
                />
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
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
                <label className={theme.label}>
                  Group By Period
                </label>
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
                <div className="grid grid-cols-2 gap-2">
                  {departments.map(dept => (
                    <label key={dept.value} className="flex items-center">
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
                <div className="grid grid-cols-2 gap-2">
                  {channels.map(channel => (
                    <label key={channel.value} className="flex items-center">
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
                <label className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    checked={filters.compare}
                    onChange={(e) => handleFilterChange('compare', e.target.checked)}
                    className={theme.checkbox}
                  />
                  <span className={theme.compareLabel}>Compare with previous period</span>
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