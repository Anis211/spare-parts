import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[hsl(38_92%_50%)] text-[hsl(222_47%_11%)] hover:bg-[hsl(38_92%_50%)]/80",
        secondary:
          "border-transparent bg-[hsl(222_47%_18%)] text-[hsl(210_40%_98%)] hover:bg-[hsl(222_47%_18%)]/80",
        destructive:
          "border-transparent bg-[hsl(0_84%_60%)] text-[hsl(210_40%_98%)] hover:bg-[hsl(0_84%_60%)]/80",
        outline:
          "border-[hsl(222_30%_22%)] text-[hsl(210_40%_98%)] bg-transparent",
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
