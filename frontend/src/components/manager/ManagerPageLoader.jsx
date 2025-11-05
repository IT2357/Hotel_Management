import React from 'react';
import { RefreshCw } from 'lucide-react';

const ManagerPageLoader = ({ 
  message = "Loading...", 
  size = "default",
  fullPage = true 
}) => {
  const sizeClasses = {
    small: "h-8 w-8",
    default: "h-12 w-12",
    large: "h-16 w-16"
  };

  const textSizes = {
    small: "text-sm",
    default: "text-base",
    large: "text-lg"
  };

  const containerClasses = fullPage 
    ? "min-h-screen bg-gray-50 flex items-center justify-center"
    : "flex items-center justify-center py-12";

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <RefreshCw className={`${sizeClasses[size]} animate-spin text-blue-600 mx-auto mb-4`} />
        <p className={`text-gray-600 ${textSizes[size]}`}>{message}</p>
      </div>
    </div>
  );
};

export default ManagerPageLoader;