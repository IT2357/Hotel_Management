// src/components/ui/Select.jsx
import React, { createContext, useContext, useState } from "react";

const SelectContext = createContext();

function Select({ children, value, onValueChange, ...props }) {
  const [open, setOpen] = useState(false);

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative" {...props}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

function SelectTrigger({ children, className = "", ...props }) {
  const { open, setOpen } = useContext(SelectContext);

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
      <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

function SelectValue({ placeholder, ...props }) {
  const { value } = useContext(SelectContext);

  return (
    <span {...props}>
      {value || placeholder}
    </span>
  );
}

function SelectContent({ children, className = "", ...props }) {
  const { open } = useContext(SelectContext);

  if (!open) return null;

  return (
    <div
      className={`absolute top-full z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

function SelectItem({ children, value, className = "", ...props }) {
  const { onValueChange, setOpen } = useContext(SelectContext);

  const handleClick = () => {
    onValueChange?.(value);
    setOpen(false);
  };

  return (
    <div
      onClick={handleClick}
      className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
export default Select;