// src/components/ui/select.jsx
import React, { createContext, useContext, useState } from "react";

const SelectContext = createContext();

export function Select({ children, value, onValueChange, ...props }) {
  const [open, setOpen] = useState(false);

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative" {...props}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ children, className = "", ...props }) {
  const { open, setOpen } = useContext(SelectContext);

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
      <svg
        className={`h-4 w-4 opacity-50 transition-transform ${open ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </button>
  );
}

export function SelectValue({ placeholder, ...props }) {
  const { value } = useContext(SelectContext);

  return (
    <span {...props}>
      {value || placeholder}
    </span>
  );
}

export function SelectContent({ children, className = "", ...props }) {
  const { open } = useContext(SelectContext);

  if (!open) return null;

  return (
    <div
      className={`absolute top-full z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function SelectItem({ children, value, className = "", ...props }) {
  const { onValueChange, setOpen } = useContext(SelectContext);

  const handleClick = () => {
    onValueChange(value);
    setOpen(false);
  };

  return (
    <div
      onClick={handleClick}
      className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
// Legacy default export for backward compatibility
export default function LegacySelect({
  label,
  id,
  value,
  onChange,
  children,
  className = "",
  required = false,
  disabled = false,
  ...props
}) {
  const [open, setOpen] = useState(false);
  const hasValue = value && value.toString().length > 0;

  return (
    <SelectContext.Provider value={{ value, onValueChange: onChange, open, setOpen }}>
      <div className="relative" {...props}>
        {children}
        {label && (
          <label
            htmlFor={id}
            className={`absolute text-base text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-7 scale-75 top-3 -z-10 origin-[0] left-4 peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 ${hasValue ? "scale-75 -translate-y-7" : "peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-7"}`}>
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </div>
    </SelectContext.Provider>
  );
}
