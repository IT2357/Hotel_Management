import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import classNames from 'classnames';

const DialogContext = React.createContext();

const Dialog = ({ open, onOpenChange, children }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <DialogContext.Provider value={{ onOpenChange }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="fixed inset-0 bg-black/50"
          onClick={() => onOpenChange(false)}
        />
        {children}
      </div>
    </DialogContext.Provider>
  );
};

const DialogTrigger = ({ children, asChild, ...props }) => {
  const child = React.Children.only(children);
  return React.cloneElement(child, props);
};

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={classNames(
      "relative z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
DialogContent.displayName = "DialogContent";

const DialogHeader = ({ className, ...props }) => (
  <div
    className={classNames(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={classNames(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogClose = ({ className, ...props }) => {
  const { onOpenChange } = React.useContext(DialogContext);

  return (
    <button
      className={classNames(
        "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        className
      )}
      onClick={() => onOpenChange(false)}
      {...props}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </button>
  );
};

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
};