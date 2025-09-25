import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/rooms/ui/button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
  className={cn("p-3 rounded-2xl bg-white/80 shadow-lg backdrop-blur-xl border border-gray-100", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "h-8 w-8 flex items-center justify-center rounded-full bg-white/60 hover:bg-white/80 border border-gray-200 shadow transition-all duration-150 p-0 opacity-80 hover:opacity-100",
          "focus:ring-2 focus:ring-indigo-300 focus:outline-none"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          "h-9 w-9 p-0 font-normal rounded-full transition-all duration-150",
          "hover:bg-indigo-50/70 hover:text-indigo-700",
          "focus:ring-2 focus:ring-indigo-300 focus:outline-none"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-gradient-to-br from-indigo-400 to-purple-400 text-white font-semibold shadow-md hover:from-indigo-500 hover:to-purple-500 focus:from-indigo-500 focus:to-purple-500",
  day_today: "border-2 border-indigo-300 text-indigo-700 bg-white/80",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-indigo-100/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
