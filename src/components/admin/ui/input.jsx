import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md " +
          "border-[hsl(220_50%_25%)] " +
          "bg-[hsl(220_70%_15%)] " +
          "px-3 py-2 text-base " +
          "text-[hsl(45_100%_95%)] " +
          "ring-offset-[hsl(220_70%_15%)] " +
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[hsl(45_100%_95%)] " +
          "placeholder:text-[hsl(220_20%_70%)] " +
          "focus-visible:outline-none " +
          "focus-visible:ring-2 focus-visible:ring-[hsl(45_100%_51%)] focus-visible:ring-offset-2 " +
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
