import React from 'react';

const LoadingSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="h-48 sm:h-56 bg-gray-200"></div>
      
      {/* Content Skeleton */}
      <div className="p-4 sm:p-5">
        {/* Title */}
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
        
        {/* Description */}
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
        
        {/* Tags */}
        <div className="flex gap-2 mb-4">
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
        </div>
        
        {/* Price & Button */}
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-24"></div>
          <div className="h-10 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
