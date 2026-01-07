import { X, Wrench, Clock, Car } from "lucide-react";
import { Button } from "@/components/repair/ui/button";

export function PinnedRepairBanner({ client, startTime, onEndRepair }) {
  return (
    <div
      className="px-4 py-3"
      style={{
        borderBottom: "1px solid hsl(220 15% 20%)",
        backgroundColor: "hsl(43 96% 56% / 0.05)",
      }}
    >
      <div className="mx-auto max-w-2xl flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{
            backgroundColor: "hsl(43 96% 56%)",
            color: "hsl(220 20% 8%)",
          }}
        >
          <Wrench className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-semibold truncate"
              style={{ color: "hsl(45 10% 95%)" }}
            >
              {client.clientName}
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: "hsl(43 96% 56% / 0.2)",
                color: "hsl(43 96% 56%)",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: "hsl(43 96% 56%)" }}
              />
              In Progress
            </span>
          </div>
          <div
            className="flex items-center gap-3 text-xs"
            style={{ color: "hsl(220 10% 55%)" }}
          >
            <span className="flex items-center gap-1">
              <Car className="h-3 w-3" />
              {client.carYear} {client.carModel}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Started {startTime}
            </span>
            <span className="font-medium" style={{ color: "hsl(43 96% 56%)" }}>
              {client.serviceType}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEndRepair}
          className="shrink-0"
          style={{
            color: "hsl(220 10% 55%)",
            backgroundColor: "transparent",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(0 72% 51%)")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "hsl(220 10% 55%)")
          }
        >
          <X className="h-4 w-4 mr-1" />
          End
        </Button>
      </div>
    </div>
  );
}
