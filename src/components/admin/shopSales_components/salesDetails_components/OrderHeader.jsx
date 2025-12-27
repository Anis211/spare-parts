"use client";
import { ArrowLeft, Calendar, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/admin/ui/sales/details/button";
import { StatusBadge } from "@/components/admin/shopSales_components/salesDetails_components/StatusBadge";
import useUser from "@/zustand/user";

export const OrderHeader = ({
  orderId,
  vin,
  clientName,
  status,
  arrivalDate,
  estimatedCompletion,
  totalCost,
  setActiveTab,
}) => {
  const setSalesTab = useUser((state) => state.setSalesTab);

  return (
    <div className="mb-8">
      <Button
        variant="ghost"
        className="mb-4 text-[hsl(220_10%_55%)] hover:text-[hsl(220_10%_95%)]"
        onClick={() => {
          setActiveTab("Shop");
          setSalesTab("Shop");
        }}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Orders
      </Button>

      <div className="rounded-xl p-6 bg-[hsl(222_47%_9%)]">
        <div className="flex flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-[hsl(220_10%_95%)]">
                Order #{orderId}
              </h1>
              <StatusBadge status={status} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-md text-[hsl(220_10%_55%)]">VIN:</span>
              <span className="font-mono font-medium text-[hsl(36_100%_50%)]">
                {vin}
              </span>
            </div>
            <p className="text-[hsl(220_10%_55%)] mt-1">Client: {clientName}</p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Arrival */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[hsl(220_15%_18%)]">
                <Calendar className="h-5 w-5 text-[hsl(220_10%_55%)]" />
              </div>
              <div>
                <p className="text-sm text-[hsl(220_10%_55%)]">Arrival</p>
                <p className="font-medium text-[hsl(220_10%_95%)]">
                  {arrivalDate}
                </p>
              </div>
            </div>

            {/* Estimated Completion */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[hsl(220_15%_18%)]">
                <Clock className="h-5 w-5 text-[hsl(220_10%_55%)]" />
              </div>
              <div>
                <p className="text-sm text-[hsl(220_10%_55%)]">
                  Est. Completion
                </p>
                <p className="font-medium text-[hsl(220_10%_95%)]">
                  {estimatedCompletion}
                </p>
              </div>
            </div>

            {/* Total Cost */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[hsl(36_100%_50%_/_10%)]">
                <DollarSign className="h-5 w-5 text-[hsl(36_100%_50%)]" />
              </div>
              <div>
                <p className="text-sm text-[hsl(220_10%_55%)]">Total Cost</p>
                <p className="font-medium text-[hsl(36_100%_50%)] text-lg">
                  ${totalCost.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
