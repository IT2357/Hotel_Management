import React from 'react';
import { RefreshCw } from 'lucide-react';

const ManagerPageHeader = ({ 
  title, 
  subtitle, 
  icon: Icon,
  actions = [],
  loading = false,
  onRefresh = null,
  className = ""
}) => {
  return (
    <div className={`bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Title Section */}
        <div className="flex items-center space-x-4">
          {Icon && (
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon className="h-6 w-6 text-blue-600" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Actions Section */}
        <div className="flex items-center space-x-3">
          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}

          {/* Custom Actions */}
          {actions.map((action, index) => {
            const ActionIcon = action.icon;
            return (
              <button
                key={index}
                onClick={action.onClick}
                disabled={action.disabled || loading}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  action.variant === 'primary' 
                    ? 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                    : action.variant === 'secondary'
                    ? 'text-blue-700 bg-blue-100 hover:bg-blue-200 focus:ring-blue-500'
                    : action.variant === 'danger'
                    ? 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-blue-500'
                }`}
              >
                {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
                {action.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ManagerPageHeader;