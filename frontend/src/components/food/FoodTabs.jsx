import React, { useState } from 'react';

const FoodTabs = ({ tabs = [], defaultIndex = 0 }) => {
  const [active, setActive] = useState(defaultIndex);
  return (
    <div>
      <div className="flex border-b mb-2">
        {tabs.map((tab, idx) => (
          <button
            key={tab.label}
            className={`px-4 py-2 -mb-px border-b-2 font-medium ${active === idx ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500'}`}
            onClick={() => setActive(idx)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs[active]?.content}</div>
    </div>
  );
};

export default FoodTabs;