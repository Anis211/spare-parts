import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(45_100%_50%)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[hsl(45_100%_50%)] text-[hsl(220_20%_10%)] hover:bg-[hsl(45_100%_50%)]/80",
        secondary:
          "border-transparent bg-[hsl(220_15%_18%)] text-[hsl(45_10%_90%)] hover:bg-[hsl(220_15%_18%)]/80",
        destructive:
          "border-transparent bg-[hsl(0_70%_50%)] text-[hsl(0_0%_100%)] hover:bg-[hsl(0_70%_50%)]/80",
        outline: "text-[hsl(45_10%_95%)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant, className }))} {...props} />
  );
}

export { Badge, badgeVariants };
