import React from 'react';

const FoodContentCard = ({ children, ...props }) => (
  <div className="bg-gray-50 rounded-lg p-4 shadow-inner" {...props}>{children}</div>
);

export default FoodContentCard;