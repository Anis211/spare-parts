"use client";
import { Package, Clock } from "lucide-react";
import { StatusBadge } from "@/components/admin/shopSales_components/salesDetails_components/StatusBadge";
import { motion } from "framer-motion";

const currentParts = [
  {
    id: 1,
    name: "Brake Pads Set",
    partNumber: "BP-2024-001",
    quantity: 2,
    price: 89.99,
    status: "delivered",
    orderDate: "Dec 18, 2025",
    deliveryDate: "Dec 20, 2025",
  },
  {
    id: 2,
    name: "Oil Filter",
    partNumber: "OF-2024-045",
    quantity: 1,
    price: 24.99,
    status: "shipped",
    orderDate: "Dec 19, 2025",
    deliveryDate: "—",
  },
  {
    id: 3,
    name: "Spark Plugs (4pc)",
    partNumber: "SP-2024-112",
    quantity: 1,
    price: 45.0,
    status: "ordered",
    orderDate: "Dec 20, 2025",
    deliveryDate: "—",
  },
  {
    id: 4,
    name: "Air Filter",
    partNumber: "AF-2024-078",
    quantity: 1,
    price: 32.5,
    status: "pending",
    orderDate: "Dec 21, 2025",
    deliveryDate: "—",
  },
];

const historyParts = [
  {
    id: 5,
    name: "Transmission Fluid",
    partNumber: "TF-2024-022",
    quantity: 4,
    price: 15.99,
    status: "delivered",
    orderDate: "Dec 10, 2025",
    deliveryDate: "Dec 12, 2025",
  },
  {
    id: 6,
    name: "Coolant (1L)",
    partNumber: "CL-2024-033",
    quantity: 2,
    price: 18.5,
    status: "delivered",
    orderDate: "Dec 08, 2025",
    deliveryDate: "Dec 10, 2025",
  },
  {
    id: 7,
    name: "Wiper Blades",
    partNumber: "WB-2024-056",
    quantity: 2,
    price: 28.0,
    status: "delivered",
    orderDate: "Dec 05, 2025",
    deliveryDate: "Dec 07, 2025",
  },
];

export const PartsTab = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.7, type: "spring" }}
      className="space-y-8"
    >
      {/* Current Orders */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-[hsl(36_100%_50%_/_10%)]">
            <Package className="h-5 w-5 text-[hsl(36_100%_50%)]" />
          </div>
          <h2 className="text-xl font-semibold text-[hsl(220_10%_95%)]">
            Current Part Orders
          </h2>
        </div>

        <div className="grid gap-4">
          {currentParts.map((part, index) => (
            <div
              key={part.id}
              className="bg-[hsl(222_47%_9%)] border-1 border-[hsl(220_15%_18%)] rounded-xl p-5 hover:border-[hsl(36_100%_50%/30)] transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-row items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg text-[hsl(220_10%_95%)]">
                      {part.name}
                    </h3>
                    <StatusBadge status={part.status} />
                  </div>
                  <p className="text-md text-[hsl(220_10%_55%)] mb-3">
                    Part #: {part.partNumber}
                  </p>

                  <div className="grid grid-cols-4 gap-4 text-md">
                    <div>
                      <span className="text-[hsl(220_10%_55%)]">Quantity</span>
                      <p className="font-medium text-[hsl(220_10%_95%)]">
                        {part.quantity}
                      </p>
                    </div>
                    <div>
                      <span className="text-[hsl(220_10%_55%)]">Price</span>
                      <p className="font-medium text-[hsl(36_100%_50%)]">
                        ${part.price.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[hsl(220_10%_55%)]">
                        Order Date
                      </span>
                      <p className="font-medium text-[hsl(220_10%_95%)]">
                        {part.orderDate}
                      </p>
                    </div>
                    <div>
                      <span className="text-[hsl(220_10%_55%)]">Delivery</span>
                      <p className="font-medium text-[hsl(220_10%_95%)]">
                        {part.deliveryDate}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Order History */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-[hsl(220_15%_18%)]">
            <Clock className="h-5 w-5 text-[hsl(220_10%_55%)]" />
          </div>
          <h2 className="text-xl font-semibold text-[hsl(220_10%_95%)]">
            Parts History
          </h2>
        </div>

        <div className="bg-[hsl(222_47%_9%)] border-1 border-[hsl(220_15%_18%)] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[hsl(220_15%_18%)]">
                <th className="text-left p-4 text-md font-medium text-[hsl(220_10%_55%)]">
                  Part Name
                </th>
                <th className="text-left p-4 text-md font-medium text-[hsl(220_10%_55%)] hidden md:table-cell">
                  Part Number
                </th>
                <th className="text-left p-4 text-md font-medium text-[hsl(220_10%_55%)]">
                  Qty
                </th>
                <th className="text-left p-4 text-md font-medium text-[hsl(220_10%_55%)]">
                  Price
                </th>
                <th className="text-left p-4 text-md font-medium text-[hsl(220_10%_55%)] hidden md:table-cell">
                  Date
                </th>
                <th className="text-left p-4 text-md font-medium text-[hsl(220_10%_55%)]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {historyParts.map((part) => (
                <tr
                  key={part.id}
                  className="border-b border-[hsl(220_15%_18%_/_50%)] hover:bg-[hsl(222_30%_15%)] transition-colors"
                >
                  <td className="p-4 text-md font-medium text-[hsl(220_10%_95%)]">
                    {part.name}
                  </td>
                  <td className="p-4 text-md text-[hsl(220_10%_55%)] hidden md:table-cell">
                    {part.partNumber}
                  </td>
                  <td className="p-4 text-md text-[hsl(220_10%_95%)]">
                    {part.quantity}
                  </td>
                  <td className="p-4 text-md text-[hsl(36_100%_50%)] font-medium">
                    ${part.price.toFixed(2)}
                  </td>
                  <td className="p-4 text-md text-[hsl(220_10%_55%)] hidden md:table-cell">
                    {part.orderDate}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={part.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </motion.div>
  );
};
