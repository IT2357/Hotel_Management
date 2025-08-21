import React, { useState, useEffect } from 'react';
import { CSSTransition } from 'react-transition-group';

const icons = {
  success: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
  ),
  error: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
  ),
  warning: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
    </svg>
  ),
  info: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
  ),
};

const alertStyles = {
  success: 'bg-green-100 border-green-400 text-green-700',
  error: 'bg-red-100 border-red-400 text-red-700',
  warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
  info: 'bg-blue-100 border-blue-400 text-blue-700',
};

const Alert = ({ type = 'info', message, onClose, autoDismiss = true }) => {
  const [show, setShow] = useState(true);
  

  useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(() => {
        setShow(false);
        if (onClose) {
          onClose();
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, onClose]);

  const handleClose = () => {
    setShow(false);
    if (onClose) {
      onClose();
    }
  };

  return (
    <CSSTransition
      in={show}
      timeout={300}
      classNames="alert"
      unmountOnExit
    >
      <div
        className={`fixed top-5 right-5 w-full max-w-sm p-4 border rounded-lg shadow-lg flex items-center space-x-4 z-50 ${alertStyles[type]}`}
        role="alert"
      >
        <div className="flex-shrink-0">{icons[type]}</div>
        <div className="flex-grow">
          <p className="font-bold capitalize">{type}</p>
          <p className="text-sm">{message}</p>
        </div>
        <button onClick={handleClose} className="text-xl font-semibold">&times;</button>
      </div>
    </CSSTransition>
  );
};

export default Alert;