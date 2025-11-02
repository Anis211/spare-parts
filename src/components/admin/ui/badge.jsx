"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(45_100%_51%)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[hsl(45_100%_51%)] text-[hsl(220_70%_15%)] hover:bg-[hsl(45_100%_51%)]/80",
        secondary:
          "border-transparent bg-[hsl(220_50%_30%)] text-[hsl(45_100%_95%)] hover:bg-[hsl(220_50%_30%)]/80",
        destructive:
          "border-transparent bg-[hsl(0_84.2%_60.2%)] text-[hsl(0_0%_98%)] hover:bg-[hsl(0_84.2%_60.2%)]/80",
        outline: "text-[hsl(45_100%_95%)] border-[hsl(220_50%_25%)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Badge = React.forwardRef(({ className, variant, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
});

Badge.displayName = "Badge";

export { Badge, badgeVariants };
