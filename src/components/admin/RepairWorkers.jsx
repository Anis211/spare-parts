"use client";
import { useState } from "react";
import { Users, Calendar } from "lucide-react";
import { mockWorkers } from "@/data/mockWorkers";
import { mockReservations } from "@/data/mockReservations";
import { WorkersList } from "@/components/admin/repairWorkers_components/workers/WorkersList";
import { WorkloadCalendar } from "@/components/admin/repairWorkers_components/calendar/WorkloadCalendar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/admin/ui/repair/tabs";
import { toast } from "sonner";

const RepairWorkers = () => {
  const [workers, setWorkers] = useState(mockWorkers);
  const [deletedWorkers, setDeletedWorkers] = useState([]);
  const [reservations, setReservations] = useState(mockReservations);

  const handleCreateReservation = (reservationData) => {
    const newReservation = {
      ...reservationData,
      id: `res-${Date.now()}`,
    };
    setReservations((prev) => [...prev, newReservation]);
    toast.success(`Reservation created for ${reservationData.client.name}`);
  };

  const handleUpdateReservation = (updatedReservation) => {
    setReservations((prev) =>
      prev.map((res) =>
        res.id === updatedReservation.id ? updatedReservation : res
      )
    );
    toast.success(`Reservation updated for ${updatedReservation.client.name}`);
  };

  const handleCancelReservation = (reservationId) => {
    setReservations((prev) =>
      prev.map((res) =>
        res.id === reservationId ? { ...res, status: "cancelled" } : res
      )
    );
    toast.success("Reservation cancelled");
  };

  const handleAddPayment = (workerId, amount, description) => {
    setWorkers((prev) =>
      prev.map((worker) => {
        if (worker.id === workerId) {
          const newPayment = {
            id: `p${Date.now()}`,
            amount,
            date: new Date().toISOString(),
            description,
          };
          return {
            ...worker,
            totalPaid: (worker.totalPaid || 0) + amount,
            payments: [...(worker.payments || []), newPayment],
          };
        }
        return worker;
      })
    );

    const worker = workers.find((w) => w.id === workerId);
    toast.success(`Payment of $${amount} recorded for ${worker?.name}`);
  };

  const handleRemoveWorker = (workerId, type, reason, returnDate) => {
    const worker = workers.find((w) => w.id === workerId);
    if (!worker) return;

    setDeletedWorkers((prev) => [
      ...prev,
      {
        worker,
        deletedAt: new Date().toISOString(),
        deletionType: type,
        reason: reason || undefined,
        expectedReturnDate: returnDate,
      },
    ]);

    setWorkers((prev) => prev.filter((w) => w.id !== workerId));

    toast.success(
      type === "temporary"
        ? `${worker.name} has been temporarily removed`
        : `${worker.name} has been permanently removed`
    );
  };

  const handleRestoreWorker = (workerId) => {
    const deletedEntry = deletedWorkers.find((d) => d.worker.id === workerId);
    if (!deletedEntry) return;

    setWorkers((prev) => [...prev, deletedEntry.worker]);
    setDeletedWorkers((prev) => prev.filter((d) => d.worker.id !== workerId));

    toast.success(`${deletedEntry.worker.name} has been restored`);
  };

  const handlePermanentDelete = (workerId) => {
    const deletedEntry = deletedWorkers.find((d) => d.worker.id === workerId);
    if (!deletedEntry) return;

    setDeletedWorkers((prev) => prev.filter((d) => d.worker.id !== workerId));
    toast.success(`${deletedEntry.worker.name} has been permanently deleted`);
  };

  return (
    <div className="min-h-screen bg-[hsl(222_47%_6%)]">
      {/* Main Content */}
      <main className="mx-auto px-4 py-6">
        <Tabs defaultValue="workers" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="workers" className="gap-2">
              <Users className="w-4 h-4" />
              Workers
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="w-4 h-4" />
              Calendar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workers">
            <WorkersList
              workers={workers}
              deletedWorkers={deletedWorkers}
              onAddPayment={handleAddPayment}
              onRemoveWorker={handleRemoveWorker}
              onRestoreWorker={handleRestoreWorker}
              onPermanentDelete={handlePermanentDelete}
            />
          </TabsContent>

          <TabsContent value="calendar">
            <WorkloadCalendar
              reservations={reservations}
              workers={workers}
              onCreateReservation={handleCreateReservation}
              onUpdateReservation={handleUpdateReservation}
              onCancelReservation={handleCancelReservation}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default RepairWorkers;
