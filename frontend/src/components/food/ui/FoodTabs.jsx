import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

const FoodTabs = TabsPrimitive.Root;

const FoodTabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
      className
    )}
    {...props}
  />
));
FoodTabsList.displayName = 'FoodTabsList';

const FoodTabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm dark:ring-offset-gray-950 dark:focus-visible:ring-gray-800 dark:data-[state=active]:bg-gray-950 dark:data-[state=active]:text-orange-400',
      className
    )}
    {...props}
  />
));
FoodTabsTrigger.displayName = 'FoodTabsTrigger';

const FoodTabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 dark:ring-offset-gray-950 dark:focus-visible:ring-gray-800',
      className
    )}
    {...props}
  />
));
FoodTabsContent.displayName = 'FoodTabsContent';

export {
  FoodTabs as Tabs,
  FoodTabsList as TabsList,
  FoodTabsTrigger as TabsTrigger,
  FoodTabsContent as TabsContent,
};

export default FoodTabs;
