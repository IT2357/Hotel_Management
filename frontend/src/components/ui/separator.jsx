import React from 'react';

const Separator = React.forwardRef(({ 
  orientation = "horizontal", 
  className = "", 
  ...props 
}, ref) => {
  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation={orientation}
      className={`
        shrink-0 bg-gray-200 dark:bg-gray-700
        ${orientation === "horizontal" 
          ? "h-[1px] w-full" 
          : "h-full w-[1px]"
        }
        ${className}
      `}
      {...props}
    />
  );
});

Separator.displayName = 'Separator';

export { Separator };
export default Separator;