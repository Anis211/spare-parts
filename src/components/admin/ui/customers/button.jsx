"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[hsl(43_96%_56%)] text-[hsl(222_47%_6%)] hover:bg-[hsl(43_96%_56%)/0.90] shadow-md hover:shadow-lg focus-visible:ring-[hsl(43_96%_56%)] focus-visible:ring-offset-[hsl(222_47%_6%)]",
        destructive:
          "bg-[hsl(0_72%_51%)] text-[hsl(40_20%_95%)] hover:bg-[hsl(0_72%_51%)/0.90] focus-visible:ring-[hsl(0_72%_51%)] focus-visible:ring-offset-[hsl(222_47%_6%)]",
        outline:
          "border border-[hsl(222_30%_18%)] bg-transparent text-[hsl(40_20%_95%)] hover:bg-[hsl(222_30%_14%)] hover:text-[hsl(40_20%_90%)] focus-visible:ring-[hsl(43_96%_56%)] focus-visible:ring-offset-[hsl(222_47%_6%)]",
        secondary:
          "bg-[hsl(222_30%_14%)] text-[hsl(40_20%_90%)] hover:bg-[hsl(222_30%_14%)/0.80] focus-visible:ring-[hsl(43_96%_56%)] focus-visible:ring-offset-[hsl(222_47%_6%)]",
        ghost:
          "text-[hsl(40_20%_95%)] hover:bg-[hsl(222_30%_14%)] hover:text-[hsl(40_20%_90%)] focus-visible:ring-[hsl(43_96%_56%)] focus-visible:ring-offset-[hsl(222_47%_6%)]",
        link: "text-[hsl(43_96%_56%)] underline-offset-4 hover:underline focus-visible:ring-[hsl(43_96%_56%)] focus-visible:ring-offset-2",
        gold: "bg-gradient-to-r from-[hsl(43_96%_56%)] to-[hsl(38_92%_50%)] text-[hsl(222_47%_6%)] font-semibold shadow-[0_4px_12px_hsl(43_96%_56%_/0.2)] hover:shadow-[0_6px_16px_hsl(43_96%_56%_/0.3)] hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-[hsl(43_96%_56%)] focus-visible:ring-offset-[hsl(222_47%_6%)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-lg px-8",
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
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
