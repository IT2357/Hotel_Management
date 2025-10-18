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
    container: 'rounded-2xl border border-[#162a52] bg-[#0f2349]/90 shadow-[0_18px_40px_rgba(8,14,29,0.55)] backdrop-blur-lg text-[#f5f7ff]',
    headerBorder: 'border-b border-[#162a52]/70',
    icon: 'text-[#facc15]',
    heading: 'text-lg font-semibold text-[#f5f7ff]',
    buttonClear: 'text-sm text-[#bcd1ff] hover:text-[#facc15] flex items-center gap-1 transition-colors',
    toggleButton: 'text-[#bcd1ff] hover:text-[#facc15] transition-colors',
    sectionSpacing: 'mb-6',
    label: 'block text-sm font-medium text-[#bcd1ff] mb-2',
    input: 'w-full px-3 py-2 border border-[#1b3265] bg-[#081931] text-[#f5f7ff] placeholder-[#8ba3d0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563eb]',
    pill: 'px-3 py-1 text-sm rounded-md bg-[#102a58] hover:bg-[#1b3a78] transition-colors text-[#f5f7ff]',
    checkbox: 'mr-2 rounded border-[#1b3265] bg-[#081931] text-[#38bdf8] focus:ring-[#2563eb]',
    checkboxLabel: 'text-sm text-[#d6e2ff]',
    compareLabel: 'text-sm font-medium text-[#bcd1ff]',
    subLabel: 'text-sm text-[#8ba3d0]',
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
      <div className={`p-4 ${theme.headerBorder}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className={`w-5 h-5 ${theme.icon}`} />
            <h3 className={theme.heading}>Report Filters</h3>
          </div>
          <div className="flex items-center gap-2">
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
              <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Date Range */}
        {showDateRange && (
          <div className={theme.sectionSpacing}>
            <label className={theme.label}>
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-4 mb-3">
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