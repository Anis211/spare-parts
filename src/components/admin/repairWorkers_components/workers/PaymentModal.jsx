"use client";
import { useState } from "react";
import { DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/repair/dialog";
import { Button } from "@/components/admin/ui/repair/button";
import { Input } from "@/components/admin/ui/repair/input";
import { Label } from "@/components/admin/ui/repair/label";
import { Textarea } from "@/components/admin/ui/repair/textarea";

export function PaymentModal({ open, onClose, worker, onSubmit }) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const balance = worker.totalEarned - worker.totalPaid;

  const handleSubmit = (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (numAmount > 0 && !isNaN(numAmount)) {
      onSubmit(numAmount, description || "Payment");
      setAmount("");
      setDescription("");
    }
  };

  const quickAmounts = [50, 100, 200, 500];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="border-[hsl(222_30%_22%)]"
        style={{ backgroundColor: "hsl(222 47% 14%)" }}
      >
        <DialogHeader>
          <DialogTitle
            className="flex items-center gap-2"
            style={{ color: "hsl(210 40% 98%)" }}
          >
            <DollarSign
              className="w-5 h-5"
              style={{ color: "hsl(38 92% 50%)" }}
            />
            Record Payment to {worker.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            className="rounded-lg p-3 flex justify-between items-center"
            style={{ backgroundColor: "hsl(222 47% 18% / 0.5)" }}
          >
            <span className="text-sm" style={{ color: "hsl(215 20% 65%)" }}>
              Available Balance
            </span>
            <span
              className="text-xl font-bold"
              style={{ color: "hsl(38 92% 50%)" }}
            >
              ${balance.toFixed(2)}
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" style={{ color: "hsl(210 40% 98%)" }}>
              Amount
            </Label>
            <div className="relative">
              <DollarSign
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "hsl(215 20% 65%)" }}
              />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={balance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9"
                style={{
                  backgroundColor: "hsl(222 47% 18%)",
                  borderColor: "hsl(222 30% 22%)",
                  color: "hsl(210 40% 98%)",
                }}
                placeholder="0.00"
              />
            </div>
            <div className="flex gap-2">
              {quickAmounts.map((qa) => (
                <Button
                  key={qa}
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setAmount(String(Math.min(qa, balance)))}
                  className="flex-1"
                >
                  ${qa}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" style={{ color: "hsl(210 40% 98%)" }}>
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="e.g., Weekly salary, Bonus, Advance..."
              className="resize-none"
              style={{
                backgroundColor: "hsl(222 47% 18%)",
                borderColor: "hsl(222 30% 22%)",
                color: "hsl(210 40% 98%)",
              }}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={
                !amount ||
                parseFloat(amount) <= 0 ||
                parseFloat(amount) > balance ||
                isNaN(parseFloat(amount))
              }
              style={{
                backgroundColor: "hsl(38 92% 50%)",
                color: "hsl(222 47% 11%)",
              }}
            >
              Record Payment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
