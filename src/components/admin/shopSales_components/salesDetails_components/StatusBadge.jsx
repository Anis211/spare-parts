import { cn } from "@/lib/utils";

export const StatusBadge = ({ status, className }) => {
  // Map status to label + style (HSL-based, no external classes)
  const config = {
    delivered: {
      label: "Delivered",
      bg: "bg-[hsl(142_71%_45%_/_15%)]", // success bg (15% opacity)
      text: "text-[hsl(142_71%_45%)]", // success text
      border: "border border-[hsl(142_71%_45%_/_30%)]", // subtle border
    },
    completed: {
      label: "Completed",
      bg: "bg-[hsl(142_71%_45%_/_15%)]",
      text: "text-[hsl(142_71%_45%)]",
      border: "border border-[hsl(142_71%_45%_/_30%)]",
    },
    pending: {
      label: "Pending",
      bg: "bg-[hsl(38_92%_50%_/_15%)]", // warning bg
      text: "text-[hsl(38_92%_50%)]", // warning text (amber)
      border: "border border-[hsl(38_92%_50%_/_30%)]",
    },
    "in-progress": {
      label: "In Progress",
      bg: "bg-[hsl(199_89%_48%_/_15%)]", // info bg (blue)
      text: "text-[hsl(199_89%_48%)]", // info text
      border: "border border-[hsl(199_89%_48%_/_30%)]",
    },
    ordered: {
      // alias → same as 'pending'
      label: "Ordered",
      bg: "bg-[hsl(38_92%_50%_/_15%)]",
      text: "text-[hsl(38_92%_50%)]",
      border: "border border-[hsl(38_92%_50%_/_30%)]",
    },
    shipped: {
      // alias → same as 'in-progress'
      label: "Shipped",
      bg: "bg-[hsl(199_89%_48%_/_15%)]",
      text: "text-[hsl(199_89%_48%)]",
      border: "border border-[hsl(199_89%_48%_/_30%)]",
    },
  }[status] || {
    label: "Unknown",
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      {config.label}
    </span>
  );
};
