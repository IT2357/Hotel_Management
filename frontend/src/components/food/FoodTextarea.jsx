import React from 'react';

const FoodTextarea = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-colors resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${className}`}
      {...props}
    />
  );
});

FoodTextarea.displayName = 'FoodTextarea';

export default FoodTextarea;