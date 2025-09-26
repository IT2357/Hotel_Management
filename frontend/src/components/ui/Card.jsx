// src/components/ui/card.jsx
import React from "react";
import { motion } from "framer-motion";

function Card({
  title,
  children,
  className = "",
  headerClassName = "",
  bodyClassName = "",
  footer,
  footerClassName = "",
}) {
  return (
    <motion.div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
      whileHover={{ y: -5, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {title && (
        <div className={`px-4 py-3 border-b border-gray-200 dark:border-gray-700 ${headerClassName}`}>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
        </div>
      )}
      <div className={`${bodyClassName}`}>
        {children}
      </div>
      {footer && (
        <div className={`px-4 py-3 border-t border-gray-200 dark:border-gray-700 ${footerClassName}`}>
          {footer}
        </div>
      )}
    </motion.div>
  );
}


// Card Header Component
function CardHeader({
  children,
  className = "",
  ...props
}) {
  return (
    <div className={`px-4 py-3 border-b border-gray-200 dark:border-gray-700 ${className}`} {...props}>
      {children}
    </div>
  );
}

// Card Title Component
function CardTitle({
  children,
  className = "",
  ...props
}) {
  return (
    <h3 className={`text-lg font-medium text-gray-900 dark:text-white ${className}`} {...props}>
      {children}
    </h3>
  );
}

// Card Content Component
function CardContent({
  children,
  className = "",
  ...props
}) {
  return (
    <div className={`${className}`} {...props}>
      {children}
    </div>
  );
}

// Card Footer Component
function CardFooter({
  children,
  className = "",
  ...props
}) {
  return (
    <div className={`px-4 py-3 border-t border-gray-200 dark:border-gray-700 ${className}`} {...props}>
      {children}
    </div>
  );
}

// Named export for backward compatibility
const CardComponent = Card;
export { CardComponent as Card, CardHeader, CardTitle, CardContent, CardFooter };

// Default export
export default Card;
