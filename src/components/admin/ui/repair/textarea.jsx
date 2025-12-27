import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md",
        "border border-[hsl(222_30%_22%)]", // --input
        "bg-[hsl(222_47%_11%)]", // --background
        "px-3 py-2 text-sm text-[hsl(210_40%_98%)]", // --foreground
        "placeholder:text-[hsl(215_20%_65%)]", // --muted-foreground
        "focus-visible:outline-none",
        "focus-visible:ring-2 focus-visible:ring-[hsl(38_92%_50%)]", // --ring
        "focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(222_47%_11%)]", // --ring-offset-background
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
