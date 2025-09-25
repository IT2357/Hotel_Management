// src/components/ui/Label.jsx
import React from 'react';

function Label({
  children,
  htmlFor,
  required = false,
  className = '',
  disabled = false,
  ...props
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`
        block text-sm font-medium mb-2 transition-colors duration-200
        ${disabled
          ? 'text-gray-400 cursor-not-allowed'
          : 'text-gray-700 hover:text-gray-900 cursor-pointer'
        }
        ${className}
      `}
      {...props}
    >
      {children}
      {required && (
        <span className="text-red-500 ml-1" aria-label="required">
          *
        </span>
      )}
    </label>
  );
}

export { Label };
export default Label;

// Compact Label variant for inline use
export function LabelCompact({
  children,
  htmlFor,
  required = false,
  className = '',
  disabled = false,
  ...props
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`
        inline-flex items-center text-sm font-medium mr-3 transition-colors duration-200
        ${disabled
          ? 'text-gray-400 cursor-not-allowed'
          : 'text-gray-700 hover:text-gray-900 cursor-pointer'
        }
        ${className}
      `}
      {...props}
    >
      {children}
      {required && (
        <span className="text-red-500 ml-1" aria-label="required">
          *
        </span>
      )}
    </label>
  );
}

// Label with description/help text
export function LabelWithDescription({
  children,
  description,
  htmlFor,
  required = false,
  className = '',
  disabled = false,
  ...props
}) {
  return (
    <div className="mb-2">
      <Label htmlFor={htmlFor} required={required} disabled={disabled} className={className} {...props}>
        {children}
      </Label>
      {description && (
        <p className={`text-xs mt-1 ${disabled ? 'text-gray-300' : 'text-gray-500'}`}>
          {description}
        </p>
      )}
    </div>
  );
}
