import React from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';

export const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onOpenChange?.(false)}
      />
      <div className="relative z-50 max-h-[90vh] w-full max-w-lg overflow-auto">
        {children}
      </div>
    </div>
  );
};

Dialog.propTypes = {
  open: PropTypes.bool,
  onOpenChange: PropTypes.func,
  children: PropTypes.node
};

export const DialogContent = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-xl p-6 ${className}`}>
      {children}
    </div>
  );
};

DialogContent.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};

export const DialogHeader = ({ children, className = '' }) => {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
};

DialogHeader.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};

export const DialogTitle = ({ children, className = '' }) => {
  return (
    <h2 className={`text-xl font-semibold text-gray-900 ${className}`}>
      {children}
    </h2>
  );
};

DialogTitle.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};

export const DialogDescription = ({ children, className = '' }) => {
  return (
    <p className={`text-sm text-gray-500 mt-2 ${className}`}>
      {children}
    </p>
  );
};

DialogDescription.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};

export const DialogFooter = ({ children, className = '' }) => {
  return (
    <div className={`mt-6 flex justify-end gap-3 ${className}`}>
      {children}
    </div>
  );
};

DialogFooter.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};

export const DialogClose = ({ children, onClick, className = '' }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute top-4 right-4 text-gray-400 hover:text-gray-600 ${className}`}
    >
      {children || <X className="h-4 w-4" />}
    </button>
  );
};

DialogClose.propTypes = {
  children: PropTypes.node,
  onClick: PropTypes.func,
  className: PropTypes.string
};

export default Dialog;
