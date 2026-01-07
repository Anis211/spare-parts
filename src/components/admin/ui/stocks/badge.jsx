import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(174_72%_46%)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent " +
          "bg-[hsl(174_72%_46%)] text-[hsl(230_25%_10%)] " +
          "hover:bg-[hsl(174_72%_46%)]/80",
        secondary:
          "border-transparent " +
          "bg-[hsl(230_20%_18%)] text-[hsl(210_40%_98%)] " +
          "hover:bg-[hsl(230_20%_18%)]/80",
        destructive:
          "border-transparent " +
          "bg-[hsl(0_72%_51%)]/20 text-[hsl(0_72%_51%)] " +
          "hover:bg-[hsl(0_72%_51%)]/30",
        outline:
          "text-[hsl(210_40%_98%)] border-[hsl(230_20%_22%)] " +
          "bg-transparent",
        success:
          "border-transparent " +
          "bg-[hsl(142_76%_36%)]/20 text-[hsl(142_76%_36%)] " +
          "hover:bg-[hsl(142_76%_36%)]/30",
        warning:
          "border-transparent " +
          "bg-[hsl(38_92%_50%)]/20 text-[hsl(38_92%_50%)] " +
          "hover:bg-[hsl(38_92%_50%)]/30",
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
