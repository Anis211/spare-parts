"use client";
import { History, Calendar, Clock, DollarSign } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/repair/dialog";
import { ScrollArea } from "@/components/admin/ui/repair/scroll-area";

export function PaymentHistoryModal({ open, onClose, worker }) {
  const sortedPayments = [...worker.payments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalPaid = worker.payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-md"
        style={{
          backgroundColor: "hsl(222 47% 14%)",
          borderColor: "hsl(222 30% 22%)",
        }}
      >
        <DialogHeader>
          <DialogTitle
            className="flex items-center gap-2"
            style={{ color: "hsl(210 40% 98%)" }}
          >
            <History className="w-5 h-5" style={{ color: "hsl(38 92% 50%)" }} />
            Payment History - {worker.name}
          </DialogTitle>
        </DialogHeader>

        <div
          className="rounded-lg p-3 flex justify-between items-center mb-4"
          style={{ backgroundColor: "hsl(222 47% 18% / 0.5)" }}
        >
          <span className="text-sm" style={{ color: "hsl(215 20% 65%)" }}>
            Total Paid
          </span>
          <span
            className="text-xl font-bold"
            style={{ color: "hsl(38 92% 50%)" }}
          >
            ${totalPaid.toLocaleString()}
          </span>
        </div>

        <ScrollArea className="h-[300px] pr-4">
          {sortedPayments.length === 0 ? (
            <div
              className="text-center py-8"
              style={{ color: "hsl(215 20% 65%)" }}
            >
              No payments recorded yet
            </div>
          ) : (
            <div className="space-y-3">
              {sortedPayments.map((payment) => {
                const date = new Date(payment.date);
                return (
                  <div
                    key={payment.id}
                    className="rounded-lg p-3 transition-colors"
                    style={{
                      backgroundColor: "hsl(222 47% 18% / 0.3)",
                      borderColor: "hsl(222 30% 22% / 0.5)",
                      borderStyle: "solid",
                      borderWidth: "1px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor =
                        "hsl(38 92% 50% / 0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor =
                        "hsl(222 30% 22% / 0.5)";
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span
                        className="font-medium"
                        style={{ color: "hsl(210 40% 98%)" }}
                      >
                        {payment.description}
                      </span>
                      <span
                        className="font-bold flex items-center gap-1"
                        style={{ color: "hsl(38 92% 50%)" }}
                      >
                        <DollarSign className="w-4 h-4" />
                        {payment.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <span
                        className="flex items-center gap-1"
                        style={{ color: "hsl(215 20% 65%)" }}
                      >
                        <Calendar className="w-3 h-3" />
                        {format(date, "MMM dd, yyyy")}
                      </span>
                      <span
                        className="flex items-center gap-1"
                        style={{ color: "hsl(215 20% 65%)" }}
                      >
                        <Clock className="w-3 h-3" />
                        {format(date, "HH:mm")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
