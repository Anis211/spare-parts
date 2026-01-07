import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const RadioGroup = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      style={{
        // Border & default state
        borderColor: "hsl(222 30% 22%)", // --border (fallback for unselected)
        backgroundColor: "hsl(222 47% 14%)", // --background
      }}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        className="flex items-center justify-center"
        style={{
          // When checked: primary color
          color: "hsl(38 92% 50%)", // --primary (fill and border on select)
        }}
      >
        <Circle
          className="h-2.5 w-2.5"
          style={{
            fill: "hsl(38 92% 50%)", // --primary
            color: "hsl(38 92% 50%)",
          }}
        />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});

const StyledRadioItem = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-colors duration-200",
        className
      )}
      style={{
        borderColor: "hsl(222 30% 22%)", // default: --border
      }}
      data-state="unchecked"
      {...props}
    />
  );
});

// Final version with dynamic styling via data attributes (recommended)
// Radix sets `data-state="checked"` / `"unchecked"` automatically
const RadioGroupItemFinal = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-colors duration-200",
        className
      )}
      // We rely on CSS for data-state styling (cleaner, no JS needed)
      // Add to app/globals.css (see below)
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItemFinal.displayName = RadioGroupPrimitive.Item.displayName;

// ✅ Recommended: Use this version + add CSS to globals.css
export { RadioGroup, RadioGroupItemFinal as RadioGroupItem };
