import { useRef, useState, useEffect } from "react";

export const OTPInput = ({ length = 6, value, onChange, disabled }) => {
  const inputRefs = useRef([]);
  const [focusedIndex, setFocusedIndex] = useState(null);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index, char) => {
    if (!/^\d*$/.test(char)) return;

    const newValue = value.split("");
    newValue[index] = char;
    const result = newValue.join("").slice(0, length);
    onChange(result);

    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    onChange(pastedData);
    inputRefs.current[Math.min(pastedData.length, length - 1)]?.focus();
  };

  return (
    <div className="flex justify-center gap-3">
      {Array.from({ length }).map((_, index) => {
        const isFocused = focusedIndex === index;
        return (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[index] || ""}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex(null)}
            disabled={disabled}
            className={`w-12 h-14 text-center text-xl font-bold rounded-lg border-2 transition-all duration-200 focus:outline-none
              ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            `}
            style={{
              backgroundColor: "hsl(240 12% 14% / 0.5)", // bg-secondary/50
              color: "hsl(0 0% 98%)", // text-foreground
              borderColor: isFocused
                ? "hsl(40 92% 55%)" // border-primary
                : "hsl(240 10% 18%)", // border-border
              // Mimic ring-2 ring-primary/30 on focus
              ...(isFocused && {
                boxShadow: "0 0 0 2px hsl(40 92% 55% / 0.3)",
              }),
            }}
          />
        );
      })}
    </div>
  );
};
