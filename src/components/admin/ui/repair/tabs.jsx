import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md p-1",
      "text-[hsl(215_20%_65%)]",
      className
    )}
    style={{ backgroundColor: "hsl(222 30% 20%)" }}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium",
      "transition-all duration-200",
      "focus-visible:outline-none animation-focus",
      "disabled:pointer-events-none disabled:opacity-50",
      "data-[state=active]:bg-[hsl(222_47%_11%)] data-[state=active]:text-[hsl(210_40%_98%)]",
      "data-[state=inactive]:text-[hsl(215_20%_65%)]",
      "data-[state=active]:shadow-[0_1px_3px_rgb(0_0_0_/_0.1)]",
      className
    )}
    onFocusVisible={(e) => {
      e.currentTarget.style.outline = "2px solid hsl(38 92% 50%)";
      e.currentTarget.style.outlineOffset = "2px";
      e.currentTarget.style.boxShadow = "0 0 0 4px hsl(222 47% 11%)";
    }}
    onBlur={(e) => {
      e.currentTarget.style.outline = "";
      e.currentTarget.style.boxShadow = "";
    }}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("mt-2", className)}
    // Focus ring handled via global CSS (recommended)
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
