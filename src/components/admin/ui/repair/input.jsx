import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md px-3 py-2 text-base",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        "md:text-sm",
        className
      )}
      style={{
        borderColor: "hsl(222 30% 22%)",
        backgroundColor: "hsl(222 47% 11%)",
        color: "hsl(210 40% 98%)",
      }}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
