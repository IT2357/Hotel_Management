import React from 'react';

const FoodBadge = ({ children, color = 'green', ...props }) => (
  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded bg-${color}-100 text-${color}-800`} {...props}>
    {children}
  </span>
);

export default FoodBadge;