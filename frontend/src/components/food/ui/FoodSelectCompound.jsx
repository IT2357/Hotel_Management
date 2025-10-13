// src/components/ui/SelectCompound.jsx - Enhanced Select component with modern animations
import React, { createContext, useContext, useState, useRef, useEffect } from "react";

const SelectContext = createContext();

export function Select({ children, value, onValueChange, className = "", ...props }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen, mounted }}>
      <div className={`relative ${className}`} {...props}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ children, className = "", disabled = false, ...props }) {
  const { open, setOpen, value } = useContext(SelectContext);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && setOpen(!open)}
      className={`
        relative flex h-12 w-full items-center justify-between rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all duration-200 hover:border-orange-300 hover:shadow-md focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:shadow-sm
        ${open ? 'border-orange-500 bg-orange-50 shadow-md' : ''}
        ${className}
      `}
      {...props}
    >
      <span className={`${!value ? 'text-gray-500' : 'text-gray-900'}`}>
        {children}
      </span>
      <svg
        className={`h-5 w-5 text-gray-400 transition-all duration-200 ${open ? 'rotate-180 text-orange-500' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

export function SelectContent({ children, className = "", ...props }) {
  const { open, mounted } = useContext(SelectContext);

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 animate-in fade-in-0 duration-200"
          onClick={() => {
            const { setOpen } = useContext(SelectContext);
            setOpen(false);
          }}
        />
      )}

      {/* Dropdown */}
      <div
        className={`
          absolute top-full z-50 mt-2 min-w-[200px] overflow-hidden rounded-xl border border-gray-200 bg-white p-2 text-sm shadow-xl animate-in fade-in-0 zoom-in-95 duration-200
          ${open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    </>
  );
}

export function SelectItem({ children, value, className = "", disabled = false, ...props }) {
  const { onValueChange, setOpen, value: selectedValue } = useContext(SelectContext);
  const isSelected = selectedValue === value;

  return (
    <div
      className={`
        relative flex w-full cursor-pointer select-none items-center rounded-lg px-3 py-3 text-sm outline-none transition-all duration-150 hover:bg-orange-50 focus:bg-orange-50
        ${isSelected ? 'bg-orange-100 text-orange-900 font-medium' : 'text-gray-700'}
        ${disabled ? 'cursor-not-allowed opacity-50 hover:bg-transparent' : ''}
        ${className}
      `}
      onClick={() => {
        if (!disabled) {
          onValueChange?.(value);
          setOpen(false);
        }
      }}
      {...props}
    >
      {isSelected && (
        <svg
          className="absolute left-2 h-4 w-4 text-orange-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
      <span className="ml-6">{children}</span>
    </div>
  );
}

export function SelectValue({ placeholder, className = "", ...props }) {
  const { value } = useContext(SelectContext);

  return (
    <span className={`truncate ${!value ? 'text-gray-500' : 'text-gray-900'} ${className}`} {...props}>
      {value || placeholder}
    </span>
  );
}
