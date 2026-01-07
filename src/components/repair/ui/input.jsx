import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md " +
          "border border-[hsl(220_15%_20%)] " +
          "bg-[hsl(220_20%_8%)] " +
          "px-3 py-2 text-base " +
          "ring-offset-[hsl(220_20%_8%)] " +
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[hsl(45_10%_95%)] " +
          "placeholder:text-[hsl(220_10%_55%)] " +
          "focus-visible:outline-none " +
          "focus-visible:ring-2 focus-visible:ring-[hsl(43_96%_56%)] " +
          "disabled:cursor-not-allowed disabled:opacity-50 " +
          "md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
