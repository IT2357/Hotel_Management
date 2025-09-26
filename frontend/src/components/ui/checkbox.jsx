// src/components/ui/checkbox.jsx
import React from "react";
import classNames from "classnames";

const Checkbox = React.forwardRef(({
  checked,
  onChange,
  disabled = false,
  className = "",
  id,
  ...props
}, ref) => {
  return (
    <input
      ref={ref}
      type="checkbox"
      id={id}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className={classNames(
        "h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
});

Checkbox.displayName = "Checkbox";

export { Checkbox };