"use client";
import { Users, DollarSign, Briefcase, TrendingUp } from "lucide-react";
import { WorkerCard } from "./WorkerCard";
import { Card, CardContent } from "@/components/admin/ui/repair/card";

export function WorkersList({ workers, onAddPayment }) {
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
      color: "text-[hsl(199_89%_48%)]",
      bg: "bg-[hsl(222_47%_18%)]",
    },
    {
      label: "Outstanding Balance",
      value: `$${totalBalance.toLocaleString()}`,
      icon: DollarSign,
      color: "text-[hsl(38_92%_50%)]",
      bg: "bg-[hsl(222_47%_18%)]",
    },
    {
      label: "Jobs Completed",
      value: totalJobs,
      icon: Briefcase,
      color: "text-[hsl(142_76%_36%)]",
      bg: "bg-[hsl(222_47%_18%)]",
    },
    {
      label: "Avg. Earnings",
      value: `$${avgEarning.toLocaleString("en-US", {
        maximumFractionDigits: 0,
      })}`,
      icon: TrendingUp,
      color: "text-[hsl(280_65%_60%)]",
      bg: "bg-[hsl(222_47%_18%)]",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-[hsl(222_47%_9%)]">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[hsl(215_20%_65%)]">
                    {stat.label}
                  </p>{" "}
                  <p className="text-xl font-bold text-[hsl(210_40%_98%)]">
                    {stat.value}
                  </p>{" "}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-3 gap-6">
        {workers.map((worker) => (
          <WorkerCard
            key={worker.id}
            worker={worker}
            onAddPayment={onAddPayment}
          />
        ))}
      </div>
    </div>
  );
}
