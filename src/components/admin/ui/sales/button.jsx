"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium " +
    "ring-offset-[hsl(222_47%_6%)] transition-colors focus-visible:outline-none " +
    "focus-visible:ring-2 focus-visible:ring-[hsl(40_95%_55%)] focus-visible:ring-offset-2 " +
    "disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[hsl(40_95%_55%)] text-[hsl(222_47%_6%)] hover:bg-[hsl(40_95%_55%)]/90",
        destructive:
          "bg-[hsl(0_72%_51%)] text-[hsl(40_15%_95%)] hover:bg-[hsl(0_72%_51%)]/90",
        outline:
          "border-[hsl(222_30%_18%)] bg-[hsl(222_47%_6%)] " +
          "hover:bg-[hsl(222_30%_12%)] hover:text-[hsl(40_15%_95%)]",
        secondary:
          "bg-[hsl(222_30%_15%)] text-[hsl(40_15%_95%)] hover:bg-[hsl(222_30%_15%)]/80",
        ghost: "hover:bg-[hsl(222_30%_12%)] hover:text-[hsl(40_15%_95%)]",
        link: "text-[hsl(40_95%_55%)] underline-offset-4 hover:underline",
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
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
