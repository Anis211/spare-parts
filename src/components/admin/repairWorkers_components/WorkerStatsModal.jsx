"use client";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/repair/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export function WorkerStatsModal({ open, onClose, worker }) {
  const earnings = worker.monthlyEarnings || [];
  const currentMonth = earnings[earnings.length - 1]?.amount || 0;
  const previousMonth = earnings[earnings.length - 2]?.amount || 0;
  const change = previousMonth
    ? ((currentMonth - previousMonth) / previousMonth) * 100
    : 0;
  const isPositive = change >= 0;

  const avgEarning =
    earnings.length > 0
      ? earnings.reduce((sum, e) => sum + e.amount, 0) / earnings.length
      : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-lg"
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
            <BarChart3
              className="w-5 h-5"
              style={{ color: "hsl(38 92% 50%)" }}
            />
            Earnings Statistics - {worker.name}
          </DialogTitle>
        </DialogHeader>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div
            className="rounded-lg p-3"
            style={{ backgroundColor: "hsl(222 47% 18% / 0.5)" }}
          >
            <p className="text-xs mb-1" style={{ color: "hsl(215 20% 65%)" }}>
              Current Month
            </p>
            <p
              className="text-xl font-bold"
              style={{ color: "hsl(38 92% 50%)" }}
            >
              ${currentMonth.toLocaleString()}
            </p>
          </div>
          <div
            className="rounded-lg p-3"
            style={{ backgroundColor: "hsl(222 47% 18% / 0.5)" }}
          >
            <p className="text-xs mb-1" style={{ color: "hsl(215 20% 65%)" }}>
              vs Last Month
            </p>
            <p
              className="text-xl font-bold flex items-center gap-1"
              style={{
                color: isPositive ? "hsl(142 76% 36%)" : "hsl(0 84% 60%)",
              }}
            >
              {isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {Math.abs(change).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Avg Earnings */}
        <div
          className="rounded-lg p-3 mb-4"
          style={{ backgroundColor: "hsl(222 47% 18% / 0.3)" }}
        >
          <p className="text-xs mb-1" style={{ color: "hsl(215 20% 65%)" }}>
            6-Month Average
          </p>
          <p
            className="text-lg font-semibold"
            style={{ color: "hsl(210 40% 98%)" }}
          >
            ${avgEarning.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </p>
        </div>

        {/* Chart */}
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={earnings}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 22%)" />
              <XAxis
                dataKey="month"
                tick={{ fill: "hsl(215 20% 65%)", fontSize: 12 }}
                axisLine={{ stroke: "hsl(222 30% 22%)" }}
                tickLine={{ stroke: "hsl(222 30% 22%)" }}
              />
              <YAxis
                tick={{ fill: "hsl(215 20% 65%)", fontSize: 12 }}
                axisLine={{ stroke: "hsl(222 30% 22%)" }}
                tickLine={{ stroke: "hsl(222 30% 22%)" }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(222 47% 14%)",
                  border: "1px solid hsl(222 30% 22%)",
                  borderRadius: "8px",
                  color: "hsl(210 40% 98%)",
                  boxShadow: "0 4px 12px hsl(0 0% 0% / 0.3)",
                }}
                formatter={(value) => [
                  `$${Number(value).toLocaleString()}`,
                  "Earnings",
                ]}
                labelStyle={{ color: "hsl(215 20% 65%)" }}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {earnings.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      index === earnings.length - 1
                        ? "hsl(38 92% 50%)"
                        : "hsl(38 92% 50% / 0.4)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
