"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Plus, Edit } from "lucide-react";
import { mockClients } from "@/data/mockReservations";
import { Button } from "@/components/admin/ui/repair/button";
import { Input } from "@/components/admin/ui/repair/input";
import { Label } from "@/components/admin/ui/repair/label";
import { Textarea } from "@/components/admin/ui/repair/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/admin/ui/repair/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/repair/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/admin/ui/repair/popover";
import { cn } from "@/lib/utils";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

const TIME_OPTIONS = [
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

const SERVICE_TYPES = [
  "Engine Diagnostics",
  "Oil Change",
  "Brake Inspection",
  "Tire Rotation",
  "Transmission Service",
  "Battery Replacement",
  "Full Inspection",
  "Suspension Check",
  "AC Service",
  "Wheel Alignment",
  "Other",
];

const STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export function CreateReservationModal({
  open,
  onOpenChange,
  workers,
  onCreateReservation,
  onUpdateReservation,
  editingReservation,
}) {
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedCarIndex, setSelectedCarIndex] = useState(0);
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("scheduled");

  const isEditing = !!editingReservation;

  const selectedClient = mockClients.find((c) => c.id === selectedClientId);
  const selectedWorker = workers.find((w) => w.id === selectedWorkerId);

  // Populate form when editing
  useEffect(() => {
    if (editingReservation) {
      setDate(new Date(editingReservation.date));
      setStartTime(editingReservation.startTime);
      setEndTime(editingReservation.endTime);
      setSelectedClientId(editingReservation.client.id);
      setSelectedWorkerId(editingReservation.worker.id);
      setServiceType(editingReservation.serviceType);
      setEstimatedCost(String(editingReservation.estimatedCost));
      setNotes(editingReservation.notes || "");
      setStatus(editingReservation.status);

      // Find car index
      const carIndex = editingReservation.client.cars.findIndex(
        (c) => c.vin === editingReservation.car.vin
      );
      setSelectedCarIndex(carIndex >= 0 ? carIndex : 0);
    } else {
      resetForm();
    }
  }, [editingReservation, open]);

  const resetForm = () => {
    setDate(new Date());
    setStartTime("09:00");
    setEndTime("10:00");
    setSelectedClientId("");
    setSelectedCarIndex(0);
    setSelectedWorkerId("");
    setServiceType("");
    setEstimatedCost("");
    setNotes("");
    setStatus("scheduled");
  };

  const handleSubmit = () => {
    if (!date || !selectedClient || !selectedWorker || !serviceType) return;

    const car = selectedClient.cars[selectedCarIndex] || selectedClient.cars[0];

    if (isEditing && onUpdateReservation) {
      const updatedReservation = {
        ...editingReservation,
        date: format(date, "yyyy-MM-dd"),
        startTime,
        endTime,
        client: selectedClient,
        car,
        worker: selectedWorker,
        serviceType,
        estimatedCost: parseFloat(estimatedCost) || 0,
        status,
        notes: notes || undefined,
      };
      onUpdateReservation(updatedReservation);
    } else {
      const newReservation = {
        date: format(date, "yyyy-MM-dd"),
        startTime,
        endTime,
        client: selectedClient,
        car,
        worker: selectedWorker,
        serviceType,
        estimatedCost: parseFloat(estimatedCost) || 0,
        status: "scheduled",
        notes: notes || undefined,
      };
      onCreateReservation(newReservation);
    }

    resetForm();
    onOpenChange(false);
  };

  const isFormValid =
    date &&
    selectedClientId &&
    selectedWorkerId &&
    serviceType &&
    startTime < endTime;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[95vh] overflow-y-auto p-6 border-2 border-[hsl(222_30%_22%)] bg-[hsl(222_47%_9%)]">
        <DialogHeader>
          <DialogTitle
            className="flex items-center gap-2 text-xl"
            style={{ color: "hsl(210 40% 98%)" }} // --foreground
          >
            {isEditing ? (
              <>
                <Edit
                  className="w-5 h-5"
                  style={{ color: "hsl(38 92% 50%)" }} // --primary
                />
                Edit Reservation
              </>
            ) : (
              <>
                <Plus
                  className="w-6 h-6"
                  style={{ color: "hsl(38 92% 50%)" }}
                />
                Create New Reservation
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date Picker */}
          <div className="flex flex-col gap-1 space-y-2">
            <Label htmlFor="date" className="text-md">
              Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal border-2"
                  )}
                  style={{
                    backgroundColor: "hsl(222 47% 9%)", // --secondary
                    color: date ? "hsl(210 40% 98%)" : "hsl(215 20% 65%)",
                    borderColor: "hsl(222 30% 22%)",
                  }}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0"
                align="start"
                style={{
                  backgroundColor: "hsl(222 47% 14%)",
                  border: "1px solid hsl(222 30% 22%)",
                  boxShadow: "0 4px 20px hsl(0 0% 0% / 0.3)",
                }}
              >
                <DayPicker
                  animate
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="p-4"
                  classNames={{
                    months: "text-white",
                    nav_button: cn(
                      "h-7 w-7 p-0 opacity-50 hover:opacity-100",
                      "bg-white border border-[hsl(222_30%_22%)]",
                      "text-[hsl(210_40%_98%)] hover:bg-[hsl(222_47%_14%)] hover:text-[hsl(210_40%_98%)]",
                      "rounded-md"
                    ),
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 flex flex-col gap-1">
              <Label htmlFor="start-time" className="text-md">
                Start Time
              </Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger
                  style={{
                    color: "hsl(210 40% 98%)",
                    borderColor: "hsl(222 30% 22%)",
                    borderWidth: "2px",
                    backgroundColor: "hsl(222 47% 9%)",
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  style={{
                    backgroundColor: "hsl(222 47% 14%)",
                    border: "1px solid hsl(222 30% 22%)",
                  }}
                >
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem
                      key={time}
                      value={time}
                      style={{ color: "hsl(210 40% 98%)" }}
                    >
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex flex-col gap-1">
              <Label htmlFor="end-time" className="text-md">
                End Time
              </Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger
                  style={{
                    color: "hsl(210 40% 98%)",
                    borderColor: "hsl(222 30% 22%)",
                    borderWidth: "2px",
                    backgroundColor: "hsl(222 47% 9%)",
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  style={{
                    backgroundColor: "hsl(222 47% 14%)",
                    border: "1px solid hsl(222 30% 22%)",
                  }}
                >
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem
                      key={time}
                      value={time}
                      disabled={time <= startTime}
                      style={{ color: "hsl(210 40% 98%)" }}
                    >
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Client Selection */}
          <div className="space-y-2 flex flex-col gap-1">
            <Label htmlFor="client" className="text-md">
              Client
            </Label>
            <Select
              value={selectedClientId}
              onValueChange={(value) => {
                setSelectedClientId(value);
                setSelectedCarIndex(0);
              }}
            >
              <SelectTrigger
                style={{
                  color: selectedClientId
                    ? "hsl(210 40% 98%)"
                    : "hsl(215 20% 65%)",
                  borderColor: "hsl(222 30% 22%)",
                  borderWidth: "2px",
                  backgroundColor: "hsl(222 47% 9%)",
                }}
              >
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent
                style={{
                  backgroundColor: "hsl(222 47% 14%)",
                  border: "1px solid hsl(222 30% 22%)",
                }}
              >
                {mockClients.map((client) => (
                  <SelectItem
                    key={client.id}
                    value={client.id}
                    style={{ color: "hsl(210 40% 98%)" }}
                  >
                    {client.name} - {client.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Car Selection (if client has multiple cars) */}
          {selectedClient && selectedClient.cars.length > 1 && (
            <div className="space-y-2 flex flex-col gap-1">
              <Label htmlFor="car" className="text-md">
                Car
              </Label>
              <Select
                value={String(selectedCarIndex)}
                onValueChange={(value) => setSelectedCarIndex(parseInt(value))}
              >
                <SelectTrigger
                  style={{
                    color: "hsl(210 40% 98%)",
                    borderColor: "hsl(222 30% 22%)",
                    borderWidth: "2px",
                    backgroundColor: "hsl(222 47% 9%)",
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  style={{
                    backgroundColor: "hsl(222 47% 14%)",
                    border: "1px solid hsl(222 30% 22%)",
                  }}
                >
                  {selectedClient.cars.map((car, index) => (
                    <SelectItem
                      key={index}
                      value={String(index)}
                      style={{ color: "hsl(210 40% 98%)" }}
                    >
                      {car.year} {car.make} {car.model} - {car.licensePlate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Show selected car info */}
          {selectedClient && (
            <div
              className="p-3 rounded-lg text-sm"
              style={{ backgroundColor: "hsl(222 47% 18% / 0.5)" }}
            >
              <p className="font-medium" style={{ color: "hsl(210 40% 98%)" }}>
                {selectedClient.cars[selectedCarIndex]?.year}{" "}
                {selectedClient.cars[selectedCarIndex]?.make}{" "}
                {selectedClient.cars[selectedCarIndex]?.model}
              </p>
              <p className="text-xs mt-1" style={{ color: "hsl(215 20% 65%)" }}>
                VIN: {selectedClient.cars[selectedCarIndex]?.vin}
              </p>
              <p className="text-xs" style={{ color: "hsl(215 20% 65%)" }}>
                License: {selectedClient.cars[selectedCarIndex]?.licensePlate}
              </p>
            </div>
          )}

          {/* Worker Selection */}
          <div className="space-y-2 flex flex-col gap-1">
            <Label htmlFor="worker" className="text-md">
              Assigned Worker
            </Label>
            <Select
              value={selectedWorkerId}
              onValueChange={setSelectedWorkerId}
            >
              <SelectTrigger
                style={{
                  color: selectedWorkerId
                    ? "hsl(210 40% 98%)"
                    : "hsl(215 20% 65%)",
                  borderColor: "hsl(222 30% 22%)",
                  borderWidth: "2px",
                  backgroundColor: "hsl(222 47% 9%)",
                }}
              >
                <SelectValue placeholder="Select a worker" />
              </SelectTrigger>
              <SelectContent
                style={{
                  backgroundColor: "hsl(222 47% 14%)",
                  border: "1px solid hsl(222 30% 22%)",
                }}
              >
                {workers.map((worker) => (
                  <SelectItem
                    key={worker.id}
                    value={worker.id}
                    style={{ color: "hsl(210 40% 98%)" }}
                  >
                    {worker.name} - {worker.specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Service Type */}
          <div className="space-y-2 flex flex-col gap-1">
            <Label htmlFor="service-type" className="text-md">
              Service Type
            </Label>
            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger
                style={{
                  color: serviceType ? "hsl(210 40% 98%)" : "hsl(215 20% 65%)",
                  borderColor: "hsl(222 30% 22%)",
                  borderWidth: "2px",
                  backgroundColor: "hsl(222 47% 9%)",
                }}
              >
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent
                style={{
                  backgroundColor: "hsl(222 47% 14%)",
                  border: "1px solid hsl(222 30% 22%)",
                }}
              >
                {SERVICE_TYPES.map((type) => (
                  <SelectItem
                    key={type}
                    value={type}
                    style={{ color: "hsl(210 40% 98%)" }}
                  >
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estimated Cost */}
          <div className="space-y-2 flex flex-col gap-1">
            <Label htmlFor="cost" className="text-md">
              Estimated Cost ($)
            </Label>
            <Input
              id="cost"
              type="number"
              placeholder="0.00"
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(e.target.value)}
              style={{
                color: "hsl(210 40% 98%)",
                borderColor: "hsl(222 30% 22%)",
                borderWidth: "2px",
                backgroundColor: "hsl(222 47% 9%)",
              }}
            />
          </div>

          {/* Status (only show when editing) */}
          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger
                  style={{
                    backgroundColor: "hsl(222 47% 18%)",
                    color: "hsl(210 40% 98%)",
                    borderColor: "hsl(222 30% 22%)",
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  style={{
                    backgroundColor: "hsl(222 47% 14%)",
                    border: "1px solid hsl(222 30% 22%)",
                  }}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      style={{ color: "hsl(210 40% 98%)" }}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2 flex flex-col gap-1">
            <Label htmlFor="notes" className="text-md">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={{
                color: "hsl(210 40% 98%)",
                borderColor: "hsl(222 30% 22%)",
                borderWidth: "2px",
                backgroundColor: "hsl(222 47% 9%)",
              }}
            />
          </div>
        </div>

        <DialogFooter className="flex flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            style={{
              color: "hsl(210 40% 98%)",
              backgroundColor: "transparent",
              borderColor: "hsl(222 30% 22%)",
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid}
            style={{
              backgroundColor: isFormValid
                ? "hsl(38 92% 50%)"
                : "hsl(222 30% 22%)",
              color: isFormValid ? "hsl(222 47% 11%)" : "hsl(215 20% 65%)",
            }}
          >
            {isEditing ? "Update Reservation" : "Create Reservation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
