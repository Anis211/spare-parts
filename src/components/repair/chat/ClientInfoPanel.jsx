import { Phone, Car, FileText, Wrench, User, Calendar } from "lucide-react";
import { Button } from "@/components/repair/ui/button";
import { cn } from "@/lib/utils";

export function ClientInfoPanel({ client, onCallCustomer, onStartRepair }) {
  return (
    <div
      className="w-full max-w-md rounded-xl border overflow-hidden shadow-lg"
      style={{
        borderColor: "hsl(220 15% 20%)",
        backgroundColor: "hsl(220 18% 12%)",
      }}
    >
      {/* Header */}
      <div
        className="p-4 border-b"
        style={{
          backgroundColor: "hsl(43 96% 56% / 0.1)",
          borderColor: "hsl(220 15% 20%)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold"
            style={{
              backgroundColor: "hsl(43 96% 56% / 0.2)",
              color: "hsl(43 96% 56%)",
            }}
          >
            {client.clientName
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: "hsl(45 10% 95%)" }}>
              {client.clientName}
            </h3>
            <div
              className="flex items-center gap-1.5 text-sm"
              style={{ color: "hsl(220 10% 55%)" }}
            >
              <Phone className="h-3.5 w-3.5" />
              {client.phone}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Appointment Time */}
        <div
          className="flex items-center gap-3 rounded-lg p-3"
          style={{ backgroundColor: "hsl(220 15% 18% / 0.5)" }}
        >
          <Calendar
            className="h-5 w-5 shrink-0"
            style={{ color: "hsl(43 96% 56%)" }}
          />
          <div>
            <div className="text-xs" style={{ color: "hsl(220 10% 55%)" }}>
              Scheduled
            </div>
            <div
              className="text-sm font-medium"
              style={{ color: "hsl(45 10% 95%)" }}
            >
              {client.date} at {client.time}
            </div>
          </div>
          <span
            className="ml-auto inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: "hsl(43 96% 56% / 0.2)",
              color: "hsl(43 96% 56%)",
            }}
          >
            {client.serviceType}
          </span>
        </div>

        {/* Vehicle Info */}
        <div className="space-y-2">
          <h4
            className="flex items-center gap-2 text-sm font-medium"
            style={{ color: "hsl(45 10% 95%)" }}
          >
            <Car className="h-4 w-4" style={{ color: "hsl(43 96% 56%)" }} />
            Vehicle
          </h4>
          <div
            className="grid grid-cols-2 gap-2 rounded-lg p-3 text-sm"
            style={{ backgroundColor: "hsl(220 15% 18% / 0.3)" }}
          >
            <div>
              <div className="text-xs" style={{ color: "hsl(220 10% 55%)" }}>
                Model
              </div>
              <div className="font-medium" style={{ color: "hsl(45 10% 95%)" }}>
                {client.carYear} {client.carModel}
              </div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "hsl(220 10% 55%)" }}>
                Plate
              </div>
              <div className="font-medium" style={{ color: "hsl(45 10% 95%)" }}>
                {client.licensePlate}
              </div>
            </div>
            {client.mileage && (
              <div>
                <div className="text-xs" style={{ color: "hsl(220 10% 55%)" }}>
                  Mileage
                </div>
                <div
                  className="font-medium"
                  style={{ color: "hsl(45 10% 95%)" }}
                >
                  {client.mileage}
                </div>
              </div>
            )}
            <div className={cn(client.mileage ? "" : "col-span-2")}>
              <div className="text-xs" style={{ color: "hsl(220 10% 55%)" }}>
                VIN
              </div>
              <div
                className="font-mono text-xs"
                style={{ color: "hsl(45 10% 95%)" }}
              >
                {client.vin}
              </div>
            </div>
          </div>
        </div>

        {/* Current Notes */}
        {client.notes && (
          <div className="space-y-2">
            <h4
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: "hsl(45 10% 95%)" }}
            >
              <FileText
                className="h-4 w-4"
                style={{ color: "hsl(43 96% 56%)" }}
              />
              Service Notes
            </h4>
            <p
              className="rounded-lg p-3 text-sm"
              style={{
                backgroundColor: "hsl(220 15% 18% / 0.3)",
                color: "hsl(220 10% 55%)",
              }}
            >
              {client.notes}
            </p>
          </div>
        )}

        {/* Previous Repairs */}
        {client.previousRepairs && client.previousRepairs.length > 0 && (
          <div className="space-y-2">
            <h4
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: "hsl(45 10% 95%)" }}
            >
              <Wrench
                className="h-4 w-4"
                style={{ color: "hsl(43 96% 56%)" }}
              />
              Previous Repairs
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto repair-scrollbar">
              {client.previousRepairs.map((repair, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg p-2.5 text-sm"
                  style={{ backgroundColor: "hsl(220 15% 18% / 0.3)" }}
                >
                  <div>
                    <div
                      className="font-medium"
                      style={{ color: "hsl(45 10% 95%)" }}
                    >
                      {repair.serviceType}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: "hsl(220 10% 55%)" }}
                    >
                      {repair.date} • {repair.mileage}
                    </div>
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "hsl(220 10% 55%)" }}
                  >
                    {repair.workerName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Worker Notes */}
        {client.workerNotes && client.workerNotes.length > 0 && (
          <div className="space-y-2">
            <h4
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: "hsl(45 10% 95%)" }}
            >
              <User className="h-4 w-4" style={{ color: "hsl(43 96% 56%)" }} />
              Worker Notes
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto repair-scrollbar">
              {client.workerNotes.map((note, idx) => (
                <div
                  key={idx}
                  className="rounded-lg p-2.5"
                  style={{ backgroundColor: "hsl(220 15% 18% / 0.3)" }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-xs font-medium"
                      style={{ color: "hsl(43 96% 56%)" }}
                    >
                      {note.workerName}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: "hsl(220 10% 55%)" }}
                    >
                      {note.date}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: "hsl(220 10% 55%)" }}>
                    {note.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={onStartRepair}
            style={
              {
                // Ensure Button respects primary styling if needed internally;
                // if Button is unstyled or generic, you may need to pass className/style down.
              }
            }
          >
            Start Repair
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onCallCustomer}
            className="text-white"
          >
            <Phone className="h-4 w-4 mr-1" />
            Call
          </Button>
        </div>
      </div>
    </div>
  );
}
