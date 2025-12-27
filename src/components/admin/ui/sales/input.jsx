"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md",
          "border-[hsl(222_30%_18%)]", // border-input → border-border (same as input in your theme)
          "bg-[hsl(222_47%_6%)]", // bg-background
          "px-3 py-2 text-base",
          "ring-offset-[hsl(222_47%_6%)]", // ring-offset-background
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[hsl(40_15%_95%)]", // file:text-foreground
          "placeholder:text-[hsl(220_15%_55%)]", // placeholder:text-muted-foreground
          "focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-[hsl(40_95%_55%)]", // focus-visible:ring-ring
          "focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
