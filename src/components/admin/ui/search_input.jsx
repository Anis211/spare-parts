import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-[hsl(220_35%_15%)] bg-[hsl(220_40%_6%)] px-3 py-2 text-base ring-offset-[hsl(220_40%_6%)] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[hsl(210_40%_98%)] placeholder:text-[hsl(215_20.2%_65.1%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(45_100%_55%)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
