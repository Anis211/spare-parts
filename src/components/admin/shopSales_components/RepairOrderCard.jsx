"use client";
import { Calendar, Phone, User, Wrench, Car, Clock } from "lucide-react";
import { Badge } from "@/components/admin/ui/sales/badge";
import useUser from "@/zustand/user";
import { cn } from "@/lib/utils";

const statusConfig = {
  "in-progress": {
    label: "In Progress",
    className: cn(
      "border-[hsl(38_92%_50%)]/30",
      "bg-[hsl(38_92%_50%)]/20",
      "text-[hsl(38_92%_50%)]"
    ),
  },
  completed: {
    label: "Completed",
    className: cn(
      "border-[hsl(142_72%_45%)]/30",
      "bg-[hsl(142_72%_45%)]/20",
      "text-[hsl(142_72%_45%)]"
    ),
  },
  pending: {
    label: "Pending",
    className: cn(
      "border-[hsl(217_91%_60%)]/30",
      "bg-[hsl(217_91%_60%)]/20",
      "text-[hsl(217_91%_60%)]"
    ),
  },
};

function calculateOrderTotals(order) {
  let partsTotal = 0;
  let laborTotal = 0;
  const works = Array.isArray(order?.repairWorks) ? order.repairWorks : [];
  works.forEach((work) => {
    laborTotal += work?.laborCost || 0;
    const parts = Array.isArray(work?.parts) ? work.parts : [];
    parts.forEach((part) => {
      partsTotal += part?.totalPrice || 0;
    });
  });
  const grandTotal = partsTotal + laborTotal;
  return {
    partsTotal: parseFloat(partsTotal.toFixed(2)),
    laborTotal: parseFloat(laborTotal.toFixed(2)),
    grandTotal: parseFloat(grandTotal.toFixed(2)),
  };
}

export function RepairOrderCard({ setActiveTab, order, style }) {
  const status = statusConfig[order.status] || statusConfig.pending;
  const totals = calculateOrderTotals(order);
  const repairWorkNames = order.repairWorks?.map((w) => w.name) || [];

  const setSalesTab = useUser((state) => state.setSalesTab);
  const setVin = useUser((state) => state.setVin);

  const handleClick = () => {
    setVin(order.vin);
    setSalesTab("Details");
    setActiveTab("Details");
  };

  return (
    <div
      onClick={handleClick}
      className="group rounded-xl border-[hsl(222_30%_18%)] bg-[hsl(222_47%_9%)] p-5 transition-all duration-300 hover:ring-1 hover:ring-[hsl(40_95%_55%)]/60 hover:shadow-lg hover:shadow-[hsl(40_95%_55%)]/5 animate-fade-in cursor-pointer"
      style={style}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(40_95%_55%)]/10 group-hover:bg-[hsl(40_95%_55%)]/20 transition-colors">
            <Car className="h-5 w-5 text-[hsl(40_95%_55%)]" />{" "}
          </div>
          <div>
            <p className="text-sm text-[hsl(220_15%_55%)] mb-0.5">VIN Number</p>{" "}
            <p className="font-mono text-md font-semibold text-[hsl(40_95%_65%)] tracking-wide">
              {order.vin}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={cn("text-xs", status.className)}>
          {status.label}
        </Badge>
      </div>

      {/* Client Info */}
      <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-[hsl(222_30%_18%)]">
        <div className="flex items-center gap-2.5">
          <User className="h-4 w-4 text-[hsl(220_15%_55%)]" />
          <div>
            <p className="text-sm text-[hsl(220_15%_55%)]">Client</p>
            <p className="text-md font-medium text-[hsl(40_15%_95%)]">
              {order.clientName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Phone className="h-4 w-4 text-[hsl(220_15%_55%)]" />
          <div>
            <p className="text-sm text-[hsl(220_15%_55%)]">Phone</p>
            <p className="text-md font-mono font-medium text-[hsl(40_15%_95%)]">
              {order.clientPhone}
            </p>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-[hsl(222_30%_18%)]">
        <div className="flex items-center gap-2.5">
          <Calendar className="h-4 w-4 text-[hsl(220_15%_55%)]" />
          <div>
            <p className="text-sm text-[hsl(220_15%_55%)]">Arrival Date</p>
            <p className="text-md font-medium text-[hsl(40_15%_95%)]">
              {order.arrivalDate}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Clock className="h-4 w-4 text-[hsl(220_15%_55%)]" />
          <div>
            <p className="text-sm text-[hsl(220_15%_55%)]">Completion</p>
            <p className="text-md font-medium text-[hsl(40_15%_95%)]">
              {order.completionDate || "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Worker */}
      <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-[hsl(222_30%_18%)]">
        <Wrench className="h-4 w-4 text-[hsl(220_15%_55%)]" />
        <div>
          <p className="text-sm text-[hsl(220_15%_55%)]">Repair Worker</p>
          <p className="text-md font-medium text-[hsl(40_15%_95%)]">
            {order.workerName}
          </p>
        </div>
      </div>

      {/* Repair Works */}
      <div className="mb-4">
        <p className="text-sm text-[hsl(220_15%_55%)] mb-2">Repair Works</p>
        <div className="flex flex-wrap gap-2">
          {repairWorkNames.map((work, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="bg-[hsl(222_30%_15%)] text-[hsl(40_15%_95%)] text-sm"
            >
              {work}
            </Badge>
          ))}
        </div>
      </div>

      {/* Total Cost */}
      <div className="flex items-center justify-between pt-3 border-t border-[hsl(222_30%_18%)]">
        <p className="text-md text-[hsl(220_15%_55%)]">Total Cost</p>
        <p className="text-lg font-bold text-[hsl(40_95%_55%)]">
          ${" "}
          {totals.grandTotal.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>
    </div>
  );
}
