import React from 'react';

const FoodSelect = React.forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-colors bg-white ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});

FoodSelect.displayName = 'FoodSelect';

export default FoodSelect;