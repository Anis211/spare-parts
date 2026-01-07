import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(undefined);

  React.useEffect(() => {
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Set initial value
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    // Listen for resize
    window.addEventListener("resize", onChange);

    // Cleanup
    return () => {
      window.removeEventListener("resize", onChange);
    };
  }, []);

  // Return boolean (fallback to `false` during SSR/hydration if needed)
  return !!isMobile;
}
