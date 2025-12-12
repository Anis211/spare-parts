import React, { useState, useEffect } from "react";
import DotWave from "@/components/custom/DotWave";
import { Package, TruckIcon, Users, DollarSign } from "lucide-react";
import StatCard from "@/components/admin/StatCard";
import OrdersTable from "@/components/admin/OrdersTable";
import WorkersTable from "@/components/admin/WorkersTable";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState(null);
  const [workers, setWorkers] = useState(null);

  useEffect(() => {
    const order = async () => {
      try {
        const response = await fetch(
          "/api/order?email=admin&countl=0&countr=6",
          {
            method: "GET",
          }
        );

        const res = await fetch("/api/worker?isWorker=true", {
          method: "GET",
        });

        const worker = await res.json();
        const order = await response.json();

        console.log("Orders Data: ", order);
        console.log("Workers Data: ", worker.workers);

        setWorkers(worker.workers);
        setOrders(order.filter((order) => order.paymentStatus !== "Pending"));

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    orders == null && workers == null && order();
  }, [setOrders, setWorkers]);

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
      <div>
        <h2 className="text-3xl font-bold text-[hsl(45_100%_95%)] mb-2">
          Dashboard Overview
        </h2>
        <p className="text-[hsl(220_20%_70%)]">
          Welcome to your spare parts admin panel
        </p>
      </div>

      <div className="flex flex-row flex-wrap gap-5">
        <StatCard
          title="Total Orders"
          value={156}
          icon={Package}
          trend="+12% from last month"
        />
        <StatCard
          title="Active Deliveries"
          value={23}
          icon={TruckIcon}
          trend="8 in transit"
        />
        <StatCard
          title="Delivery Workers"
          value={5}
          icon={Users}
          trend="All active"
        />
        <StatCard
          title="Monthly Revenue"
          value="$18,540"
          icon={DollarSign}
          trend="+8.2% from last month"
        />
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-2xl font-bold text-[hsl(45_100%_95%)] mb-4">
            Recent Orders
          </h3>
          <OrdersTable orders={orders} />
        </div>

        <div>
          <h3 className="text-2xl font-bold text-[hsl(45_100%_95%)] mb-4">
            Delivery Workers
          </h3>
          <WorkersTable workers={workers} />
        </div>
      </div>
    </motion.div>
  );
}
