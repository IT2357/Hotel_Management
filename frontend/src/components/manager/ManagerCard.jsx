import * as React from "react";

// Utility function for merging classNames
const cn = (...classes) => classes.filter(Boolean).join(' ');

/**
 * Manager Card - Modern Light Theme Component
 * Designed specifically for manager dashboard pages
 * Always displays in light theme regardless of system preferences
 */
const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "rounded-2xl border-2 border-gray-200 bg-white text-gray-900 shadow-lg",
      "transition-all duration-300 hover:shadow-xl",
      className
    )} 
    {...props} 
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "flex flex-col space-y-2 p-6 border-b-2 border-gray-200",
        "bg-gradient-to-r from-gray-50 to-white",
        className
      )} 
      {...props} 
    />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(
  ({ className, ...props }, ref) => (
    <h3 
      ref={ref} 
      className={cn(
        "text-xl font-black text-gray-900 tracking-tight",
        className
      )} 
      {...props} 
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(
  ({ className, ...props }, ref) => (
    <p 
      ref={ref} 
      className={cn(
        "text-sm text-gray-600 font-medium",
        className
      )} 
      {...props} 
    />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn("p-6 bg-white", className)} 
      {...props} 
    />
  ),
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "flex items-center gap-3 p-6 border-t-2 border-gray-200",
        "bg-gradient-to-r from-white to-gray-50",
        className
      )} 
      {...props} 
    />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
