import React from 'react';
import PropTypes from 'prop-types';

export default function FoodBadge({
  children,
  variant = 'default',
  size = 'default',
  className = '',
  ...props
}) {
  const variants = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    primary: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    secondary: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    featured: 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white',
    popular: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
    new: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
    spicy: 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    default: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

FoodBadge.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(['default', 'primary', 'secondary', 'success', 'warning', 'danger', 'featured', 'popular', 'new', 'spicy']),
  size: PropTypes.oneOf(['sm', 'default', 'lg']),
  className: PropTypes.string
};

export { FoodBadge };