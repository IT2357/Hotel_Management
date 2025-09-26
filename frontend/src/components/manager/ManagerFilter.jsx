import React, { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';

const ManagerFilter = ({
  filters = [],
  activeFilters = {},
  onFilterChange = () => {},
  onClearAll = () => {},
  showClearAll = true
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters = Object.keys(activeFilters).some(key => 
    activeFilters[key] && 
    (Array.isArray(activeFilters[key]) ? activeFilters[key].length > 0 : true)
  );

  const handleFilterChange = (key, value) => {
    onFilterChange(key, value);
  };

  const getActiveFilterCount = () => {
    return Object.keys(activeFilters).reduce((count, key) => {
      const value = activeFilters[key];
      if (Array.isArray(value)) {
        return count + value.length;
      }
      return value ? count + 1 : count;
    }, 0);
  };

  return (
    <div className="relative">
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center px-4 py-2 text-sm font-medium border rounded-md transition-colors ${
          hasActiveFilters
            ? 'bg-blue-50 text-blue-700 border-blue-200'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
      >
        <Filter className="h-4 w-4 mr-2" />
        Filters
        {hasActiveFilters && (
          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
            {getActiveFilterCount()}
          </span>
        )}
        <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Filter Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Filter Panel */}
          <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Filters</h3>
                {showClearAll && hasActiveFilters && (
                  <button
                    onClick={() => {
                      onClearAll();
                      setIsOpen(false);
                    }}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {filters.map((filter) => (
                  <div key={filter.key} className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {filter.label}
                    </label>
                    
                    {filter.type === 'select' && (
                      <select
                        value={activeFilters[filter.key] || ''}
                        onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">All {filter.label}</option>
                        {filter.options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {filter.type === 'multi-select' && (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {filter.options.map((option) => (
                          <label key={option.value} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={(activeFilters[filter.key] || []).includes(option.value)}
                              onChange={(e) => {
                                const currentValues = activeFilters[filter.key] || [];
                                const newValues = e.target.checked
                                  ? [...currentValues, option.value]
                                  : currentValues.filter(v => v !== option.value);
                                handleFilterChange(filter.key, newValues);
                              }}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {filter.type === 'date-range' && (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          placeholder="From"
                          value={activeFilters[`${filter.key}_from`] || ''}
                          onChange={(e) => handleFilterChange(`${filter.key}_from`, e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                          type="date"
                          placeholder="To"
                          value={activeFilters[`${filter.key}_to`] || ''}
                          onChange={(e) => handleFilterChange(`${filter.key}_to`, e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}

                    {filter.type === 'search' && (
                      <input
                        type="text"
                        placeholder={filter.placeholder || `Search ${filter.label}`}
                        value={activeFilters[filter.key] || ''}
                        onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-3">
          {Object.keys(activeFilters).map((key) => {
            const value = activeFilters[key];
            const filter = filters.find(f => f.key === key || key.startsWith(f.key));
            
            if (!value || (Array.isArray(value) && value.length === 0)) return null;
            
            const displayValue = Array.isArray(value) 
              ? value.join(', ')
              : typeof value === 'string' && value.length > 20
              ? value.substring(0, 20) + '...'
              : value;

            return (
              <span
                key={key}
                className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
              >
                {filter?.label || key}: {displayValue}
                <button
                  onClick={() => handleFilterChange(key, Array.isArray(value) ? [] : '')}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ManagerFilter;