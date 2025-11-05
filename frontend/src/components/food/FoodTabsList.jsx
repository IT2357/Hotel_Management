import React from 'react';

const FoodTabsList = ({ children, ...props }) => (
  <div className="flex border-b mb-2" {...props}>{children}</div>
);

export default FoodTabsList;