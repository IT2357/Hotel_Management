import * as React from "react";
import * as CommandPrimitive from "cmdk";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/manager/ManagerButton";
import {
  ManagerDialog,
  ManagerDialogContent,
  ManagerDialogTrigger,
  ManagerDialogClose,
} from "@/components/manager/ManagerDialog";

const ManagerCommand = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <CommandPrimitive.Command
      ref={ref}
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
        className,
      )}
      {...props}
    />
  );
});
ManagerCommand.displayName = CommandPrimitive.Command.displayName;

const ManagerCommandDialog = ({ children, ...props }) => {
  return (
    <ManagerDialog {...props}>
      <ManagerDialogContent className="overflow-hidden p-0 shadow-lg">
        <ManagerCommand className="h-[380px] max-w-full">{children}</ManagerCommand>
      </ManagerDialogContent>
    </ManagerDialog>
  );
};

const ManagerCommandInput = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div className="flex items-center border-b px-3" data-slot="command-input-wrapper">
      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      <CommandPrimitive.CommandInput
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </div>
  );
});
ManagerCommandInput.displayName = CommandPrimitive.CommandInput.displayName;

const ManagerCommandList = React.forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.CommandList
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
));
ManagerCommandList.displayName = CommandPrimitive.CommandList.displayName;

const ManagerCommandEmpty = CommandPrimitive.CommandEmpty;
const ManagerCommandGroup = CommandPrimitive.CommandGroup;
const ManagerCommandItem = CommandPrimitive.CommandItem;
const ManagerCommandShortcut = ({ className, ...props }) => (
  <span
    className={cn(
      "ml-auto text-xs tracking-widest text-muted-foreground",
      className,
    )}
    {...props}
  />
);

const ManagerCommandSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.CommandSeparator ref={ref} className={cn("-mx-1 h-px bg-border", className)} {...props} />
));
ManagerCommandSeparator.displayName = CommandPrimitive.CommandSeparator.displayName;

const ManagerCommandDialogTrigger = React.forwardRef(({ children, ...props }, ref) => (
  <ManagerDialogTrigger asChild {...props}>
    <Button ref={ref} variant="outline" className="relative h-9 justify-start sm:pr-12">
      <Search className="mr-2 h-4 w-4 shrink-0" />
      {children || <span className="hidden lg:inline-flex">Command Menu...</span>}
      <span className="absolute right-3 hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
        <kbd className="rounded border bg-muted px-1.5 py-0.5 font-medium">Ctrl</kbd>
        +
        <kbd className="rounded border bg-muted px-1.5 py-0.5 font-medium">K</kbd>
      </span>
    </Button>
  </ManagerDialogTrigger>
));
ManagerCommandDialogTrigger.displayName = "ManagerCommandDialogTrigger";

const ManagerCommandDialogClose = ManagerDialogClose;

export {
  ManagerCommand,
  ManagerCommandDialog,
  ManagerCommandInput,
  ManagerCommandList,
  ManagerCommandEmpty,
  ManagerCommandGroup,
  ManagerCommandItem,
  ManagerCommandShortcut,
  ManagerCommandSeparator,
  ManagerCommandDialogTrigger,
  ManagerCommandDialogClose,
};
