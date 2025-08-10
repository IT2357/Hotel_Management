// src/components/ui/Textarea.jsx
import React from "react";

export default function Textarea({
  label,
  id,
  value,
  onChange,
  placeholder = "",
  className = "",
  required = false,
  disabled = false,
  rows = 3,
  ...props
}) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white ${className}`}
        {...props}
      />
    </div>
  );
}