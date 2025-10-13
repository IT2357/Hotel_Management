// src/components/food/ui/FoodCard.jsx - Food-specific card component
import React from "react";
import { motion } from "framer-motion";

export default function FoodCard({
  title,
  children,
  className = "",
  headerClassName = "",
  bodyClassName = "",
  footer,
  footerClassName = "",
  hover = true,
  variant = "default",
}) {
  const variants = {
    default: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
    elevated: "bg-white dark:bg-gray-800 border-0 shadow-lg dark:shadow-2xl",
    outlined: "bg-white dark:bg-gray-800 border-2 border-orange-200 dark:border-orange-700",
    gradient: "bg-gradient-to-br from-white via-orange-50 to-red-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 border border-orange-100 dark:border-gray-600",
  };

  return (
    <motion.div
      className={`rounded-2xl overflow-hidden ${variants[variant]} ${className}`}
      whileHover={hover ? {
        y: -8,
        scale: 1.02,
        boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
        transition: { type: "spring", stiffness: 300, damping: 20 }
      } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {title && (
        <div className={`px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 ${headerClassName}`}>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            {title}
          </h3>
        </div>
      )}
      <div className={`p-6 ${bodyClassName}`}>
        {children}
      </div>
      {footer && (
        <div className={`px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 ${footerClassName}`}>
          {footer}
        </div>
      )}
    </motion.div>
  );
}

// Card Header Component
export function FoodCardHeader({
  children,
  className = "",
  ...props
}) {
  return (
    <div className={`px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 ${className}`} {...props}>
      {children}
    </div>
  );
}

// Card Title Component
export function FoodCardTitle({
  children,
  className = "",
  ...props
}) {
  return (
    <h3 className={`text-xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent ${className}`} {...props}>
      {children}
    </h3>
  );
}

// Card Content Component
export function FoodCardContent({
  children,
  className = "",
  ...props
}) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

// Card Footer Component
export function FoodCardFooter({
  children,
  className = "",
  ...props
}) {
  return (
    <div className={`px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 ${className}`} {...props}>
      {children}
    </div>
  );
}

export { FoodCard };
