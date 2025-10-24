import React, { useState, useEffect } from 'react';

const FoodInput = React.forwardRef(({ 
  className = '', 
  type = 'text',
  value,
  onChange,
  formatPrice = false,
  ...props 
}, ref) => {
  const [displayValue, setDisplayValue] = useState(value || '');

  useEffect(() => {
    setDisplayValue(value || '');
  }, [value]);

  const handleChange = (e) => {
    let newValue = e.target.value;
    
    if (formatPrice && type === 'number') {
      // Remove any non-numeric characters except decimal point
      newValue = newValue.replace(/[^0-9.]/g, '');
      
      // Ensure only one decimal point
      const parts = newValue.split('.');
      if (parts.length > 2) {
        newValue = parts[0] + '.' + parts.slice(1).join('');
      }
      
      // Limit to 2 decimal places
      if (parts[1] && parts[1].length > 2) {
        newValue = parts[0] + '.' + parts[1].substring(0, 2);
      }
    }
    
    setDisplayValue(newValue);
    
    if (onChange) {
      // Create a synthetic event with the formatted value
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: newValue
        }
      };
      onChange(syntheticEvent);
    }
  };

  const handleKeyDown = (e) => {
    if (formatPrice && type === 'number') {
      // Allow: backspace, delete, tab, escape, enter, decimal point
      if ([8, 9, 27, 13, 46, 110, 190].indexOf(e.keyCode) !== -1 ||
          // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
          (e.keyCode === 65 && e.ctrlKey === true) ||
          (e.keyCode === 67 && e.ctrlKey === true) ||
          (e.keyCode === 86 && e.ctrlKey === true) ||
          (e.keyCode === 88 && e.ctrlKey === true) ||
          // Allow: home, end, left, right, down, up
          (e.keyCode >= 35 && e.keyCode <= 40)) {
        return;
      }
      // Ensure that it is a number and stop the keypress
      if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
        e.preventDefault();
      }
    }
  };

  return (
    <input
      ref={ref}
      type={type}
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${className}`}
      {...props}
    />
  );
});

FoodInput.displayName = 'FoodInput';

export default FoodInput;