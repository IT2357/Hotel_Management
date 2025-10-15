import React from 'react';

const FoodLabel = ({ children, ...props }) => (
  <label className="block text-sm font-medium text-gray-700" {...props}>{children}</label>
);

export default FoodLabel;