import * as React from "react";

let Input = React.forwardRef((props, ref) => {
  const { className, type = "text", disabled, ...rest } = props;

  // Combine hardcoded classes + optional className
  const baseClasses = [
    "flex h-10 w-full rounded-md px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium",
    "focus-visible:outline-none transition-all duration-200",
    disabled ? "cursor-not-allowed opacity-50" : "",
    className || "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <input
      ref={ref}
      type={type}
      {...rest}
      className={baseClasses}
      style={{
        backgroundColor: "hsl(240 20% 4%)",
        color: "hsl(0 0% 98%)",
        borderColor: "hsl(240 10% 18%)",
      }}
    />
  );
});

Input.displayName = "Input";

if (typeof document !== "undefined") {
  const styleId = "shadcn-input-styles";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .shadcn-input {
        /* Placeholder */
      }
      .shadcn-input::placeholder {
        color: hsl(240 5% 55%); /* text-muted-foreground */
      }

      /* Focus ring (focus-visible only if supported) */
      .shadcn-input:focus-visible {
        box-shadow: 0 0 0 2px hsl(240 20% 4%), 0 0 0 4px hsl(40 92% 55%); /* ring-2 */
      }

      /* File input text color */
      .shadcn-input::file-selector-button {
        color: hsl(0 0% 98%) !important;
      }
    `;
    document.head.appendChild(style);
  }
}

// Add utility className for scoped styling
Input = React.forwardRef((props, ref) => {
  const { className, ...rest } = props;
  return (
    <InputInner
      ref={ref}
      className={`shadcn-input ${className || ""}`}
      {...rest}
    />
  );
});

const InputInner = React.forwardRef((props, ref) => {
  const { className, type = "text", disabled, ...rest } = props;

  const baseClasses = [
    "flex h-10 w-full rounded-md px-3 py-2 text-base",
    "file:border-0 file:bg-transparent file:text-sm file:font-medium",
    "focus-visible:outline-none",
    disabled ? "cursor-not-allowed opacity-50" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <input
      ref={ref}
      type={type}
      className={baseClasses}
      style={{
        backgroundColor: "hsl(240 20% 4%)",
        color: "hsl(0 0% 98%)",
        borderColor: "hsl(240 10% 18%)",
      }}
      {...rest}
    />
  );
});

Input.displayName = "Input";
export { Input };
