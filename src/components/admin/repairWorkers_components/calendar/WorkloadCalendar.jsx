"use client";
import { useState, useMemo } from "react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Car,
  Phone,
  Plus,
} from "lucide-react";
import { Button } from "@/components/admin/ui/repair/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/admin/ui/repair/card";
import { Badge } from "@/components/admin/ui/repair/badge";
import { ScrollArea } from "@/components/admin/ui/repair/scroll-area";
import { ReservationDetailModal } from "./ReservationDetailModal";
import { CreateReservationModal } from "./CreateReservationModal";
import { motion } from "framer-motion";

const TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

export function WorkloadCalendar({
  reservations,
  workers,
  onCreateReservation,
  onUpdateReservation,
  onCancelReservation,
}) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);

  // Week days (Mon–Sun)
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Today's reservations
  const todayReservations = useMemo(() => {
    return reservations.filter((res) =>
      isSameDay(new Date(res.date), selectedDate)
    );
  }, [reservations, selectedDate]);

  // Get reservation occupying this time slot for a worker
  const getReservationForSlot = (worker, timeSlot) => {
    return todayReservations.find((res) => {
      const startHour = parseInt(res.startTime.split(":")[0]);
      const slotHour = parseInt(timeSlot.split(":")[0]);
      const endHour = parseInt(res.endTime.split(":")[0]);
      return (
        res.worker.id === worker.id &&
        slotHour >= startHour &&
        slotHour < endHour
      );
    });
  };

  // Is this the first slot of a multi-hour reservation?
  const isFirstSlot = (reservation, timeSlot) => {
    return reservation?.startTime === timeSlot;
  };

  // Reservation height in time slots
  const getReservationSpan = (reservation) => {
    const startHour = parseInt(reservation.startTime.split(":")[0]);
    const endHour = parseInt(reservation.endTime.split(":")[0]);
    return Math.max(1, endHour - startHour);
  };

  // Status-based HSL styles
  const getStatusStyle = (status) => {
    const base = {
      borderLeftWidth: "4px",
      transition: "all 0.2s",
      cursor: "pointer",
    };

    switch (status) {
      case "scheduled":
        return {
          ...base,
          backgroundColor: "hsl(199 89% 48% / 0.8)",
          borderColor: "hsl(199 89% 48%)",
          color: "white",
        };
      case "in-progress":
        return {
          ...base,
          backgroundColor: "hsl(38 92% 50% / 0.8)",
          borderColor: "hsl(38 92% 50%)",
          color: "white",
        };
      case "completed":
        return {
          ...base,
          backgroundColor: "hsl(142 76% 36% / 0.8)",
          borderColor: "hsl(142 76% 36%)",
          color: "white",
        };
      case "cancelled":
        return {
          ...base,
          backgroundColor: "hsl(0 84% 60% / 0.8)",
          borderColor: "hsl(0 84% 60%)",
          color: "white",
        };
      default:
        return {
          ...base,
          backgroundColor: "hsl(222 30% 20%)",
          borderColor: "hsl(215 20% 65%)",
          color: "hsl(210 40% 98%)",
        };
    }
  };

  const handleReservationClick = (reservation) => {
    setSelectedReservation(reservation);
    setDetailModalOpen(true);
  };

  const navigateWeek = (direction) => {
    setSelectedDate((prev) => addDays(prev, direction === "next" ? 7 : -7));
  };

  const handleEditReservation = (reservation) => {
    setEditingReservation(reservation);
    setCreateModalOpen(true);
  };

  const handleCreateModalClose = (open) => {
    setCreateModalOpen(open);
    if (!open) setEditingReservation(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ type: "spring", duration: 0.6 }}
      className="space-y-6"
    >
      {/* Calendar Header */}
      <Card
        className="bg-[hsl(222_47%_9%)]"
        style={{
          border: "1px solid hsl(222 30% 22%)", // --border
        }}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: "hsl(38 92% 50% / 0.2)" }}
              >
                <CalendarIcon
                  className="w-5 h-5"
                  style={{ color: "hsl(38 92% 50%)" }}
                />
              </div>
              <span style={{ color: "hsl(210 40% 98%)" }}>
                Workload Calendar
              </span>
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateWeek("prev")}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span
                  className="text-sm font-medium min-w-[180px] text-center"
                  style={{ color: "hsl(210 40% 98%)" }}
                >
                  {format(weekStart, "MMM d")} -{" "}
                  {format(addDays(weekStart, 6), "MMM d, yyyy")}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateWeek("next")}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              {onCreateReservation && (
                <Button
                  onClick={() => setCreateModalOpen(true)}
                  className="gap-2"
                  style={{
                    backgroundColor: "hsl(38 92% 50%)",
                    color: "hsl(222 47% 11%)",
                  }}
                >
                  <Plus className="w-4 h-4" />
                  New Reservation
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Week Day Selector */}
          <div className="grid grid-cols-7 gap-2 mb-6">
            {weekDays.map((day) => {
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const dayReservations = reservations.filter((res) =>
                isSameDay(new Date(res.date), day)
              );

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`p-3 rounded-lg text-center transition-all ${
                    isToday && !isSelected ? "ring-2" : ""
                  }`}
                  style={{
                    backgroundColor: isSelected
                      ? "hsl(38 92% 50%)" // --primary
                      : "hsl(222 47% 18% / 0.5)", // --secondary/50
                    color: isSelected
                      ? "hsl(222 47% 11%)" // --primary-foreground
                      : "hsl(210 40% 98%)", // --foreground
                    boxShadow: isSelected
                      ? "0 4px 12px hsl(38 92% 50% / 0.3)"
                      : "none",
                    ringColor:
                      isToday && !isSelected
                        ? "hsl(38 92% 50% / 0.5)"
                        : "transparent",
                  }}
                >
                  <p
                    className="text-xs mb-1"
                    style={{
                      color: isSelected
                        ? "hsl(222 47% 11% / 0.8)"
                        : "hsl(215 20% 65%)",
                    }}
                  >
                    {format(day, "EEE")}
                  </p>
                  <p className="text-lg font-bold">{format(day, "d")}</p>
                  {dayReservations.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="mt-1 text-xs"
                      style={{
                        backgroundColor: isSelected
                          ? "hsl(222 47% 11% / 0.2)"
                          : "hsl(38 92% 50% / 0.2)",
                        color: isSelected
                          ? "hsl(222 47% 11%)"
                          : "hsl(38 92% 50%)",
                        border: "none",
                      }}
                    >
                      {dayReservations.length}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          {/* Daily Schedule Grid */}
          <div
            className="rounded-lg overflow-hidden"
            style={{ border: "1px solid hsl(222 30% 22%)" }}
          >
            <ScrollArea className="h-[500px]">
              <div className="min-w-[800px]">
                {/* Header Row */}
                <div
                  className="grid grid-cols-[80px_1fr] sticky top-0 z-10"
                  style={{ backgroundColor: "hsl(222 47% 18% / 0.5)" }} // --secondary/50
                >
                  <div
                    className="p-3 border-r border-b text-center"
                    style={{ borderColor: "hsl(222 30% 22%)" }}
                  >
                    <Clock
                      className="w-4 h-4 mx-auto"
                      style={{ color: "hsl(215 20% 65%)" }}
                    />
                  </div>
                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: `repeat(${workers.length}, 1fr)`,
                    }}
                  >
                    {workers.map((worker) => (
                      <div
                        key={worker.id}
                        className="p-3 border-r border-b last:border-r-0 text-center"
                        style={{ borderColor: "hsl(222 30% 22%)" }}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{
                              backgroundColor: "hsl(38 92% 50% / 0.2)",
                              color: "hsl(38 92% 50%)",
                            }}
                          >
                            {worker.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div className="text-left">
                            <p
                              className="text-sm font-medium"
                              style={{ color: "hsl(210 40% 98%)" }}
                            >
                              {worker.name?.split(" ")[0]}
                            </p>
                            <p
                              className="text-xs"
                              style={{ color: "hsl(215 20% 65%)" }}
                            >
                              {worker.specialty}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Time Slots */}
                {TIME_SLOTS.map((timeSlot) => (
                  <div key={timeSlot} className="grid grid-cols-[80px_1fr]">
                    <div
                      className="p-3 border-r border-b text-center"
                      style={{
                        borderColor: "hsl(222 30% 22%)",
                        color: "hsl(215 20% 65%)",
                      }}
                    >
                      <span className="text-sm">{timeSlot}</span>
                    </div>
                    <div
                      className="grid"
                      style={{
                        gridTemplateColumns: `repeat(${workers.length}, 1fr)`,
                      }}
                    >
                      {workers.map((worker) => {
                        const reservation = getReservationForSlot(
                          worker,
                          timeSlot
                        );
                        const showReservation =
                          reservation && isFirstSlot(reservation, timeSlot);
                        const isOccupied = reservation && !showReservation;

                        return (
                          <div
                            key={`${worker.id}-${timeSlot}`}
                            className={`border-r border-b last:border-r-0 min-h-[60px] p-1 ${
                              isOccupied ? "" : ""
                            }`}
                            style={{
                              borderColor: "hsl(222 30% 22%)",
                              backgroundColor: isOccupied
                                ? "transparent"
                                : "hsl(222 47% 11%)", // --background
                            }}
                          >
                            {showReservation && (
                              <button
                                onClick={() =>
                                  handleReservationClick(reservation)
                                }
                                style={{
                                  ...getStatusStyle(reservation.status),
                                  width: "100%",
                                  textAlign: "left",
                                  padding: "0.5rem",
                                  borderRadius: "0.375rem",
                                  height: `100px`,
                                  display: "flex",
                                  flexDirection: "column",
                                }}
                              >
                                <p className="font-medium text-xs truncate">
                                  {reservation.serviceType}
                                </p>
                                <div className="flex items-center gap-1 mt-1">
                                  <User className="w-3 h-3" />
                                  <span className="text-xs truncate">
                                    {reservation.client?.name || "—"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Car className="w-3 h-3" />
                                  <span className="text-xs truncate">
                                    {reservation.car?.make || ""}{" "}
                                    {reservation.car?.model || ""}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3 h-3" />
                                  <span className="text-xs truncate">
                                    {reservation.client?.phone || "—"}
                                  </span>
                                </div>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            {[
              { label: "Scheduled", color: "hsl(199 89% 48%)" },
              { label: "In Progress", color: "hsl(38 92% 50%)" },
              { label: "Completed", color: "hsl(142 76% 36%)" },
              { label: "Cancelled", color: "hsl(0 84% 60%)" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-xs" style={{ color: "hsl(215 20% 65%)" }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reservation Detail Modal */}
      {selectedReservation && (
        <ReservationDetailModal
          reservation={selectedReservation}
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          onEdit={onUpdateReservation ? handleEditReservation : undefined}
          onCancel={onCancelReservation}
        />
      )}

      {/* Create/Edit Reservation Modal */}
      {(onCreateReservation || onUpdateReservation) && (
        <CreateReservationModal
          open={createModalOpen}
          onOpenChange={handleCreateModalClose}
          workers={workers}
          onCreateReservation={
            onCreateReservation ||
            (() => {
              console.warn("onCreateReservation not provided");
            })
          }
          onUpdateReservation={onUpdateReservation}
          editingReservation={editingReservation}
        />
      )}
    </motion.div>
  );
}
