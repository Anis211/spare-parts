"use client";
import { useState } from "react";
import { format } from "date-fns";
import {
  Phone,
  Mail,
  Car,
  User,
  History,
  Wrench,
  Calendar,
  Edit,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/repair/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/admin/ui/repair/alert-dialog";
import { Badge } from "@/components/admin/ui/repair/badge";
import { Button } from "@/components/admin/ui/repair/button";
import { ScrollArea } from "@/components/admin/ui/repair/scroll-area";

// Status-based HSL styles
const getStatusStyle = (status) => {
  switch (status) {
    case "scheduled":
      return {
        backgroundColor: "hsl(199 89% 48% / 0.2)", // --chart-3/20
        color: "hsl(199 89% 48%)", // --chart-3
        borderColor: "hsl(199 89% 48% / 0.3)", // --chart-3/30
      };
    case "in-progress":
      return {
        backgroundColor: "hsl(38 92% 50% / 0.2)", // --primary/20
        color: "hsl(38 92% 50%)", // --primary
        borderColor: "hsl(38 92% 50% / 0.3)", // --primary/30
      };
    case "completed":
      return {
        backgroundColor: "hsl(142 76% 36% / 0.2)", // --success/20
        color: "hsl(142 76% 36%)", // --success
        borderColor: "hsl(142 76% 36% / 0.3)", // --success/30
      };
    case "cancelled":
      return {
        backgroundColor: "hsl(0 84% 60% / 0.2)", // --destructive/20
        color: "hsl(0 84% 60%)", // --destructive
        borderColor: "hsl(0 84% 60% / 0.3)", // --destructive/30
      };
    default:
      return {
        backgroundColor: "hsl(222 30% 20%)", // --muted
        color: "hsl(215 20% 65%)", // --muted-foreground
        borderColor: "hsl(222 30% 22%)",
      };
  }
};

export function ReservationDetailModal({
  reservation,
  open,
  onOpenChange,
  onEdit,
  onCancel,
}) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  if (!reservation) return null;

  const handleEdit = () => {
    onOpenChange(false);
    onEdit?.(reservation);
  };

  const handleCancelConfirm = () => {
    onCancel?.(reservation.id);
    setCancelDialogOpen(false);
    onOpenChange(false);
  };

  const canModify =
    reservation.status !== "completed" && reservation.status !== "cancelled";

  // Safe avatar fallback
  const workerAvatar = reservation.worker.name
    ? reservation.worker.name.charAt(0).toUpperCase()
    : "?";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] border-2 border-[hsl(222_30%_22%)]"
          style={{
            backgroundColor: "hsl(222 47% 14%)", // --card
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: "hsl(38 92% 50% / 0.2)" }}
              >
                <Wrench
                  className="w-5 h-5"
                  style={{ color: "hsl(38 92% 50%)" }}
                />
              </div>
              <span style={{ color: "hsl(210 40% 98%)" }}>
                {reservation.serviceType}
              </span>
              <Badge
                variant="secondary"
                className="ml-auto border-0"
                style={getStatusStyle(reservation.status)}
              >
                {reservation.status}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {/* Action Buttons */}
          {canModify && (onEdit || onCancel) && (
            <div className="flex gap-2 mb-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="gap-2"
                  style={{
                    color: "hsl(210 40% 98%)",
                    backgroundColor: "transparent",
                    borderColor: "hsl(222 30% 22%)",
                  }}
                >
                  <Edit className="w-4 h-4" />
                  Edit Reservation
                </Button>
              )}
              {onCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCancelDialogOpen(true)}
                  className="gap-2"
                  style={{
                    color: "hsl(0 84% 60%)", // --destructive
                    backgroundColor: "transparent",
                    borderColor: "hsl(222 30% 22%)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "hsl(0 84% 60% / 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "";
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  Cancel Reservation
                </Button>
              )}
            </div>
          )}

          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6">
              {/* Appointment Info */}
              <div
                className="p-4 space-y-3 border-2 border-[hsl(222_30%_22%)] rounded-lg"
                style={{ backgroundColor: "hsl(222 47% 14%)" }} // glass-card ≈ card
              >
                <h3
                  className="font-semibold flex items-center gap-2"
                  style={{ color: "hsl(210 40% 98%)" }}
                >
                  <Calendar
                    className="w-4 h-4"
                    style={{ color: "hsl(38 92% 50%)" }} // --primary
                  />
                  Appointment Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-md">
                  <div>
                    <p style={{ color: "hsl(215 20% 65%)" }}>Date</p>
                    <p
                      className="font-medium"
                      style={{ color: "hsl(210 40% 98%)" }}
                    >
                      {format(new Date(reservation.date), "EEEE, MMMM d, yyyy")}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: "hsl(215 20% 65%)" }}>Time</p>
                    <p
                      className="font-medium"
                      style={{ color: "hsl(210 40% 98%)" }}
                    >
                      {reservation.startTime} - {reservation.endTime}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: "hsl(215 20% 65%)" }}>Estimated Cost</p>
                    <p
                      className="font-medium"
                      style={{ color: "hsl(38 92% 50%)" }} // --primary
                    >
                      ${reservation.estimatedCost}
                    </p>
                  </div>
                  {reservation.notes && (
                    <div className="col-span-2">
                      <p style={{ color: "hsl(215 20% 65%)" }}>Notes</p>
                      <p
                        className="font-medium"
                        style={{ color: "hsl(210 40% 98%)" }}
                      >
                        {reservation.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Client Info */}
              <div
                className="p-4 space-y-3 border-2 border-[hsl(222_30%_22%)] rounded-lg"
                style={{ backgroundColor: "hsl(222 47% 14%)" }}
              >
                <h3
                  className="font-semibold flex items-center gap-2"
                  style={{ color: "hsl(210 40% 98%)" }}
                >
                  <User
                    className="w-4 h-4"
                    style={{ color: "hsl(199 89% 48%)" }} // --chart-3
                  />
                  Client Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-md">
                  <div>
                    <p style={{ color: "hsl(215 20% 65%)" }}>Name</p>
                    <p
                      className="font-medium"
                      style={{ color: "hsl(210 40% 98%)" }}
                    >
                      {reservation.client.name}
                    </p>
                  </div>
                  <div>
                    <p
                      className="flex items-center gap-1"
                      style={{ color: "hsl(215 20% 65%)" }}
                    >
                      <Phone className="w-3 h-3" /> Phone
                    </p>
                    <p
                      className="font-medium"
                      style={{ color: "hsl(210 40% 98%)" }}
                    >
                      {reservation.client.phone}
                    </p>
                  </div>
                  {reservation.client.email && (
                    <div className="col-span-2">
                      <p
                        className="flex items-center gap-1"
                        style={{ color: "hsl(215 20% 65%)" }}
                      >
                        <Mail className="w-3 h-3" /> Email
                      </p>
                      <p
                        className="font-medium"
                        style={{ color: "hsl(210 40% 98%)" }}
                      >
                        {reservation.client.email}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Car Info */}
              <div
                className="p-4 space-y-3 border-2 border-[hsl(222_30%_22%)] rounded-lg"
                style={{ backgroundColor: "hsl(222 47% 14%)" }}
              >
                <h3
                  className="font-semibold flex items-center gap-2"
                  style={{ color: "hsl(210 40% 98%)" }}
                >
                  <Car
                    className="w-4 h-4"
                    style={{ color: "hsl(280 65% 60%)" }} // --chart-4
                  />
                  Vehicle Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-md">
                  <div>
                    <p style={{ color: "hsl(215 20% 65%)" }}>Vehicle</p>
                    <p
                      className="font-medium"
                      style={{ color: "hsl(210 40% 98%)" }}
                    >
                      {reservation.car.year} {reservation.car.make}{" "}
                      {reservation.car.model}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: "hsl(215 20% 65%)" }}>License Plate</p>
                    <p
                      className="font-medium font-mono"
                      style={{ color: "hsl(210 40% 98%)" }}
                    >
                      {reservation.car.licensePlate}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p style={{ color: "hsl(215 20% 65%)" }}>VIN</p>
                    <p
                      className="font-medium font-mono text-xs"
                      style={{ color: "hsl(210 40% 98%)" }}
                    >
                      {reservation.car.vin}
                    </p>
                  </div>
                </div>
              </div>

              {/* Worker Info */}
              <div
                className="p-4 space-y-3 border-2 border-[hsl(222_30%_22%)] rounded-lg"
                style={{ backgroundColor: "hsl(222 47% 14%)" }}
              >
                <h3
                  className="font-semibold flex items-center gap-2"
                  style={{ color: "hsl(210 40% 98%)" }}
                >
                  <Wrench
                    className="w-4 h-4"
                    style={{ color: "hsl(142 76% 36%)" }} // --success
                  />
                  Assigned Technician
                </h3>
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold"
                    style={{
                      backgroundColor: "hsl(38 92% 50% / 0.2)",
                      color: "hsl(38 92% 50%)",
                    }}
                  >
                    {workerAvatar}
                  </div>
                  <div>
                    <p
                      className="font-medium"
                      style={{ color: "hsl(210 40% 98%)" }}
                    >
                      {reservation.worker.name}
                    </p>
                    <p
                      className="text-md"
                      style={{ color: "hsl(215 20% 65%)" }}
                    >
                      {reservation.worker.specialty}
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: "hsl(215 20% 65%)" }}
                    >
                      {reservation.worker.phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Repair History */}
              <div
                className="p-4 space-y-3 border-2 border-[hsl(222_30%_22%)] rounded-lg"
                style={{ backgroundColor: "hsl(222 47% 14%)" }}
              >
                <h3
                  className="font-semibold flex items-center gap-2"
                  style={{ color: "hsl(210 40% 98%)" }}
                >
                  <History
                    className="w-4 h-4"
                    style={{ color: "hsl(340 75% 55%)" }} // --chart-5
                  />
                  Client Repair History
                </h3>
                {reservation.client.repairHistory?.length > 0 ? (
                  <div className="space-y-3">
                    {reservation.client.repairHistory.map((repair) => {
                      const statusColor =
                        repair.status === "completed"
                          ? "hsl(142 76% 36%)" // --success
                          : "hsl(38 92% 50%)"; // --primary

                      return (
                        <div
                          key={repair.id}
                          className="flex items-center justify-between p-3 rounded-lg"
                          style={{
                            backgroundColor: "hsl(222 47% 18% / 0.5)", // --secondary/50
                            borderColor: "hsl(222 30% 22% / 0.5)", // --border/50
                            borderStyle: "solid",
                            borderWidth: "1px",
                          }}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p
                                className="font-medium text-md"
                                style={{ color: "hsl(210 40% 98%)" }}
                              >
                                {repair.title}
                              </p>
                              <Badge
                                variant="outline"
                                className="text-sm border-0"
                                style={{
                                  backgroundColor: `${statusColor} / 0.2`,
                                  color: statusColor,
                                  borderColor: `${statusColor} / 0.3`,
                                }}
                              >
                                {repair.status}
                              </Badge>
                            </div>
                            <p
                              className="text-sm mt-1"
                              style={{ color: "hsl(215 20% 65%)" }}
                            >
                              {repair.car?.year} {repair.car?.make}{" "}
                              {repair.car?.model}
                            </p>
                            {repair.notes && (
                              <p
                                className="text-sm mt-1"
                                style={{ color: "hsl(215 20% 65%)" }}
                              >
                                {repair.notes}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p
                              className="font-medium"
                              style={{ color: "hsl(38 92% 50%)" }}
                            >
                              ${repair.laborCost}
                            </p>
                            <p
                              className="text-sm"
                              style={{ color: "hsl(215 20% 65%)" }}
                            >
                              {format(
                                new Date(repair.completedDate),
                                "MMM d, yyyy"
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-md" style={{ color: "hsl(215 20% 65%)" }}>
                    No previous repair history.
                  </p>
                )}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent
          style={{
            backgroundColor: "hsl(222 47% 14%)",
            borderColor: "hsl(222 30% 22%)",
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle
                className="w-5 h-5"
                style={{ color: "hsl(0 84% 60%)" }} // --destructive
              />
              <span style={{ color: "hsl(210 40% 98%)" }}>
                Cancel Reservation
              </span>
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: "hsl(215 20% 65%)" }}>
              Are you sure you want to cancel this reservation for{" "}
              <span
                className="font-medium"
                style={{ color: "hsl(210 40% 98%)" }}
              >
                {reservation.client.name}
              </span>
              ?
              <br />
              <br />
              <span className="text-sm">
                Service: {reservation.serviceType}
                <br />
                Date: {format(
                  new Date(reservation.date),
                  "MMMM d, yyyy"
                )} at {reservation.startTime}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              style={{
                color: "hsl(210 40% 98%)",
                backgroundColor: "transparent",
                borderColor: "hsl(222 30% 22%)",
              }}
            >
              Keep Reservation
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              style={{
                backgroundColor: "hsl(0 84% 60%)", // --destructive
                color: "hsl(210 40% 98%)", // --destructive-foreground
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "hsl(0 84% 60% / 0.9)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "hsl(0 84% 60%)";
              }}
            >
              Cancel Reservation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
