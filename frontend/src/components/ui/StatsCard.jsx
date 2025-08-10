// src/components/ui/StatsCard.jsx
import React from "react";

export default function StatsCard({
  title,
  value,
  trend = 0,
  variant = "primary",
  className = "",
}) {
  const variants = {
    primary: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    secondary: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    danger: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  };

  const trendColor = trend > 0 
    ? "text-green-600 dark:text-green-400" 
    : trend < 0 
      ? "text-red-600 dark:text-red-400" 
      : "text-gray-600 dark:text-gray-400";

  const trendIcon = trend > 0 ? (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M12 7a1 1 0 01-1-1V5.414l-4.293 4.293a1 1 0 01-1.414-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L13 5.414V6a1 1 0 01-1 1z" clipRule="evenodd" />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M12 13a1 1 0 100-2H5.414l4.293-4.293a1 1 0 00-1.414-1.414l-6 6a1 1 0 000 1.414l6 6a1 1 0 001.414-1.414L5.414 13H12z" clipRule="evenodd" />
    </svg>
  );

  return (
    <div className={`rounded-lg p-6 shadow-sm ${variants[variant]} ${className}`}>
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="mt-2 flex items-baseline space-x-2">
        <p className="text-2xl font-semibold">{value}</p>
        <div className={`flex items-center text-sm font-medium ${trendColor}`}>
          {trend !== 0 && (
            <>
              {trendIcon}
              <span>{Math.abs(trend)}%</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}