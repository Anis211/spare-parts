import OrdersTable from "./OrdersTable";
import DotWave from "@/components/custom/DotWave";
import { useState, useEffect } from "react";
import { Package, Search } from "lucide-react";
import { Input } from "@/components/admin/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/select";

const Orders = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const order = async () => {
      try {
        const response = await fetch(
          "/api/order?email=admin&countl=0&countr=6",
          {
            method: "GET",
          }
        );

        const data = await response.json();
        console.log(data);
        setOrders(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    orders == null && order();
  }, [setOrders]);

  if (loading) {
    return <DotWave />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-[hsl(45_100%_51%)]/10 flex items-center justify-center">
          <Package className="h-6 w-6 text-[hsl(45_100%_51%)]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[hsl(45_100%_95%)]">
            Orders Management
          </h1>
          <p className="text-[hsl(220_20%_70%)]">Track and manage all orders</p>
        </div>
      </div>

      <div className="flex flex-row gap-4">
        <div className="relative flex-1 ring-[1px] ring-[hsl(220_50%_25%)] rounded-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(220_20%_70%)]" />
          <Input
            placeholder="Search by order ID, customer, or item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in-transit">In Transit</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <OrdersTable
        orders={orders}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
      />
    </div>
  );
};

export default Orders;
