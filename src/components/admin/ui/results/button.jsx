import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-[hsl(217_33%_10%)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(38_92%_50%)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[hsl(38_92%_50%)] text-[hsl(217_33%_10%)] hover:bg-[hsl(38_92%_50%)/90]",
        destructive:
          "bg-[hsl(0_84%_60%)] text-[hsl(210_40%_98%)] hover:bg-[hsl(0_84%_60%)/90]",
        outline:
          "border border-[hsl(217_26%_25%)] bg-[hsl(217_33%_10%)] hover:bg-[hsl(38_92%_50%)] hover:text-[hsl(217_33%_10%)]",
        secondary:
          "bg-[hsl(217_26%_22%)] text-[hsl(210_40%_98%)] hover:bg-[hsl(217_26%_22%)/80]",
        ghost: "hover:bg-[hsl(38_92%_50%)] hover:text-[hsl(217_33%_10%)]",
        link: "text-[hsl(38_92%_50%)] underline-offset-4 hover:underline",
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
