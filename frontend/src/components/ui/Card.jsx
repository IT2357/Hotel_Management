// src/components/ui/Card.jsx
import React from "react";

export function Card({
  title,
  children,
  className = "",
  headerClassName = "",
  bodyClassName = "",
  footer,
  footerClassName = "",
}) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
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
    </div>
  );
}

export default Card;

// Card Header Component
export function CardHeader({
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
export function CardTitle({
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
export function CardContent({
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
export function CardFooter({
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