// src/components/ui/food/FoodTabs.jsx - Food-specific tabs component
import React, { useState } from 'react';

const FoodTabs = ({ children, defaultValue, value, onValueChange, className = '' }) => {
  const [activeTab, setActiveTab] = useState(value || defaultValue);

  const handleTabChange = (newValue) => {
    setActiveTab(newValue);
    onValueChange?.(newValue);
  };

  return (
    <div className={`w-full ${className}`}>
      {React.Children.map(children, child => 
        React.cloneElement(child, { 
          activeTab, 
          onTabChange: handleTabChange 
        })
      )}
    </div>
  );
};

const FoodTabsList = ({ children, className = '', activeTab, onTabChange }) => {
  return (
    <div className={`inline-flex h-12 items-center justify-center rounded-lg bg-gray-100 p-1 text-gray-500 dark:bg-gray-800 dark:text-gray-400 shadow-inner ${className}`}>
      {React.Children.map(children, child => 
        React.cloneElement(child, { 
          activeTab, 
          onTabChange 
        })
      )}
    </div>
  );
};

const FoodTabsTrigger = ({ children, value, className = '', activeTab, onTabChange }) => {
  const isActive = activeTab === value;
  
  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isActive
          ? 'bg-white text-orange-600 shadow-sm dark:bg-gray-900 dark:text-orange-400'
          : 'hover:bg-white/60 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300'
      } ${className}`}
      onClick={() => onTabChange?.(value)}
    >
      {children}
    </button>
  );
};

const FoodTabsContent = ({ children, value, className = '', activeTab }) => {
  if (activeTab !== value) return null;
  
  return (
    <div className={`mt-4 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 dark:ring-offset-gray-950 ${className}`}>
      {children}
    </div>
  );
};

export {
  FoodTabs as Tabs,
  FoodTabsList as TabsList,
  FoodTabsTrigger as TabsTrigger,
  FoodTabsContent as TabsContent,
};

export default FoodTabs;