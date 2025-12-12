import * as React from "react";

// --- Your color palette ---
const COLORS = {
  background: "hsl(222 47% 11%)",
  foreground: "hsl(48 96% 89%)",
  input: "hsl(222 30% 25%)",
  mutedForeground: "hsl(220 15% 60%)",
  ring: "hsl(45 93% 47%)",
};

const Input = React.forwardRef((props, ref) => {
  const { className, type = "text", style, ...rest } = props;

  return (
    <input
      type={type}
      ref={ref}
      className={`
        flex h-10 w-full rounded-md px-3 py-2 text-base
        file:border-0 file:bg-transparent file:text-sm file:font-medium
        placeholder:text-muted-foreground
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        md:text-sm
        ${className || ""}
      `}
      style={{
        backgroundColor: COLORS.background,
        borderColor: COLORS.input,
        color: COLORS.foreground,
        ...style,
        "--ring-color": COLORS.ring,
        "--ring-offset-color": COLORS.background,
      }}
      {...rest}
    />
  );
});

Input.displayName = "Input";

export { Input };
