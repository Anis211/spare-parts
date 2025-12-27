import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[hsl(38_92%_55%)] text-[hsl(213_50%_10%)] hover:bg-[hsl(38_92%_55%_/_.9)] " +
          "focus-visible:ring-[hsl(38_92%_55%)] focus-visible:ring-offset-[hsl(213_50%_10%)]",
        destructive:
          "bg-[hsl(0_62%_30%)] text-[hsl(210_40%_98%)] hover:bg-[hsl(0_62%_30%_/_.9)] " +
          "focus-visible:ring-[hsl(0_62%_30%)] focus-visible:ring-offset-[hsl(213_50%_10%)]",
        outline:
          "border border-[hsl(213_30%_22%)] bg-[hsl(213_50%_10%)] text-[hsl(215_20%_65%)] " +
          "hover:bg-[hsl(213_40%_15%)] hover:text-[hsl(210_40%_98%)] " +
          "focus-visible:ring-[hsl(38_92%_55%)] focus-visible:ring-offset-[hsl(213_50%_10%)]",
        secondary:
          "bg-[hsl(213_40%_20%)] text-[hsl(210_40%_98%)] hover:bg-[hsl(213_40%_20%_/_.8)] " +
          "focus-visible:ring-[hsl(38_92%_55%)] focus-visible:ring-offset-[hsl(213_50%_10%)]",
        ghost:
          "text-[hsl(215_20%_65%)] hover:bg-[hsl(213_40%_15%)] hover:text-[hsl(210_40%_98%)] " +
          "focus-visible:ring-[hsl(38_92%_55%)] focus-visible:ring-offset-[hsl(213_50%_10%)]",
        link:
          "text-[hsl(38_92%_55%)] underline-offset-4 hover:underline " +
          "focus-visible:ring-[hsl(38_92%_55%)] focus-visible:ring-offset-[hsl(213_50%_10%)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
        style={{
          "--ring-offset-background": "hsl(213 50% 10%)",
          "--ring-color":
            variant === "destructive" ? "hsl(0 62% 30%)" : "hsl(38 92% 55%)",
        }}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
