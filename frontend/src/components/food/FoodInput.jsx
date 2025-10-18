import React from 'react';

const FoodInput = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-colors ${className}`}
      {...props}
    />
  );
});

FoodInput.displayName = 'FoodInput';

export default FoodInput;