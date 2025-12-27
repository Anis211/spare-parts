"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md",
        "border-[hsl(222_30%_18%)]", // border-input → using --border (222 30% 18%)
        "bg-[hsl(222_47%_6%)]", // bg-background
        "px-3 py-2 text-sm",
        "ring-offset-[hsl(222_47%_6%)]", // ring-offset-background
        "placeholder:text-[hsl(220_15%_55%)]", // placeholder:text-muted-foreground
        "focus-visible:outline-none",
        "focus-visible:ring-2 focus-visible:ring-[hsl(40_95%_55%)]", // focus-visible:ring-ring
        "focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export { Textarea };
