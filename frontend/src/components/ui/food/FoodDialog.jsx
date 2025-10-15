// src/components/ui/food/FoodDialog.jsx - Food-specific dialog component
import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const FoodDialog = ({ children, open, onOpenChange }) => {
  const [isOpen, setIsOpen] = useState(open || false);
  const dialogRef = useRef(null);

  useEffect(() => {
    setIsOpen(open || false);
  }, [open]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        onOpenChange?.(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onOpenChange]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => {
          setIsOpen(false);
          onOpenChange?.(false);
        }}
      />
      <div 
        ref={dialogRef}
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800"
      >
        {children}
      </div>
    </div>
  );
};

const FoodDialogTrigger = ({ children, onClick }) => {
  return React.cloneElement(children, {
    onClick: (e) => {
      onClick?.(e);
      children.props.onClick?.(e);
    }
  });
};

const FoodDialogContent = ({ children, className = '' }) => {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
};

const FoodDialogHeader = ({ children, className = '' }) => {
  return (
    <div className={`flex flex-col space-y-2 text-center sm:text-left border-b border-gray-200 dark:border-gray-700 pb-4 mb-4 ${className}`}>
      {children}
    </div>
  );
};

const FoodDialogTitle = ({ children, className = '' }) => {
  return (
    <h2 className={`text-2xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent ${className}`}>
      {children}
    </h2>
  );
};

const FoodDialogDescription = ({ children, className = '' }) => {
  return (
    <p className={`text-gray-600 dark:text-gray-400 ${className}`}>
      {children}
    </p>
  );
};

const FoodDialogFooter = ({ children, className = '' }) => {
  return (
    <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 ${className}`}>
      {children}
    </div>
  );
};

const FoodDialogClose = ({ children, className = '', onClick }) => {
  return (
    <button
      className={`absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${className}`}
      onClick={onClick}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </button>
  );
};

export {
  FoodDialog as Dialog,
  FoodDialogTrigger as DialogTrigger,
  FoodDialogContent as DialogContent,
  FoodDialogHeader as DialogHeader,
  FoodDialogFooter as DialogFooter,
  FoodDialogTitle as DialogTitle,
  FoodDialogDescription as DialogDescription,
  FoodDialogClose as DialogClose,
};

export default FoodDialog;