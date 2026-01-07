import {
  DollarSign,
  TrendingUp,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Car,
} from "lucide-react";
import { Button } from "@/components/repair/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const workHistory = [
  {
    id: 1,
    clientName: "John Smith",
    carModel: "Tesla Model 3",
    serviceType: "Brake Replacement",
    date: "2026-01-04",
    amount: 450,
  },
  {
    id: 2,
    clientName: "Sarah Williams",
    carModel: "BMW 330i",
    serviceType: "Oil Change",
    date: "2026-01-03",
    amount: 120,
  },
  {
    id: 3,
    clientName: "David Chen",
    carModel: "Honda Accord",
    serviceType: "Tire Rotation",
    date: "2026-01-02",
    amount: 80,
  },
  {
    id: 4,
    clientName: "Maria Garcia",
    carModel: "Toyota Prius",
    serviceType: "Battery Diagnostic",
    date: "2026-01-01",
    amount: 150,
  },
  {
    id: 5,
    clientName: "Michael Johnson",
    carModel: "Ford F-150",
    serviceType: "Transmission Repair",
    date: "2025-12-30",
    amount: 800,
  },
  {
    id: 6,
    clientName: "Emily Brown",
    carModel: "Chevrolet Malibu",
    serviceType: "AC Repair",
    date: "2025-12-28",
    amount: 350,
  },
];

const withdrawals = [
  {
    id: 1,
    date: "2026-01-01",
    amount: 1500,
    status: "completed",
    method: "Bank Transfer",
  },
  {
    id: 2,
    date: "2025-12-15",
    amount: 2000,
    status: "completed",
    method: "Bank Transfer",
  },
  {
    id: 3,
    date: "2025-12-01",
    amount: 1800,
    status: "completed",
    method: "Bank Transfer",
  },
];

const totalEarned = workHistory.reduce((sum, item) => sum + item.amount, 0);
const totalWithdrawn = withdrawals.reduce((sum, item) => sum + item.amount, 0);
const availableBalance = totalEarned + 3500 - totalWithdrawn;

export default function Earnings() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: "spring" }}
      className="mx-6 mt-4 mb-10 space-y-8"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-[hsl(220_15%_20%)] bg-[hsl(220_18%_12%)] p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(43_96%_56%)/0.1]">
                <Wallet className="h-6 w-6 text-[hsl(43_96%_56%)]" />
              </div>
              <div>
                <p className="text-sm text-[hsl(220_10%_55%)]">
                  Available Balance
                </p>
                <p
                  className="text-2xl font-bold"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, hsl(43 96% 56%), hsl(35 100% 45%))",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  ${availableBalance.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[hsl(220_15%_20%)] bg-[hsl(220_18%_12%)] p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(142_76%_36%)/0.1]">
                <TrendingUp className="h-6 w-6 text-[hsl(142_76%_36%)]" />
              </div>
              <div>
                <p className="text-sm text-[hsl(220_10%_55%)]">
                  Total Earned (This Month)
                </p>
                <p className="text-2xl font-bold text-[hsl(45_10%_95%)]">
                  ${totalEarned.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[hsl(220_15%_20%)] bg-[hsl(220_18%_12%)] p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(220_15%_18%)]">
                <DollarSign className="h-6 w-6 text-[hsl(220_10%_55%)]" />
              </div>
              <div>
                <p className="text-sm text-[hsl(220_10%_55%)]">
                  Total Withdrawn
                </p>
                <p className="text-2xl font-bold text-[hsl(45_10%_95%)]">
                  ${totalWithdrawn.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Withdraw Button */}
        <div className="flex justify-end">
          <Button
            variant="glow"
            size="lg"
            style={{
              boxShadow: "0 0 20px hsl(43 96% 56% / 0.3)",
            }}
          >
            <ArrowUpRight className="h-5 w-5" />
            Withdraw Funds
          </Button>
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Work History */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[hsl(45_10%_95%)]">
              Work History
            </h3>
            <div className="rounded-xl border border-[hsl(220_15%_20%)] bg-[hsl(220_18%_12%)] divide-y divide-[hsl(220_15%_20%)]">
              {workHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(142_76%_36%)/0.1]">
                      <Car className="h-5 w-5 text-[hsl(142_76%_36%)]" />
                    </div>
                    <div>
                      <div className="font-medium text-[hsl(45_10%_95%)]">
                        {item.serviceType}
                      </div>
                      <div className="text-sm text-[hsl(220_10%_55%)]">
                        {item.clientName} • {item.carModel}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-[hsl(142_76%_36%)]">
                      +${item.amount}
                    </div>
                    <div className="text-xs text-[hsl(220_10%_55%)]">
                      {item.date}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Withdrawal History */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[hsl(45_10%_95%)]">
              Withdrawal History
            </h3>
            <div className="rounded-xl border border-[hsl(220_15%_20%)] bg-[hsl(220_18%_12%)] divide-y divide-[hsl(220_15%_20%)]">
              {withdrawals.length > 0 ? (
                withdrawals.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(220_15%_18%)]">
                        <ArrowDownLeft className="h-5 w-5 text-[hsl(220_10%_55%)]" />
                      </div>
                      <div>
                        <div className="font-medium text-[hsl(45_10%_95%)]">
                          {item.method}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3 w-3" />
                          <span className="text-[hsl(220_10%_55%)]">
                            {item.date}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-[hsl(45_10%_95%)]">
                        -${item.amount.toLocaleString()}
                      </div>
                      <span
                        className={cn(
                          "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                          item.status === "completed"
                            ? "bg-[hsl(142_76%_36%)/0.1] text-[hsl(142_76%_36%)]"
                            : "bg-[hsl(43_96%_56%)/0.1] text-[hsl(43_96%_56%)]"
                        )}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-[hsl(220_10%_55%)]">
                  No withdrawals yet
                </div>
              )}
            </div>

            {/* Summary Card */}
            <div className="rounded-xl border border-[hsl(220_15%_20%)] bg-[hsl(220_18%_12%)] p-4">
              <h4 className="mb-3 font-medium text-[hsl(45_10%_95%)]">
                Balance Summary
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[hsl(220_10%_55%)]">
                    Previous Balance
                  </span>
                  <span className="text-[hsl(45_10%_95%)]">$3,500.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[hsl(220_10%_55%)]">
                    + Earnings This Month
                  </span>
                  <span className="text-[hsl(142_76%_36%)]">
                    +${totalEarned.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[hsl(220_10%_55%)]">
                    - Total Withdrawn
                  </span>
                  <span className="text-[hsl(45_10%_95%)]">
                    -${totalWithdrawn.toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-[hsl(220_15%_20%)] pt-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-[hsl(45_10%_95%)]">
                      Available Balance
                    </span>
                    <span
                      className="font-bold"
                      style={{
                        backgroundImage:
                          "linear-gradient(135deg, hsl(43 96% 56%), hsl(35 100% 45%))",
                        backgroundClip: "text",
                        color: "transparent",
                      }}
                    >
                      ${availableBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
