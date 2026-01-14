import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

// --- Config: Your HSL theme colors ---
const COLORS = {
  primary: "hsl(40 92% 55%)",
  primaryForeground: "hsl(240 20% 4%)",
  destructive: "hsl(0 84% 60%)",
  destructiveForeground: "hsl(0 0% 98%)",
  secondary: "hsl(240 12% 14%)",
  secondaryForeground: "hsl(0 0% 98%)",
  border: "hsl(240 10% 18%)",
  foreground: "hsl(0 0% 98%)",
  mutedForeground: "hsl(240 5% 55%)",
  ring: "hsl(40 92% 55%)",
  background: "hsl(240 20% 4%)",
};

// --- Manual variant resolver (replaces cva) ---
const getButtonClasses = ({
  variant = "default",
  size = "default",
  className = "",
}) => {
  const baseClasses = [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold",
    "transition-all duration-200 focus-visible:outline-none",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ];

  // Variant-specific styles (inlined with HSL)
  const variantClasses = {
    default: [
      `bg-[${COLORS.primary}]`,
      `text-[${COLORS.primaryForeground}]`,
      "shadow-lg",
      "hover:bg-[hsl(40 92% 55% / 0.9)]",
      "hover:shadow-xl",
      "hover:shadow-[hsl(40 92% 55% / 0.2)]",
    ],
    destructive: [
      `bg-[${COLORS.destructive}]`,
      `text-[${COLORS.destructiveForeground}]`,
      "hover:bg-[hsl(0 84% 60% / 0.9)]",
    ],
    outline: [
      `border border-[${COLORS.border}]`,
      "bg-transparent",
      `text-[${COLORS.foreground}]`,
      `hover:bg-[${COLORS.secondary}]`,
      "hover:border-[hsl(40 92% 55% / 0.5)]",
    ],
    secondary: [
      `bg-[hsl(40_92%_55%)]`,
      `text-[${COLORS.secondaryForeground}]`,
      "hover:bg-[hsl(240 12% 14% / 0.8)]",
    ],
    ghost: [
      `text-[${COLORS.mutedForeground}]`,
      `hover:bg-[${COLORS.secondary}]`,
      `hover:text-[${COLORS.foreground}]`,
    ],
    link: [`text-[${COLORS.primary}]`, "underline-offset-4 hover:underline"],
    glow: [
      `bg-[hsl(40_92%_55%)]`,
      `text-[hsl(0_0%_98%)]`,
      "shadow-lg shadow-[hsl(40_92%_55%)/30]",
      "hover:shadow-xl hover:shadow-[hsl(40_92%_55%)]/40",
      "hover:bg-[hsl(40_92%_55%)]/90",
    ],
  };

  // Size classes
  const sizeClasses = {
    default: "h-11 px-6 py-2",
    sm: "h-9 rounded-md px-4 text-xs",
    lg: "h-12 rounded-lg px-8 text-base",
    icon: "h-10 w-10",
  };

  // Combine
  return [
    ...baseClasses,
    ...(variantClasses[variant] || variantClasses.default),
    sizeClasses[size] || sizeClasses.default,
    className,
  ]
    .filter(Boolean)
    .join(" ");
};

// --- Focus ring style (since `focus-visible:ring-*` needs offset + ring) ---
const focusRingStyle = {
  outline: "none",
  boxShadow: `0 0 0 2px ${COLORS.background}, 0 0 0 4px ${COLORS.ring}`,
};

// --- Button Component ---
const Button = React.forwardRef((props, ref) => {
  const {
    className = "",
    variant = "default",
    size = "default",
    asChild = false,
    disabled,
    style,
    ...rest
  } = props;

  const Comp = asChild ? Slot : "button";
  const classes = getButtonClasses({ variant, size, className });

  return (
    <Comp
      ref={ref}
      className={classes}
      disabled={disabled}
      style={{
        ...style,
        ...(rest.onFocus || rest.onKeyDown || !disabled
          ? { "--ring-color": COLORS.ring } // optional for CSS
          : {}),
      }}
      {...rest}
      // Add focus ring via inline style (fallback for no Tailwind)
      onFocus={(e) => {
        if (rest.onFocus) rest.onFocus(e);
        if (!disabled) {
          e.target.style.boxShadow = `0 0 0 2px ${COLORS.background}, 0 0 0 4px ${COLORS.ring}`;
        }
      }}
      onBlur={(e) => {
        if (rest.onBlur) rest.onBlur(e);
        e.target.style.boxShadow = "";
      }}
    />
  );
});

Button.displayName = "Button";

export { Button };
