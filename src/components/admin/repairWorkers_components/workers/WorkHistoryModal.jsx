"use client";
import {
  Wrench,
  Car,
  User,
  Phone,
  Calendar,
  FileText,
  Hash,
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/repair/dialog";
import { ScrollArea } from "@/components/admin/ui/repair/scroll-area";
import { Badge } from "@/components/admin/ui/repair/badge";
import { Separator } from "@/components/admin/ui/repair/separator";

// Inner WorkCard Component
function WorkCard({ work }) {
  const statusConfig = {
    completed: {
      borderColor: "hsl(142 76% 36%)",
      textColor: "hsl(142 76% 36%)",
      bgColor: "hsl(142 76% 36% / 0.1)",
    },
    "in-progress": {
      borderColor: "hsl(38 92% 50%)",
      textColor: "hsl(38 92% 50%)",
      bgColor: "hsl(38 92% 50% / 0.1)",
    },
    pending: {
      borderColor: "hsl(215 20% 65%)",
      textColor: "hsl(215 20% 65%)",
      bgColor: "hsl(222 30% 20% / 0.1)",
    },
  };

  const status = statusConfig[work.status] || statusConfig.pending;

  return (
    <div
      className="rounded-lg overflow-hidden animation-colors duration-200"
      style={{
        backgroundColor: "hsl(222 47% 18% / 0.3)",
        borderColor: "hsl(222 30% 22% / 0.5)",
        borderStyle: "solid",
        borderWidth: "2px",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "hsl(38 92% 50% / 0.7)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "hsl(222 30% 22% / 0.5)";
      }}
    >
      {/* Header */}
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: "hsl(38 92% 50% / 0.2)" }}
          >
            <Wrench className="w-5 h-5" style={{ color: "hsl(38 92% 50%)" }} />
          </div>
          <div>
            <h4 className="font-semibold" style={{ color: "hsl(210 40% 98%)" }}>
              {work.title}
            </h4>
            <p
              className="text-sm flex items-center gap-1"
              style={{ color: "hsl(215 20% 65%)" }}
            >
              <Calendar className="w-3 h-3" />
              {format(new Date(work.completedDate), "MMM dd, yyyy")}
            </p>
          </div>
        </div>
        <div className="text-right">
          <Badge
            variant="secondary"
            className="border-0"
            style={{
              backgroundColor: status.bgColor,
              color: status.textColor,
              borderColor: status.borderColor,
            }}
          >
            {work.status}
          </Badge>
          <p
            className="text-lg font-bold mt-1"
            style={{ color: "hsl(38 92% 50%)" }}
          >
            ${work.laborCost.toFixed(2)}
          </p>
        </div>
      </div>

      <Separator style={{ backgroundColor: "hsl(222 30% 22% / 0.5)" }} />

      {/* Car Info */}
      <div
        className="p-4"
        style={{ backgroundColor: "hsl(222 47% 18% / 0.2)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Car className="w-4 h-4" style={{ color: "hsl(38 92% 50%)" }} />
          <span
            className="text-sm font-medium"
            style={{ color: "hsl(210 40% 98%)" }}
          >
            Vehicle Information
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p style={{ color: "hsl(215 20% 65%)" }}>Make / Model</p>
            <p className="font-medium" style={{ color: "hsl(210 40% 98%)" }}>
              {work.car.year} {work.car.make} {work.car.model}
            </p>
          </div>
          <div>
            <p style={{ color: "hsl(215 20% 65%)" }}>License Plate</p>
            <p className="font-medium" style={{ color: "hsl(210 40% 98%)" }}>
              {work.car.licensePlate}
            </p>
          </div>
          <div className="col-span-2">
            <p
              className="flex items-center gap-1"
              style={{ color: "hsl(215 20% 65%)" }}
            >
              <Hash className="w-3 h-3" /> VIN
            </p>
            <p
              className="font-mono text-xs"
              style={{ color: "hsl(210 40% 98%)" }}
            >
              {work.car.vin}
            </p>
          </div>
        </div>
      </div>

      <Separator style={{ backgroundColor: "hsl(222 30% 22% / 0.5)" }} />

      {/* Client Info */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4" style={{ color: "hsl(38 92% 50%)" }} />
          <span
            className="text-sm font-medium"
            style={{ color: "hsl(210 40% 98%)" }}
          >
            Client Information
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p style={{ color: "hsl(215 20% 65%)" }}>Name</p>
            <p className="font-medium" style={{ color: "hsl(210 40% 98%)" }}>
              {work.clientName}
            </p>
          </div>
          <div>
            <p
              className="flex items-center gap-1"
              style={{ color: "hsl(215 20% 65%)" }}
            >
              <Phone className="w-3 h-3" /> Phone
            </p>
            <p className="font-medium" style={{ color: "hsl(210 40% 98%)" }}>
              {work.clientPhone}
            </p>
          </div>
        </div>
      </div>

      {/* Notes */}
      {work.notes && (
        <>
          <Separator style={{ backgroundColor: "hsl(222 30% 22% / 0.5)" }} />
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText
                className="w-4 h-4"
                style={{ color: "hsl(215 20% 65%)" }}
              />
              <span
                className="text-sm font-medium"
                style={{ color: "hsl(215 20% 65%)" }}
              >
                Notes
              </span>
            </div>
            <p className="text-sm" style={{ color: "hsl(210 40% 98% / 0.8)" }}>
              {work.notes}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// Main Modal
export function WorkHistoryModal({ open, onClose, worker }) {
  const sortedWorks = [...worker.currentMonthWorks].sort(
    (a, b) =>
      new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime()
  );

  const totalEarned = worker.currentMonthWorks.reduce(
    (sum, w) => sum + w.laborCost,
    0
  );
  const completedCount = worker.currentMonthWorks.filter(
    (w) => w.status === "completed"
  ).length;

  // Safe avatar fallback
  const avatarInitial = worker.name ? worker.name.charAt(0).toUpperCase() : "?";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-[50vw] max-h-[85vh]"
        style={{
          backgroundColor: "hsl(222 47% 14%)",
          borderColor: "hsl(222 30% 22%)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-semibold"
              style={{
                backgroundColor: "hsl(38 92% 50% / 0.2)",
                color: "hsl(38 92% 50%)",
              }}
            >
              {avatarInitial}
            </div>
            <div>
              <div className="flex items-start gap-2">
                <span style={{ color: "hsl(210 40% 98%)" }}>{worker.name}</span>
                <Badge
                  variant="secondary"
                  className="border-0 text-xs"
                  style={{
                    backgroundColor: "hsl(38 92% 50% / 0.1)",
                    color: "hsl(38 92% 50%)",
                  }}
                >
                  {worker.specialty}
                </Badge>
              </div>
              <p
                className="text-sm font-normal text-start"
                style={{ color: "hsl(215 20% 65%)" }}
              >
                {worker.phone}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div
            className="rounded-lg p-4 text-center"
            style={{ backgroundColor: "hsl(222 47% 18% / 0.5)" }}
          >
            <p className="text-md" style={{ color: "hsl(215 20% 65%)" }}>
              Total Jobs
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: "hsl(210 40% 98%)" }}
            >
              {worker.currentMonthWorks.length}
            </p>
          </div>
          <div
            className="rounded-lg p-3 text-center"
            style={{ backgroundColor: "hsl(222 47% 18% / 0.5)" }}
          >
            <p className="text-md" style={{ color: "hsl(215 20% 65%)" }}>
              Completed
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: "hsl(142 76% 36%)" }}
            >
              {completedCount}
            </p>
          </div>
          <div
            className="rounded-lg p-3 text-center"
            style={{ backgroundColor: "hsl(222 47% 18% / 0.5)" }}
          >
            <p className="text-md" style={{ color: "hsl(215 20% 65%)" }}>
              Earned
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: "hsl(38 92% 50%)" }}
            >
              ${totalEarned.toFixed(2)}
            </p>
          </div>
        </div>

        <ScrollArea className="h-[500px] pr-4">
          {sortedWorks.length === 0 ? (
            <div
              className="text-center py-12"
              style={{ color: "hsl(215 20% 65%)" }}
            >
              No repair work recorded yet
            </div>
          ) : (
            <div className="space-y-4">
              {sortedWorks.map((work) => (
                <WorkCard key={work.id} work={work} />
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
