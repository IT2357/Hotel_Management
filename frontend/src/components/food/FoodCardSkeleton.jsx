import React from 'react';

const FoodCardSkeleton = () => {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 animate-pulse text-center">
      {/* Circular Image Skeleton */}
      <div className="relative w-full aspect-square mb-6">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 shadow-2xl"></div>
        <div className="absolute inset-0 rounded-full border-8 border-white"></div>
      </div>
      
      {/* Content Skeleton */}
      <div className="space-y-3">
        {/* Food Name */}
        <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-3/4 mx-auto" />
        
        {/* Category */}
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2 mx-auto" />
        
        {/* Price */}
        <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-1/3 mx-auto mt-4" />
      </div>
    </div>
  );
};

export default FoodCardSkeleton;

