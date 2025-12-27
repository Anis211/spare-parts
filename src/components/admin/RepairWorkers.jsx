"use client";
import { useState } from "react";
import { Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { mockWorkers } from "@/data/mockWorkers";
import { WorkersList } from "@/components/admin/repairWorkers_components/WorkersList";
import { Button } from "@/components/admin/ui/repair/button";
import { toast } from "sonner";

const RepairWorkers = () => {
  const [workers, setWorkers] = useState(mockWorkers);

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
            totalPaid: worker.totalPaid + amount,
            payments: [...worker.payments, newPayment],
          };
        }
        return worker;
      })
    );

    const worker = workers.find((w) => w.id === workerId);
    toast.success(`Payment of $${amount} recorded for ${worker?.name}`);
  };

  return (
    <div className="bg-transparent">
      {/* Main Content */}
      <main className="mx-auto px-4 py-6">
        <WorkersList workers={workers} onAddPayment={handleAddPayment} />
      </main>
    </div>
  );
};

export default RepairWorkers;
