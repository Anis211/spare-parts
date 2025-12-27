"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold " +
    "transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(40_95%_55%)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[hsl(40_95%_55%)] text-[hsl(222_47%_6%)] hover:bg-[hsl(40_95%_55%)]/80",
        secondary:
          "border-transparent bg-[hsl(222_30%_15%)] text-[hsl(40_15%_95%)] hover:bg-[hsl(222_30%_15%)]/80",
        destructive:
          "border-transparent bg-[hsl(0_72%_51%)] text-[hsl(40_15%_95%)] hover:bg-[hsl(0_72%_51%)]/80",
        outline:
          "border-[hsl(222_30%_18%)] text-[hsl(40_15%_95%)] bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Badge = React.forwardRef(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };
