import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const TabsContext = React.createContext();

export const Tabs = ({ defaultValue, value, onValueChange, children, className, ...props }) => {
  const [internalValue, setInternalValue] = useState(defaultValue);

  const currentValue = value !== undefined ? value : internalValue;
  const handleValueChange = onValueChange || setInternalValue;

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={className} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

Tabs.propTypes = {
  defaultValue: PropTypes.string,
  value: PropTypes.string,
  onValueChange: PropTypes.func,
  children: PropTypes.node,
  className: PropTypes.string
};

export const TabsList = ({ className, children, ...props }) => (
  <div
    className={classNames(
      "inline-flex h-10 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 p-1 text-gray-600 dark:text-gray-400",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

TabsList.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};

export const TabsTrigger = ({ value, className, children, ...props }) => {
  const { value: currentValue, onValueChange } = React.useContext(TabsContext);

  return (
    <button
      className={classNames(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        currentValue === value
          ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
          : "hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white",
        className
      )}
      onClick={() => onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
};

TabsTrigger.propTypes = {
  value: PropTypes.string.isRequired,
  className: PropTypes.string,
  children: PropTypes.node
};

export const TabsContent = ({ value, className, children, ...props }) => {
  const { value: currentValue } = React.useContext(TabsContext);

  if (currentValue !== value) return null;

  return (
    <div
      className={classNames(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

TabsContent.propTypes = {
  value: PropTypes.string.isRequired,
  className: PropTypes.string,
  children: PropTypes.node
};

// Simple FoodTabs (for backward compatibility)
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

FoodTabs.propTypes = {
  tabs: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string,
    content: PropTypes.node
  })),
  defaultIndex: PropTypes.number
};

export default FoodTabs;