import React from 'react';

const FoodButton = ({ children, ...props }) => (
  <button className="bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2 font-semibold transition-colors" {...props}>
    {children}
  </button>
);

export default FoodButton;