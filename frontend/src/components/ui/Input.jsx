import React from "react";
import classNames from "classnames";

const Input = React.forwardRef(({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder = "",
  className = "",
  required = false,
  disabled = false,
  ...props
}, ref) => {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={classNames(
          "block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white",
          className
        )}
        {...props}
      />
    </div>
  );
});
Input.displayName = "Input";

export { Input };