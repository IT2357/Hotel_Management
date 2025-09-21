import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import classNames from "classnames";

const SelectContext = React.createContext();

const Select = ({ value, onValueChange, children, ...props }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen }}>
      <div className="relative" {...props}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  const { isOpen, setIsOpen } = React.useContext(SelectContext);

  return (
    <button
      type="button"
      ref={ref}
      className={classNames(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={() => setIsOpen(!isOpen)}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = ({ placeholder }) => {
  const { value } = React.useContext(SelectContext);

  return <span className="text-sm">{value || placeholder}</span>;
};

const SelectContent = React.forwardRef(({ className, children, ...props }, ref) => {
  const { isOpen } = React.useContext(SelectContext);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className={classNames(
        "absolute top-full z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
SelectContent.displayName = "SelectContent";

const SelectItem = React.forwardRef(({ className, children, value, ...props }, ref) => {
  const { onValueChange, setIsOpen } = React.useContext(SelectContext);

  return (
    <div
      ref={ref}
      className={classNames(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground",
        className
      )}
      onClick={() => {
        onValueChange(value);
        setIsOpen(false);
      }}
      {...props}
    >
      {children}
    </div>
  );
});
SelectItem.displayName = "SelectItem";

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };