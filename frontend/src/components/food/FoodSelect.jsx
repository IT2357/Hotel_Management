import React from 'react';

const FoodSelect = ({ options = [], ...props }) => (
  <select className="block w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500" {...props}>
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

export default FoodSelect;