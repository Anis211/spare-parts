import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[hsl(220_15%_20%)]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
