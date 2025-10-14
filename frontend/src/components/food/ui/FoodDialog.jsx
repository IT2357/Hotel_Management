import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const FoodDialog = DialogPrimitive.Root;

const FoodDialogTrigger = DialogPrimitive.Trigger;

const FoodDialogPortal = DialogPrimitive.Portal;

const FoodDialogClose = DialogPrimitive.Close;

const FoodDialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
FoodDialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const FoodDialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <FoodDialogPortal>
    <FoodDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[50%] sm:rounded-lg dark:border-gray-800 dark:bg-gray-900',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 data-[state=open]:text-gray-500 dark:focus:ring-gray-700 dark:focus:ring-offset-gray-900 dark:data-[state=open]:bg-gray-800 dark:data-[state=open]:text-gray-400">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </FoodDialogPortal>
));
FoodDialogContent.displayName = DialogPrimitive.Content.displayName;

const FoodDialogHeader = ({ className, ...props }) => (
  <div
    className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
    {...props}
  />
);
FoodDialogHeader.displayName = 'FoodDialogHeader';

const FoodDialogFooter = ({ className, ...props }) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
);
FoodDialogFooter.displayName = 'FoodDialogFooter';

const FoodDialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
FoodDialogTitle.displayName = DialogPrimitive.Title.displayName;

const FoodDialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-gray-500 dark:text-gray-400', className)}
    {...props}
  />
));
FoodDialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  FoodDialog as Dialog,
  FoodDialogTrigger as DialogTrigger,
  FoodDialogContent as DialogContent,
  FoodDialogHeader as DialogHeader,
  FoodDialogFooter as DialogFooter,
  FoodDialogTitle as DialogTitle,
  FoodDialogDescription as DialogDescription,
  FoodDialogClose as DialogClose,
};

export default FoodDialog;
