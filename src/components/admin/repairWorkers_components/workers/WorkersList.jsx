"use client";
import { useState } from "react";
import { Users, DollarSign, Briefcase, TrendingUp, Trash2 } from "lucide-react";
import { WorkerCard } from "./WorkerCard";
import { DeletedWorkersModal } from "./DeletedWorkersModal";
import { Card, CardContent } from "@/components/admin/ui/repair/card";
import { Button } from "@/components/admin/ui/repair/button";
import { Badge } from "@/components/admin/ui/repair/badge";
import { motion } from "framer-motion";

export function WorkersList({
  workers,
  deletedWorkers,
  onAddPayment,
  onRemoveWorker,
  onRestoreWorker,
  onPermanentDelete,
}) {
  const [showDeletedModal, setShowDeletedModal] = useState(false);

  const totalBalance = workers.reduce(
    (sum, w) => sum + (w.totalEarned - w.totalPaid),
    0
  );
  const totalEarned = workers.reduce((sum, w) => sum + w.totalEarned, 0);
  const totalJobs = workers.reduce(
    (sum, w) =>
      sum + w.currentMonthWorks.filter((j) => j.status === "completed").length,
    0
  );
  const avgEarning = workers.length > 0 ? totalEarned / workers.length : 0;

  const stats = [
    {
      label: "Total Workers",
      value: workers.length,
      icon: Users,
      color: "text-[hsl(199_89%_48%)]", // --chart-3
      bg: "bg-[hsl(222_47%_18%)]", // --secondary
    },
    {
      label: "Outstanding Balance",
      value: `$${totalBalance.toLocaleString()}`,
      icon: DollarSign,
      color: "text-[hsl(38_92%_50%)]", // --primary
      bg: "bg-[hsl(222_47%_18%)]",
    },
    {
      label: "Jobs Completed",
      value: totalJobs,
      icon: Briefcase,
      color: "text-[hsl(142_76%_36%)]", // --success
      bg: "bg-[hsl(222_47%_18%)]",
    },
    {
      label: "Avg. Earnings",
      value: `$${avgEarning.toLocaleString("en-US", {
        maximumFractionDigits: 0,
      })}`,
      icon: TrendingUp,
      color: "text-[hsl(280_65%_60%)]", // --chart-4
      bg: "bg-[hsl(222_47%_18%)]",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ type: "spring", duration: 0.6 }}
      className="space-y-6"
    >
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            // className="glass-card"
            style={{
              backgroundColor: "hsl(222 47% 14% / 0.8)", // bg-card/80 from your CSS
              backdropFilter: "blur(4px)",
              border: "1px solid hsl(222 30% 22% / 0.5)", // border-border/50
            }}
          >
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}
                  style={{
                    backgroundColor: "hsl(222 47% 18%)", // --secondary
                    color: stat.color.replace("text-[", "").replace("]", ""),
                  }}
                >
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p
                    className="text-xs"
                    style={{ color: "hsl(215 20% 65%)" }} // --muted-foreground
                  >
                    {stat.label}
                  </p>
                  <p
                    className="text-xl font-bold"
                    style={{ color: "hsl(210 40% 98%)" }} // --foreground
                  >
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Deleted Workers Button */}
      {deletedWorkers.length > 0 && (
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setShowDeletedModal(true)}
          style={{
            color: "hsl(210 40% 98%)",
            backgroundColor: "transparent",
            borderColor: "hsl(222 30% 22%)",
          }}
        >
          <Trash2 className="w-4 h-4" />
          Removed Workers
          <Badge
            variant="secondary"
            style={{
              backgroundColor: "hsl(222 47% 18%)",
              color: "hsl(210 40% 98%)",
              border: "none",
            }}
          >
            {deletedWorkers.length}
          </Badge>
        </Button>
      )}

      {/* Workers Grid */}
      <div className="grid grid-cols-3 gap-2">
        {workers.map((worker) => (
          <WorkerCard
            key={worker.id}
            worker={worker}
            onAddPayment={onAddPayment}
            onRemoveWorker={onRemoveWorker}
          />
        ))}
      </div>

      {/* Empty State */}
      {workers.length === 0 && (
        <div
          className="text-center py-12"
          style={{ color: "hsl(215 20% 65% / 0.5)" }} // --muted-foreground/50
        >
          <Users className="w-12 h-12 mx-auto mb-3" />
          <p className="mb-1">No active workers</p>
          <p className="text-sm opacity-70">All workers have been removed</p>
        </div>
      )}

      {/* Deleted Workers Modal */}
      <DeletedWorkersModal
        open={showDeletedModal}
        onClose={() => setShowDeletedModal(false)}
        deletedWorkers={deletedWorkers}
        onRestore={onRestoreWorker}
        onPermanentDelete={onPermanentDelete}
      />
    </motion.div>
  );
}
