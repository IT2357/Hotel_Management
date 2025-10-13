// src/components/food/ui/FoodLabel.jsx - Food-specific label component
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
          : 'text-gray-700 hover:text-gray-900 cursor-pointer dark:text-gray-300 dark:hover:text-gray-100'
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
