import React from 'react';

const FoodHeaderCard = ({ children, ...props }) => (
  <div className="bg-green-100 rounded-t-lg p-3 font-bold text-green-800" {...props}>{children}</div>
);

export default FoodHeaderCard;