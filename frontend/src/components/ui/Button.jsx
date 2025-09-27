// src/components/ui
import React from "react";
import { motion } from "framer-motion";
import classNames from "classnames";

const Button = React.forwardRef(({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  type = "button",
  onClick,
  ...props
}, ref) => {
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    warning: "bg-yellow-500 hover:bg-yellow-600 text-white",
    success: "bg-green-600 hover:bg-green-700 text-white",
    info: "bg-blue-600 hover:bg-blue-700 text-white",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-800 dark:hover:bg-gray-800 dark:text-white",
    outline: "border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-800 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-white",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      className={classNames(
        "rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      {...props}
    >
      {children}
    </motion.button>
  );
});
Button.displayName = "Button";

export { Button };
export default Button;