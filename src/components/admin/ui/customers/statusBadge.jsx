"use client";

import { cn } from "@/lib/utils";

const statusConfig = {
  pending: {
    label: "Pending",
    bg: "hsl(38 92% 50% / 0.15)", // warning/15
    border: "hsl(38 92% 50% / 0.3)", // warning/30
    text: "hsl(38 92% 50%)", // warning
  },
  in_progress: {
    label: "In Progress",
    bg: "hsl(199 89% 48% / 0.15)", // info/15
    border: "hsl(199 89% 48% / 0.3)", // info/30
    text: "hsl(199 89% 48%)", // info
  },
  completed: {
    label: "Completed",
    bg: "hsl(142 76% 36% / 0.15)", // success/15
    border: "hsl(142 76% 36% / 0.3)", // success/30
    text: "hsl(142 76% 36%)", // success
  },
};

export const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        color: config.text,
      }}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
