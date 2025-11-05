import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/manager/ManagerButton";

const ManagerAlertDialog = AlertDialogPrimitive.Root;

const ManagerAlertDialogTrigger = AlertDialogPrimitive.Trigger;

const ManagerAlertDialogPortal = AlertDialogPrimitive.Portal;

const ManagerAlertDialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
ManagerAlertDialogOverlay.displayName = "ManagerAlertDialogOverlay";

const ManagerAlertDialogContent = React.forwardRef(({ className, ...props }, ref) => (
  <ManagerAlertDialogPortal>
    <ManagerAlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className,
      )}
      {...props}
    />
  </ManagerAlertDialogPortal>
));
ManagerAlertDialogContent.displayName = "ManagerAlertDialogContent";

const ManagerAlertDialogHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
);
ManagerAlertDialogHeader.displayName = "ManagerAlertDialogHeader";

const ManagerAlertDialogFooter = ({ className, ...props }) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
ManagerAlertDialogFooter.displayName = "ManagerAlertDialogFooter";

const ManagerAlertDialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title ref={ref} className={cn("text-lg font-semibold", className)} {...props} />
));
ManagerAlertDialogTitle.displayName = "ManagerAlertDialogTitle";

const ManagerAlertDialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
ManagerAlertDialogDescription.displayName = "ManagerAlertDialogDescription";

const ManagerAlertDialogAction = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action ref={ref} className={cn(buttonVariants(), className)} {...props} />
));
ManagerAlertDialogAction.displayName = "ManagerAlertDialogAction";

const ManagerAlertDialogCancel = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0", className)}
    {...props}
  />
));
ManagerAlertDialogCancel.displayName = "ManagerAlertDialogCancel";

export {
  ManagerAlertDialog,
  ManagerAlertDialogPortal,
  ManagerAlertDialogOverlay,
  ManagerAlertDialogTrigger,
  ManagerAlertDialogContent,
  ManagerAlertDialogHeader,
  ManagerAlertDialogFooter,
  ManagerAlertDialogTitle,
  ManagerAlertDialogDescription,
  ManagerAlertDialogAction,
  ManagerAlertDialogCancel,
};
