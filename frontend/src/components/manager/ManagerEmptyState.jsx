import React from 'react';
import { Plus, Search, FileText } from 'lucide-react';

const ManagerEmptyState = ({ 
  icon: CustomIcon = FileText,
  title = "No data found",
  message = "There are no items to display at the moment.",
  actionLabel = null,
  onAction = null,
  actionIcon: ActionIcon = Plus,
  fullPage = false
}) => {
  const containerClasses = fullPage 
    ? "min-h-screen bg-gray-50 flex items-center justify-center"
    : "flex items-center justify-center py-16";

  return (
    <div className={containerClasses}>
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-6">
          <CustomIcon className="h-8 w-8 text-gray-400" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <ActionIcon className="h-4 w-4 mr-2" />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default ManagerEmptyState;