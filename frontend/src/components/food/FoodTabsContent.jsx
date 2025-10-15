import React from 'react';

const FoodTabsContent = ({ children, ...props }) => (
  <div className="p-4" {...props}>{children}</div>
);

export default FoodTabsContent;