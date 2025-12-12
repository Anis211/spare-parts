import WorkersTable from "./WorkersTable";
import DotWave from "@/components/custom/DotWave";
import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { motion } from "framer-motion";

const Workers = () => {
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState(null);

  useEffect(() => {
    const worker = async () => {
      try {
        const res = await fetch("/api/worker?isWorker=true", {
          method: "GET",
        });

        const worker = await res.json();
        console.log("Workers Data: ", worker.workers);

        setWorkers(worker.workers);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    workers == null && worker();
  }, [setWorkers]);

  if (loading) {
    return <DotWave />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, type: "spring" }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-[hsl(45_100%_51%)]/10 flex items-center justify-center">
          <Users className="h-6 w-6 text-[hsl(45_100%_51%)]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[hsl(45_100%_95%)]">
            Delivery Workers
          </h1>
          <p className="text-[hsl(220_20%_70%)]">
            Manage worker salaries and deliveries
          </p>
        </div>
      </div>

      <WorkersTable workers={workers} />
    </motion.div>
  );
};

export default Workers;
