"use client";
import { useState, useEffect } from "react";
import { SearchHeader } from "@/components/admin/shopSales_components/SearchHeader";
import { RepairOrderCard } from "@/components/admin/shopSales_components/RepairOrderCard";
import { NewOrderDialog } from "@/components/admin/shopSales_components/NewOrderDialog";
import { sampleOrders } from "@/data/sampleOrders";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

function calculateOrderTotals(order) {
  let partsTotal = 0;
  let laborTotal = 0;

  const works = Array.isArray(order?.repairWorks) ? order.repairWorks : [];

  works.forEach((work) => {
    laborTotal += work?.laborCost || 0;

    const parts = Array.isArray(work?.parts) ? work.parts : [];
    parts.forEach((part) => {
      partsTotal += part?.totalPrice || 0;
    });
  });

  const grandTotal = partsTotal + laborTotal;

  return {
    partsTotal: parseFloat(partsTotal.toFixed(2)),
    laborTotal: parseFloat(laborTotal.toFixed(2)),
    grandTotal: parseFloat(grandTotal.toFixed(2)),
  };
}

const ShopSales = ({ setActiveTab }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState([]);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [orders, setOrders] = useState(sampleOrders);
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Shop Sales - AutoRepair Admin";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "Manage auto repair orders, track VIN numbers, client information, and repair work progress."
      );
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content =
        "Manage auto repair orders, track VIN numbers, client information, and repair work progress.";
      document.head.appendChild(meta);
    }
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.vin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.clientPhone.includes(searchQuery);

    const matchesStatus =
      statusFilters.length === 0 || statusFilters.includes(order.status);

    return matchesSearch && matchesStatus;
  });

  const totalRevenue = orders.reduce(
    (sum, o) => sum + calculateOrderTotals(o).grandTotal,
    0
  );

  const handleAddNewOrder = () => {
    setIsNewOrderOpen(true);
  };

  const handleCreateOrder = (data) => {
    const newRepairWorks = data.repairWorks.map((name, index) => ({
      id: `new-rw-${Date.now()}-${index}`,
      name,
      description: `${name} service`,
      laborHours: 1,
      laborRate: 85,
      laborCost: 85,
      status: "pending",
      parts: [],
    }));

    const newOrder = {
      id: `order-${Date.now()}`,
      vin: data.vin,
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      clientEmail: data.clientEmail || undefined,
      vehicleMake: data.vehicleMake,
      vehicleModel: data.vehicleModel,
      vehicleYear: data.vehicleYear,
      mileage: data.mileage,
      arrivalDate: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      workerName: data.workerName,
      notes: data.notes,
      status: "pending",
      repairWorks: newRepairWorks,
    };

    setOrders([newOrder, ...orders]);
    toast({
      title: "Order Created",
      description: `New repair order for ${data.clientName} has been created.`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, type: "spring" }}
      className="min-h-screen bg-[hsl(222_47%_6%)]"
    >
      <main className="min-h-screen p-8">
        <SearchHeader
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilters={statusFilters}
          onStatusFiltersChange={setStatusFilters}
          onAddNew={handleAddNewOrder}
        />

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-[hsl(222_30%_18%)] bg-[hsl(222_47%_9%)] p-4">
            <p className="text-sm text-[hsl(220_15%_55%)] mb-1">Total Orders</p>
            <p className="text-2xl font-bold text-[hsl(40_15%_95%)]">
              {orders.length}
            </p>
          </div>
          <div className="rounded-xl border border-[hsl(222_30%_18%)] bg-[hsl(222_47%_9%)] p-4">
            <p className="text-sm text-[hsl(220_15%_55%)] mb-1">In Progress</p>
            <p className="text-2xl font-bold text-[hsl(38_92%_50%)]">
              {orders.filter((o) => o.status === "in-progress").length}
            </p>
          </div>
          <div className="rounded-xl border border-[hsl(222_30%_18%)] bg-[hsl(222_47%_9%)] p-4">
            <p className="text-sm text-[hsl(220_15%_55%)] mb-1">Completed</p>
            <p className="text-2xl font-bold text-[hsl(142_72%_45%)]">
              {orders.filter((o) => o.status === "completed").length}
            </p>
          </div>
          <div className="rounded-xl border border-[hsl(222_30%_18%)] bg-[hsl(222_47%_9%)] p-4">
            <p className="text-sm text-[hsl(220_15%_55%)] mb-1">
              Total Revenue
            </p>
            <p className="text-2xl font-bold text-[hsl(40_95%_55%)]">
              $
              {totalRevenue.toLocaleString("en-Us", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-3 gap-6">
          {filteredOrders.map((order, index) => (
            <RepairOrderCard
              setActiveTab={setActiveTab}
              key={order.id}
              order={order}
              className="opacity-0 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            />
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-[hsl(222_30%_12%)] flex items-center justify-center mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="text-lg font-semibold text-[hsl(40_15%_95%)] mb-2">
              No orders found
            </h3>
            <p className="text-sm text-[hsl(220_15%_55%)]">
              {statusFilters.length > 0
                ? "Try adjusting your filters"
                : "Try adjusting your search query or add a new order"}
            </p>
          </div>
        )}
      </main>

      <NewOrderDialog
        open={isNewOrderOpen}
        onOpenChange={setIsNewOrderOpen}
        onSubmit={handleCreateOrder}
      />
    </motion.div>
  );
};

export default ShopSales;
