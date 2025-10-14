import React from 'react';

const FoodSelect = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <select
      className={`block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 sm:text-sm ${className || ''}`}
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
