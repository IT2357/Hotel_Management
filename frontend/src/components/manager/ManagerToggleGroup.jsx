import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";

import { cn } from "@/lib/utils";
import { managerToggleVariants } from "./ManagerToggle";

const ManagerToggleGroupContext = React.createContext({
  size: "default",
  variant: "default",
});

const ManagerToggleGroup = React.forwardRef(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn("flex items-center justify-center gap-1", className)}
    {...props}
  >
    <ManagerToggleGroupContext.Provider value={{ variant, size }}>
      {children}
    </ManagerToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
));
ManagerToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

const ManagerToggleGroupItem = React.forwardRef(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ManagerToggleGroupContext);

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        managerToggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
});
ManagerToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

export { ManagerToggleGroup, ManagerToggleGroupItem };
