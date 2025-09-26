// src/components/ui/separator.jsx
import React from "react";
import classNames from "classnames";

const Separator = React.forwardRef(({
  className = "",
  orientation = "horizontal",
  decorative = true,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      role={decorative ? "none" : "separator"}
      aria-orientation={orientation}
      className={classNames(
        "shrink-0 bg-gray-200 dark:bg-gray-700",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  );
});

Separator.displayName = "Separator";

export { Separator };