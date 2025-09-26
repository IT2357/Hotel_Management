import React from 'react';

const Label = React.forwardRef(({
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70';

  return (
    <label
      className={`${baseClasses} ${className}`}
      ref={ref}
      {...props}
    />
  );
});

Label.displayName = 'Label';

export { Label };
export default Label;
