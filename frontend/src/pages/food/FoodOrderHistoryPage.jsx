import React from 'react';
import FoodOrderHistory from '../../components/food/FoodOrderHistory';

const FoodOrderHistoryPage = () => {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-[#C41E3A]">My Food Orders</h1>
      <FoodOrderHistory />
    </div>
  );
};

export default FoodOrderHistoryPage;
