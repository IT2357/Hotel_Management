// src/components/food/ui/FoodInput.jsx - Food-specific input component
import React from "react";

export default function FoodInput({
  label,
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
  required = false,
  disabled = false,
  error,
  ...props
}) {
  const baseClasses = "block w-full px-4 py-3 text-base text-gray-900 bg-gray-50 rounded-lg border-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-orange-500 focus:outline-none focus:ring-0 focus:border-orange-600 peer transition-all duration-200";

  const errorClasses = error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "";

  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`${baseClasses} ${errorClasses} ${className}`}
        {...props}
      />
      {label && (
        <label
          htmlFor={id}
          className={`absolute text-base text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-7 scale-75 top-3 -z-10 origin-[0] left-4 peer-focus:left-0 peer-focus:text-orange-600 peer-focus:dark:text-orange-500 ${value ? 'scale-75 -translate-y-7' : 'peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-7'}`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
    </div>
  );
}

export { FoodInput };
