import React from 'react';

const Input = React.forwardRef(({
  className = '',
  type = 'text',
  ...props
}, ref) => {
  const baseClasses = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <input
      type={type}
      className={`${baseClasses} ${className}`}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input };
export default Input;
