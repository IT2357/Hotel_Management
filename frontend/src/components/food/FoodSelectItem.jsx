import React from 'react';

const FoodSelectItem = ({ children, value, ...props }) => (
  <option value={value} {...props}>{children}</option>
);

export default FoodSelectItem;