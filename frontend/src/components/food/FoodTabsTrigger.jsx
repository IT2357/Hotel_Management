import React from 'react';

const FoodTabsTrigger = ({ children, active, ...props }) => (
  <button className={`px-4 py-2 -mb-px border-b-2 font-medium ${active ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500'}`} {...props}>
    {children}
  </button>
);

export default FoodTabsTrigger;