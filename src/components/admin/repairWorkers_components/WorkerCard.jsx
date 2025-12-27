"use client";
import { useState } from "react";
import { Phone, Wrench, DollarSign, Minus, History } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/admin/ui/repair/card";
import { Button } from "@/components/admin/ui/repair/button";
import { Badge } from "@/components/admin/ui/repair/badge";
import { PaymentModal } from "./PaymentModal";
import { PaymentHistoryModal } from "./PaymentHistoryModal";
import { WorkerStatsModal } from "./WorkerStatsModal";
import { WorkHistoryModal } from "./WorkHistoryModal";

export function WorkerCard({ worker, onAddPayment }) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showWorkHistoryModal, setShowWorkHistoryModal] = useState(false);

  const balance = worker.totalEarned - worker.totalPaid;
  const currentMonthTotal = worker.currentMonthWorks.reduce(
    (sum, work) => sum + work.laborCost,
    0
  );
  const completedWorks = worker.currentMonthWorks.filter(
    (w) => w.status === "completed"
  ).length;

  // Safe avatar fallback: first letter of name, uppercase
  const avatarInitial = worker.name ? worker.name.charAt(0).toUpperCase() : "?";

  return (
    <>
      <Card
        className="border-2 border-[hsl(222_30%_22%)] hover:border-[hsl(38_92%_50%)]/70 bg-[hsl(222_47%_9%)] transition-all duration-300 group cursor-pointer"
        onClick={() => setShowWorkHistoryModal(true)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-semibold"
                style={{
                  backgroundColor: "hsl(38 92% 50% / 0.2)",
                  color: "hsl(38 92% 50%)",
                }}
              >
                {avatarInitial}
              </div>
              <div>
                <h3 className="font-semibold text-[hsl(210_40%_98%)] group-hover:text-[hsl(38_92%_50%)] transition-colors">
                  {worker.name}
                </h3>
                <p className="text-sm text-[hsl(215_20%_65%)] flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {worker.phone}
                </p>
              </div>
            </div>
            <Badge
              variant="secondary"
              className="border-0"
              style={{
                backgroundColor: "hsl(38 92% 50% / 0.1)",
                color: "hsl(38 92% 50%)",
              }}
            >
              <Wrench className="w-3 h-3 mr-1" />
              {worker.specialty}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Balance Display */}
          <div className="bg-gradient-to-r from-[hsl(38_92%_50%_/_0.15)] to-[hsl(38_92%_50%_/_0.05)] rounded-lg p-4 border border-[hsl(38_92%_50%)]/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[hsl(215_20%_65%)]">
                Current Balance
              </span>
              <DollarSign className="w-4 h-4 text-[hsl(38_92%_50%)]" />
            </div>
            <div className="text-3xl font-bold text-[hsl(38_92%_50%)]">
              ${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="flex justify-between text-xs text-[hsl(215_20%_65%)] mt-2">
              <span>Earned: ${worker.totalEarned.toLocaleString()}</span>
              <span>Paid: ${worker.totalPaid.toLocaleString()}</span>
            </div>
          </div>

          {/* Current Month Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-lg p-3"
              style={{ backgroundColor: "hsl(222 47% 18% / 0.5)" }}
            >
              <p className="text-xs text-[hsl(215_20%_65%)]">This Month</p>
              <p className="text-lg font-semibold text-[hsl(210_40%_98%)]">
                ${currentMonthTotal.toFixed(2)}
              </p>
            </div>
            <div
              className="rounded-lg p-3"
              style={{ backgroundColor: "hsl(222 47% 18% / 0.5)" }}
            >
              <p className="text-xs text-[hsl(215_20%_65%)]">Jobs Done</p>
              <p className="text-lg font-semibold text-[hsl(210_40%_98%)]">
                {completedWorks}/{worker.currentMonthWorks.length}
              </p>
            </div>
          </div>

          {/* Recent Works Preview */}
          <div>
            <p className="text-xs text-[hsl(215_20%_65%)] mb-2">Recent Work</p>
            <div className="space-y-1.5">
              {worker.currentMonthWorks.slice(0, 2).map((work) => {
                let statusColor = "hsl(215 20% 65%)";
                let statusBorderColor = "hsl(215 20% 65%)";
                if (work.status === "completed") {
                  statusColor = "hsl(142 76% 36%)";
                  statusBorderColor = "hsl(142 76% 36%)";
                } else if (work.status === "in-progress") {
                  statusColor = "hsl(38 92% 50%)";
                  statusBorderColor = "hsl(38 92% 50%)";
                }

                return (
                  <div
                    key={work.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-[hsl(210_40%_98%)] truncate flex-1">
                      {work.title}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className="font-medium"
                        style={{ color: "hsl(38 92% 50%)" }}
                      >
                        ${work.laborCost}
                      </span>
                      <Badge
                        variant="outline"
                        className="border"
                        style={{
                          borderColor: statusBorderColor,
                          color: statusColor,
                        }}
                      >
                        {work.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              style={{
                backgroundColor: "hsl(38 92% 50%)",
                color: "hsl(222 47% 11%)",
              }}
              onClick={() => setShowPaymentModal(true)}
            >
              <Minus className="w-4 h-4 mr-1" />
              Pay
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              style={{
                backgroundColor: "hsl(222 47% 18%)",
                color: "hsl(210 40% 98%)",
                border: "1px solid hsl(222 30% 22%)",
              }}
              onClick={() => setShowHistoryModal(true)}
            >
              <History className="w-4 h-4 mr-1" />
              History
            </Button>
            <Button
              variant="outline"
              size="sm"
              style={{
                color: "hsl(210 40% 98%)",
                border: "1px solid hsl(222 30% 22%)",
              }}
              onClick={() => setShowStatsModal(true)}
            >
              Stats
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {showPaymentModal && (
        <PaymentModal
          open={true}
          onClose={() => setShowPaymentModal(false)}
          worker={worker}
          onSubmit={(amount, description) => {
            onAddPayment(worker.id, amount, description);
            setShowPaymentModal(false);
          }}
        />
      )}

      {showHistoryModal && (
        <PaymentHistoryModal
          open={true}
          onClose={() => setShowHistoryModal(false)}
          worker={worker}
        />
      )}

      {showStatsModal && (
        <WorkerStatsModal
          open={true}
          onClose={() => setShowStatsModal(false)}
          worker={worker}
        />
      )}

      {showWorkHistoryModal && (
        <WorkHistoryModal
          open={true}
          onClose={() => setShowWorkHistoryModal(false)}
          worker={worker}
        />
      )}
    </>
  );
}
