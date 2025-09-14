import React, { useEffect, useRef } from "react";
import { CSSTransition } from 'react-transition-group';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  className = "",
}) {
  const modalRef = useRef(null);
  const nodeRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-full",
  };

  return (
    <CSSTransition
      nodeRef={nodeRef}
      in={isOpen}
      timeout={300}
      classNames={{
        enter: 'opacity-0 scale-95',
        enterActive: 'opacity-100 scale-100 transition-all duration-300 ease-out',
        exit: 'opacity-100 scale-100',
        exitActive: 'opacity-0 scale-95 transition-all duration-300 ease-in',
      }}
      unmountOnExit
    >
      <div
        ref={nodeRef}
        className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-opacity duration-300"
        onClick={onClose}
      >
        <div
          ref={modalRef}
          className={`bg-white/95 backdrop-blur-md rounded-2xl shadow-xl w-full transform ${sizes[size]} ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">
              {title}
            </h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="px-6 py-4 max-h-[80vh] overflow-y-auto">{children}</div>
        </div>
      </div>
    </CSSTransition>
  );
}