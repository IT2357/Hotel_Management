// src/components/ui/food/FoodLabel.jsx - Food-specific label component
import React from 'react';

export default function FoodLabel({
  children,
  htmlFor,
  required = false,
  className = '',
  disabled = false,
  ...props
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`
        block text-sm font-medium mb-2 transition-colors duration-200
        ${disabled
          ? 'text-gray-400 cursor-not-allowed'
          : 'text-gray-700 hover:text-orange-600 cursor-pointer dark:text-gray-300 dark:hover:text-orange-400'
        }
        ${className}
      `}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

export { FoodLabel };