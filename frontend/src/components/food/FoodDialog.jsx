import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';

// Main Dialog component
export const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={() => onOpenChange && onOpenChange(false)}
      />
      {children}
    </div>
  );
};

Dialog.propTypes = {
  open: PropTypes.bool,
  onOpenChange: PropTypes.func,
  children: PropTypes.node
};

// DialogContent component
export const DialogContent = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`relative z-50 bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6 ${className}`}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  );
};

DialogContent.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};

// DialogHeader component
export const DialogHeader = ({ children, className = '', ...props }) => {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

DialogHeader.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};

// DialogTitle component
export const DialogTitle = ({ children, className = '', ...props }) => {
  return (
    <h2 className={`text-lg font-semibold text-gray-900 ${className}`} {...props}>
      {children}
    </h2>
  );
};

DialogTitle.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};

// DialogDescription component
export const DialogDescription = ({ children, className = '', ...props }) => {
  return (
    <p className={`text-sm text-gray-500 mt-2 ${className}`} {...props}>
      {children}
    </p>
  );
};

DialogDescription.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};

// DialogFooter component
export const DialogFooter = ({ children, className = '', ...props }) => {
  return (
    <div className={`mt-6 flex justify-end gap-3 ${className}`} {...props}>
      {children}
    </div>
  );
};

DialogFooter.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};

// DialogClose component
export const DialogClose = ({ onClose, className = '', ...props }) => {
  return (
    <button
      type="button"
      onClick={onClose}
      className={`absolute top-4 right-4 text-gray-400 hover:text-gray-600 ${className}`}
      {...props}
    >
      <X className="h-5 w-5" />
    </button>
  );
};

DialogClose.propTypes = {
  onClose: PropTypes.func,
  className: PropTypes.string
};

// DialogTrigger component
export const DialogTrigger = ({ children, asChild, className = '', ...props }) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, props);
  }
  
  return (
    <button
      type="button"
      className={className}
      {...props}
    >
      {children}
    </button>
  );
};

DialogTrigger.propTypes = {
  children: PropTypes.node,
  asChild: PropTypes.bool,
  className: PropTypes.string
};

// Simple FoodDialog (original component for backward compatibility)
const FoodDialog = ({ trigger, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 relative min-w-[300px]">
            <button className="absolute top-2 right-2 text-gray-500" onClick={() => setOpen(false)}>&times;</button>
            {children}
          </div>
        </div>
      )}
    </>
  );
};

FoodDialog.propTypes = {
  trigger: PropTypes.node,
  children: PropTypes.node
};

export default FoodDialog;