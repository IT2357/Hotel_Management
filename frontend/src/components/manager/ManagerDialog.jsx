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
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
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
        "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
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
  <DialogPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
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
