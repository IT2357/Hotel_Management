import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "@/lib/utils";

const ManagerDrawer = ({ shouldScaleBackground = true, ...props }) => (
  <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} />
);
ManagerDrawer.displayName = "ManagerDrawer";

const ManagerDrawerTrigger = DrawerPrimitive.Trigger;
const ManagerDrawerPortal = DrawerPrimitive.Portal;
const ManagerDrawerClose = DrawerPrimitive.Close;

const ManagerDrawerOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay ref={ref} className={cn("fixed inset-0 z-50 bg-black/80", className)} {...props} />
));
ManagerDrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

const ManagerDrawerContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <ManagerDrawerPortal>
    <ManagerDrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
        className,
      )}
      {...props}
    >
      <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
      {children}
    </DrawerPrimitive.Content>
  </ManagerDrawerPortal>
));
ManagerDrawerContent.displayName = "ManagerDrawerContent";

const ManagerDrawerHeader = ({ className, ...props }) => (
  <div className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)} {...props} />
);
ManagerDrawerHeader.displayName = "ManagerDrawerHeader";

const ManagerDrawerFooter = ({ className, ...props }) => (
  <div className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />
);
ManagerDrawerFooter.displayName = "ManagerDrawerFooter";

const ManagerDrawerTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
));
ManagerDrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const ManagerDrawerDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
ManagerDrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
  ManagerDrawer,
  ManagerDrawerPortal,
  ManagerDrawerOverlay,
  ManagerDrawerTrigger,
  ManagerDrawerClose,
  ManagerDrawerContent,
  ManagerDrawerHeader,
  ManagerDrawerFooter,
  ManagerDrawerTitle,
  ManagerDrawerDescription,
};
