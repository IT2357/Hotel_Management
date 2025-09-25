import React from "react";
import classNames from "classnames";

const Badge = React.forwardRef(({
  children,
  variant = "primary",
  size = "md",
  className = "",
  rounded = "full",
}, ref) => {
  const variants = {
    primary: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    secondary: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    danger: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1 text-base",
  };

  const roundedStyles = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };

  return (
    <span
      ref={ref}
      className={classNames(
        "inline-flex items-center font-medium",
        variants[variant],
        sizes[size],
        roundedStyles[rounded],
        className
      )}
    >
      {children}
    </span>
  );
});
Badge.displayName = "Badge";

export { Badge };
export default Badge;