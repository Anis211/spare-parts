"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm",
      "border-[hsl(222_30%_18%)]", // border-primary → but you use --border for inputs; your theme uses --border: 222 30% 18%
      "ring-offset-[hsl(222_47%_6%)]", // ring-offset-background
      "data-[state=checked]:bg-[hsl(40_95%_55%)]", // data-[state=checked]:bg-primary
      "data-[state=checked]:border-[hsl(40_95%_55%)]", // match border to bg when checked
      "data-[state=checked]:text-[hsl(222_47%_6%)]", // data-[state=checked]:text-primary-foreground
      "focus-visible:outline-none",
      "focus-visible:ring-2 focus-visible:ring-[hsl(40_95%_55%)]", // focus-visible:ring-ring
      "focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));

Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
