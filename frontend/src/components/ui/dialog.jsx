import React, { useState, createContext, useContext } from 'react';
import { X } from 'lucide-react';

const DialogContext = createContext();

const Dialog = ({ children, open, onOpenChange }) => {
  const [isOpen, setIsOpen] = useState(open || false);

  const handleOpenChange = (newOpen) => {
    setIsOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };

  return (
    <DialogContext.Provider value={{ isOpen, setIsOpen: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
};

const DialogTrigger = ({ children, asChild = false, ...props }) => {
  const { setIsOpen } = useContext(DialogContext);

  if (asChild) {
    return React.cloneElement(children, {
      onClick: () => setIsOpen(true),
      ...props
    });
  }

  return (
    <button onClick={() => setIsOpen(true)} {...props}>
      {children}
    </button>
  );
};

const DialogContent = ({ children, className = "", ...props }) => {
  const { isOpen, setIsOpen } = useContext(DialogContext);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Dialog */}
      <div 
        className={`
          relative z-50 w-full max-w-lg mx-4 bg-white dark:bg-gray-800 
          rounded-lg shadow-lg border border-gray-200 dark:border-gray-700
          max-h-[90vh] overflow-y-auto
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    </div>
  );
};

const DialogHeader = ({ children, className = "", ...props }) => {
  return (
    <div 
      className={`
        flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

const DialogTitle = ({ children, className = "", ...props }) => {
  return (
    <h2 
      className={`
        text-lg font-semibold text-gray-900 dark:text-white
        ${className}
      `}
      {...props}
    >
      {children}
    </h2>
  );
};

const DialogClose = ({ children, className = "", ...props }) => {
  const { setIsOpen } = useContext(DialogContext);

  return (
    <button
      onClick={() => setIsOpen(false)}
      className={`
        p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
        hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
        ${className}
      `}
      {...props}
    >
      {children || <X className="h-4 w-4" />}
    </button>
  );
};

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
};