import React from 'react';

const FoodTitleCard = ({ children, ...props }) => (
  <h3 className="text-lg font-bold mb-2" {...props}>{children}</h3>
);

export default FoodTitleCard;