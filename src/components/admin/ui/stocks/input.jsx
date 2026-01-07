import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md " +
          "border border-[hsl(230_20%_22%)] " +
          "bg-[hsl(222_40%_9%)]/80 text-white " +
          "px-3 py-2 text-base " +
          "ring-offset-[hsl(230_25%_10%)] " +
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[hsl(210_40%_98%)] " +
          "placeholder:text-[hsl(215_20%_55%)] " +
          "focus-visible:outline-none " +
          "focus-visible:ring-2 focus-visible:ring-[hsl(174_72%_46%)] " +
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
