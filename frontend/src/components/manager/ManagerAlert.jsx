import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const managerAlertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const ManagerAlert = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(managerAlertVariants({ variant }), className)} {...props} />
));
ManagerAlert.displayName = "ManagerAlert";

const ManagerAlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5 ref={ref} className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} />
));
ManagerAlertTitle.displayName = "ManagerAlertTitle";

const ManagerAlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
));
ManagerAlertDescription.displayName = "ManagerAlertDescription";

export { ManagerAlert, ManagerAlertTitle, ManagerAlertDescription };
