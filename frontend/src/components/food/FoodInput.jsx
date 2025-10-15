import React from 'react';

const FoodInput = ({ label, ...props }) => (
  <div className="mb-2">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <input className="block w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500" {...props} />
  </div>
);

export default FoodInput;