import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium " +
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
          "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
      style={{
        // Colors (from your .dark theme)
        backgroundColor: "hsl(213 50% 10%)", // --background
        borderColor: "hsl(213 30% 22%)", // --input / --border
        color: "hsl(210 40% 98%)", // --foreground
        fontSize: "1rem", // text-base (fallback; md:text-sm handled by class)

        // Focus ring — use CSS variables so `focus-visible:ring-*` works
        "--ring-color": "hsl(38 92% 55%)", // --ring (primary)
        "--ring-offset-background": "hsl(213 50% 10%)", // --background

        // Placeholder cannot be styled inline → rely on global CSS (see below)
      }}
    />
  );
});

Input.displayName = "Input";

export { Input };
