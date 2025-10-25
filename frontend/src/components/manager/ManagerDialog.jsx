import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const ManagerDialog = DialogPrimitive.Root;
const ManagerDialogTrigger = DialogPrimitive.Trigger;
const ManagerDialogPortal = DialogPrimitive.Portal;
const ManagerDialogClose = DialogPrimitive.Close;

const ManagerDialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
ManagerDialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const ManagerDialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <ManagerDialogPortal>
    <ManagerDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 flex flex-col w-full max-w-lg max-h-[95vh] -translate-x-1/2 -translate-y-1/2 border-2 border-gray-200 bg-white shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-2xl overflow-hidden",
        className,
      )}
      {...props}
    >
      <div className="overflow-y-auto overflow-x-hidden flex-1 p-6">
        {children}
      </div>
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:pointer-events-none z-50 bg-white/80 backdrop-blur-sm">
        <X className="h-5 w-5" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </ManagerDialogPortal>
));
ManagerDialogContent.displayName = DialogPrimitive.Content.displayName;

const ManagerDialogHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
ManagerDialogHeader.displayName = "ManagerDialogHeader";

const ManagerDialogFooter = ({ className, ...props }) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
ManagerDialogFooter.displayName = "ManagerDialogFooter";

const ManagerDialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
));
ManagerDialogTitle.displayName = DialogPrimitive.Title.displayName;

const ManagerDialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-sm text-gray-600", className)} {...props} />
));
ManagerDialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  ManagerDialog,
  ManagerDialogTrigger,
  ManagerDialogPortal,
  ManagerDialogOverlay,
  ManagerDialogClose,
  ManagerDialogContent,
  ManagerDialogHeader,
  ManagerDialogFooter,
  ManagerDialogTitle,
  ManagerDialogDescription,
};
