import React from 'react';

const FoodSelectTrigger = ({ children, ...props }) => (
  <button className="px-4 py-2 border rounded bg-green-50 text-green-700" {...props}>{children}</button>
);

export default FoodSelectTrigger;