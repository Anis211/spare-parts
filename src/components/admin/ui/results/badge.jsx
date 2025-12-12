import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors " +
    "focus:outline-none focus:ring-2 focus:ring-[hsl(38_92%_50%)] focus:ring-offset-2 focus:ring-offset-[hsl(217_33%_10%)]",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[hsl(38_92%_50%)] text-[hsl(217_33%_10%)] hover:bg-[hsl(38_92%_50%)/80]",
        secondary:
          "border-transparent bg-[hsl(217_26%_22%)] text-[hsl(210_40%_98%)] hover:bg-[hsl(217_26%_22%)/80]",
        destructive:
          "border-transparent bg-[hsl(0_84%_60%)] text-[hsl(210_40%_98%)] hover:bg-[hsl(0_84%_60%)/80]",
        outline: "border-[hsl(217_26%_25%)] text-[hsl(210_40%_98%)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
