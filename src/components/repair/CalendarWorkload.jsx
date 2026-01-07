import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Phone,
  Car,
  Clock,
  FileText,
} from "lucide-react";
import { Button } from "@/components/repair/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/repair/ui/dialog";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const mockAppointments = [
  {
    id: 1,
    clientName: "John Smith",
    phone: "+1 (555) 123-4567",
    carModel: "Tesla Model 3",
    carYear: "2023",
    licensePlate: "ABC-1234",
    vin: "5YJ3E1EA7KF000001",
    date: "2026-01-05",
    time: "09:00",
    serviceType: "Brake Replacement",
    notes:
      "Customer mentioned squeaking noise when braking. Check rotors as well.",
    status: "scheduled",
  },
  {
    id: 2,
    clientName: "Sarah Williams",
    phone: "+1 (555) 987-6543",
    carModel: "BMW 330i",
    carYear: "2022",
    licensePlate: "XYZ-5678",
    vin: "WBA8E1C55JA765432",
    date: "2026-01-05",
    time: "11:30",
    serviceType: "Oil Change",
    notes: "Regular maintenance. Use synthetic oil.",
    status: "scheduled",
  },
  {
    id: 3,
    clientName: "David Chen",
    phone: "+1 (555) 456-7890",
    carModel: "Honda Accord",
    carYear: "2021",
    licensePlate: "DEF-9012",
    vin: "1HGBH41JXMN109186",
    date: "2026-01-05",
    time: "14:00",
    serviceType: "Tire Rotation",
    notes: "Check tire pressure and alignment.",
    status: "scheduled",
  },
  {
    id: 4,
    clientName: "Maria Garcia",
    phone: "+1 (555) 234-5678",
    carModel: "Toyota Prius",
    carYear: "2020",
    licensePlate: "GHI-3456",
    vin: "JTDKN3DU5A0123456",
    date: "2026-01-05",
    time: "16:00",
    serviceType: "Battery Check",
    notes: "Hybrid battery diagnostic needed.",
    status: "scheduled",
  },
  {
    id: 5,
    clientName: "Michael Johnson",
    phone: "+1 (555) 345-6789",
    carModel: "Ford F-150",
    carYear: "2024",
    licensePlate: "JKL-7890",
    vin: "1FTFW1E50MFC12345",
    date: "2026-01-06",
    time: "08:30",
    serviceType: "Transmission Service",
    notes: "Customer reports rough shifting.",
    status: "scheduled",
  },
];

const timeSlots = [
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
];

export default function CalendarWorkload() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 5));
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
  };

  const getAppointmentsForDate = (date) => {
    const dateString = formatDate(date);
    return mockAppointments.filter((apt) => apt.date === dateString);
  };

  const getAppointmentForTimeSlot = (timeSlot) => {
    const dateAppointments = getAppointmentsForDate(currentDate);
    return dateAppointments.find((apt) => {
      const aptHour = parseInt(apt.time.split(":")[0]);
      const slotHour = parseInt(timeSlot.split(":")[0]);
      return aptHour === slotHour;
    });
  };

  const navigateDay = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date(2026, 0, 5)); // Mock "today"
  };

  const todayAppointments = getAppointmentsForDate(currentDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: "spring" }}
      className="mx-6 mt-4 mb-10 space-y-8"
    >
      <div className="space-y-4">
        {/* Calendar Header */}
        <div className="flex gap-3 flex-row items-center justify-between">
          <div>
            <h2 className="font-bold text-[hsl(45_10%_95%)] text-2xl">
              {currentDate.toLocaleDateString("en-US", { weekday: "long" })}
            </h2>
            <p className="text-md text-[hsl(220_10%_55%)]">
              {currentDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="lg" onClick={() => navigateDay(-1)}>
              <ChevronLeft className="h-5 w-5 text-white" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={goToToday}
              className="text-white"
            >
              Today
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigateDay(1)}>
              <ChevronRight className="h-5 w-5 text-white" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-3">
          <div className="bg-[hsl(220_18%_12%)]/80 backdrop-blur-sm border border-[hsl(220_15%_20%)]/50 rounded-xl flex-1 p-3">
            <div className="text-2xl font-bold text-[hsl(43_96%_56%)]">
              {todayAppointments.length}
            </div>
            <div className="text-sm text-[hsl(220_10%_55%)]">Appointments</div>
          </div>
          <div className="bg-[hsl(220_18%_12%)]/80 backdrop-blur-sm border border-[hsl(220_15%_20%)]/50 rounded-xl flex-1 p-3">
            <div className="text-2xl font-bold text-[hsl(45_10%_95%)]">
              {todayAppointments.filter((a) => a.status === "scheduled").length}
            </div>
            <div className="text-sm text-[hsl(220_10%_55%)]">Pending</div>
          </div>
        </div>

        {/* Daily Timeline */}
        <div className="bg-[hsl(220_18%_12%)]/80 backdrop-blur-sm border border-[hsl(220_15%_20%)]/50 rounded-xl overflow-hidden">
          <div className="border-b border-[hsl(220_15%_20%)] bg-[hsl(220_15%_18%)/0.3] p-3">
            <h3 className="text-md font-medium text-[hsl(45_10%_95%)]">
              Daily Schedule
            </h3>
          </div>
          <div className="divide-y divide-[hsl(220_15%_20%)]">
            {timeSlots.map((timeSlot) => {
              const appointment = getAppointmentForTimeSlot(timeSlot);

              return (
                <div
                  key={timeSlot}
                  className={cn(
                    "flex min-h-[70px] transition-colors",
                    appointment && "bg-[hsl(43_96%_56%)]/5"
                  )}
                >
                  {/* Time Label */}
                  <div className="flex shrink-0 items-start justify-center border-r border-[hsl(220_15%_20%)] p-2 text-sm font-medium text-[hsl(220_10%_55%)] w-20">
                    {timeSlot}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-2">
                    {appointment ? (
                      <button
                        onClick={() => setSelectedAppointment(appointment)}
                        className="w-full rounded-lg border border-[hsl(43_96%_56%)]/20 bg-[hsl(43_96%_56%)]/10 text-left transition-colors duration-200 hover:border-[hsl(43_96%_56%)]/40 hover:bg-[hsl(43_96%_56%)]/20 p-3"
                      >
                        <div className="flex flex-row gap-1 items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(43_96%_56%)]/20 text-sm font-semibold text-[hsl(43_96%_56%)]">
                              {appointment.clientName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-md font-medium text-[hsl(45_10%_95%)]">
                                {appointment.clientName}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-[hsl(220_10%_55%)]">
                                <Phone className="h-3 w-3 shrink-0" />
                                <span className="truncate">
                                  {appointment.phone}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="ml-0 text-right">
                            <span className="inline-block rounded-full bg-[hsl(43_96%_56%)]/20 px-2 py-0.5 text-sm font-medium text-[hsl(43_96%_56%)]">
                              {appointment.serviceType}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-1 text-sm text-[hsl(220_10%_55%)]">
                          <Car className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {appointment.carYear} {appointment.carModel} •{" "}
                            {appointment.licensePlate}
                          </span>
                        </div>
                      </button>
                    ) : (
                      <div className="flex h-full items-center justify-center text-md text-white/50">
                        Available
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Appointment Detail Modal */}
      <Dialog
        open={!!selectedAppointment}
        onOpenChange={() => setSelectedAppointment(null)}
      >
        <DialogContent className="max-w-xl bg-[hsl(220_18%_12%)] border-2 border-[hsl(220_15%_20%)]">
          <DialogHeader>
            <DialogTitle className="text-2xl text-start text-[hsl(45_10%_95%)]">
              Appointment Details
            </DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-6">
              {/* Client Info */}
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(43_96%_56%)]/10 text-2xl font-bold text-[hsl(43_96%_56%)]">
                  {selectedAppointment.clientName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[hsl(45_10%_95%)]">
                    {selectedAppointment.clientName}
                  </h3>
                  <div className="flex items-center gap-1 text-[hsl(220_10%_55%)]">
                    <Phone className="h-4 w-4" />
                    {selectedAppointment.phone}
                  </div>
                </div>
              </div>

              {/* Appointment Time */}
              <div className="flex items-center gap-3 rounded-lg bg-[hsl(220_15%_18%)] p-3">
                <Clock className="h-5 w-5 text-[hsl(43_96%_56%)]" />
                <div>
                  <div className="text-md text-[hsl(220_10%_55%)]">
                    Scheduled for
                  </div>
                  <div className="font-medium text-[hsl(45_10%_95%)]">
                    {selectedAppointment.date} at {selectedAppointment.time}
                  </div>
                </div>
              </div>

              {/* Car Info */}
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 font-medium text-[hsl(45_10%_95%)]">
                  <Car className="h-5 w-5 text-[hsl(43_96%_56%)]" />
                  Vehicle Information
                </h4>
                <div className="grid grid-cols-2 gap-3 rounded-lg bg-[hsl(220_15%_18%)]/50 p-3">
                  <div>
                    <div className="text-sm text-[hsl(220_10%_55%)]">Model</div>
                    <div className="text-md font-medium text-[hsl(45_10%_95%)]">
                      {selectedAppointment.carYear}{" "}
                      {selectedAppointment.carModel}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-[hsl(220_10%_55%)]">
                      License Plate
                    </div>
                    <div className="text-md font-medium text-[hsl(45_10%_95%)]">
                      {selectedAppointment.licensePlate}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-[hsl(220_10%_55%)]">VIN</div>
                    <div className="text-md font-mono text-[hsl(45_10%_95%)]">
                      {selectedAppointment.vin}
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Info */}
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 font-medium text-[hsl(45_10%_95%)]">
                  <FileText className="h-5 w-5 text-[hsl(43_96%_56%)]" />
                  Service Details
                </h4>
                <div className="rounded-lg bg-[hsl(220_15%_18%)]/50 p-3">
                  <div className="mb-2">
                    <span className="inline-block rounded-full bg-[hsl(43_96%_56%)]/10 px-3 py-1 text-md font-medium text-[hsl(43_96%_56%)]">
                      {selectedAppointment.serviceType}
                    </span>
                  </div>
                  <p className="text-md text-[hsl(220_10%_55%)]">
                    {selectedAppointment.notes}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button className="flex-1" variant="glow">
                  Start Repair
                </Button>
                <Button variant="outline" className="text-white/80">
                  Call Customer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
