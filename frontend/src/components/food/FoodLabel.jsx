import React from 'react';

const FoodLabel = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={`block text-sm font-medium text-[#4A4A4A] mb-2 ${className}`}
      {...props}
    />
  );
});

FoodLabel.displayName = 'FoodLabel';

export default FoodLabel;