import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-[hsl(220_20%_8%)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(43_96%_56%)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[hsl(43_96%_56%)] text-[hsl(220_20%_8%)] hover:bg-[hsl(43_96%_56%)/0.9] shadow-md hover:shadow-lg",
        destructive:
          "bg-[hsl(0_72%_51%)] text-[hsl(0_0%_100%)] hover:bg-[hsl(0_72%_51%)/0.9]",
        outline:
          "border border-[hsl(220_15%_20%)] bg-transparent hover:bg-[hsl(220_15%_18%)] hover:text-[hsl(45_10%_85%)]",
        secondary:
          "bg-[hsl(220_15%_18%)] text-[hsl(45_10%_85%)] hover:bg-[hsl(220_15%_18%)/0.8]",
        ghost: "hover:bg-[hsl(220_15%_18%)] hover:text-[hsl(45_10%_85%)]",
        link: "text-[hsl(43_96%_56%)] underline-offset-4 hover:underline",
        glow: "bg-[hsl(43_96%_56%)] text-[hsl(220_20%_8%)] shadow-[0_0_20px_hsl(43_96%_56%/0.3)] hover:shadow-[0_0_30px_hsl(43_96%_56%/0.5)] hover:scale-101 active:scale-95",
        voice:
          "bg-[hsl(43_96%_56%)] text-[hsl(220_20%_8%)] rounded-full animate-pulse shadow-[0_0_20px_hsl(43_96%_56%/0.3)] hover:scale-110 active:scale-95 transition-transform",
        quickAction:
          "bg-[hsl(220_15%_18%)/0.8] text-[hsl(45_10%_85%)] border border-[hsl(220_15%_20%)/0.5] hover:bg-[hsl(220_15%_18%)] hover:border-[hsl(43_96%_56%)/0.5] hover:text-[hsl(43_96%_56%)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-lg px-8",
        xl: "h-14 rounded-xl px-10 text-base",
        icon: "h-10 w-10",
        iconLg: "h-16 w-16",
        iconXl: "h-24 w-24",
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
