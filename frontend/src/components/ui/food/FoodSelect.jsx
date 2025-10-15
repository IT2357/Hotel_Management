// src/components/ui/food/FoodSelect.jsx - Food-specific select component
import React from 'react';

const FoodSelect = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <select
      className={`block w-full rounded-lg border-2 border-gray-300 bg-white py-3 px-4 shadow-sm transition-all duration-200 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:focus:border-orange-500 text-base ${className || ''}`}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  );
});

FoodSelect.displayName = 'FoodSelect';

export { FoodSelect };
export default FoodSelect;