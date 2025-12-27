import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
import { Badge } from "@/components/admin/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  PenLine,
  BadgePlus,
  PackageCheck,
  CircleDotDashed,
} from "lucide-react";

const statusColors = {
  Paid: "bg-[hsl(142_76%_36%)]/20 text-[hsl(142_76%_36%)] border-[hsl(142_76%_36%)]/30",
  "in-transit":
    "bg-[hsl(38_92%_50%)]/20 text-[hsl(38_92%_50%)] border-[hsl(38_92%_50%)]/30",
  Pending:
    "bg-[hsl(220_40%_25%)] text-[hsl(220_20%_70%)] border-[hsl(220_50%_25%)]",
};

const statusAdminColors = {
  Passed:
    "bg-[hsl(142_76%_36%)]/20 text-[hsl(142_76%_36%)] border-[hsl(142_76%_36%)]/30",
  Created:
    "bg-[hsl(38_92%_50%)]/20 text-[hsl(38_92%_50%)] border-[hsl(38_92%_50%)]/30",
  Pending:
    "bg-[hsl(220_40%_25%)] text-[hsl(220_20%_70%)] border-[hsl(220_50%_25%)]",
};

const statusShippingColors = {
  "Getting There":
    "bg-[hsl(142_76%_36%)]/20 text-[hsl(142_76%_36%)] border-[hsl(142_76%_36%)]/30",
  Delivered:
    "bg-[hsl(38_92%_50%)]/20 text-[hsl(38_92%_50%)] border-[hsl(38_92%_50%)]/30",
  Pending:
    "bg-[hsl(220_40%_25%)] text-[hsl(220_20%_70%)] border-[hsl(220_50%_25%)]",
};

export default function OrdersTable({
  orders,
  searchQuery = "",
  statusFilter = "all",
}) {
  const [isToggled, setIsToggled] = useState(false);
  const [specificToggle, setSpecificToggle] = useState({});
  const [clicked, setClicked] = useState({});
  const [change, setChange] = useState({});
  const [data, setData] = useState(orders);

  useEffect(() => {
    orders.map((order, index) => {
      let newChange = {};
      let newHovered = {};

      order.items.map((item, index) => {
        newChange[index] = false;
        newHovered[index] = { Ordered: false, Passed: false, Pending: false };
      });

      setChange((prev) => ({ ...prev, [index]: newChange }));
      setSpecificToggle((prev) => ({ ...prev, [index]: false }));
      setClicked((prev) => ({ ...prev, [index]: false }));
    });
  }, [setSpecificToggle, setChange, setClicked]);

  const filteredOrders = useMemo(() => {
    return data.filter((order) => {
      const matchesSearch =
        order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerData.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter, data]);

  const handleChangeStatus = async (status, order, itemIndex, item) => {
    try {
      const response = await fetch("api/order", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: status,
          orderId: order.orderId,
          itemIndex: itemIndex,
        }),
      });

      const newOne = await response.json();
      const newData = [];

      data.map((ord, ordIndex) => {
        if (ord._id == order._id) {
          setChange((prev) => ({
            ...prev,
            [ordIndex]: {
              ...prev[ordIndex],
              [itemIndex]: !prev[ordIndex][itemIndex],
            },
          }));

          newData.push({
            ...ord,
            items: [
              ...ord.items.slice(0, ord.items.indexOf(item)),
              {
                ...ord.items[order.items.indexOf(item)],
                adminStatus: status,
              },
              ...ord.items.slice(ord.items.indexOf(item) + 1, ord.items.length),
            ],
          });
        } else {
          newData.push(ord);
        }
      });

      setData(newData);
      console.log(newOne);
    } catch (error) {
      console.error("Error changing status:", error);
    }
  };

  return (
    <div className="rounded-lg border border-[hsl(222_30%_18%)] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border border-[hsl(222_30%_18%)] bg-[hsl(222_47%_9%)] hover:bg-[hsl(222_30%_12%)]">
            {[
              "Order ID",
              "Customer",
              "Payment Status",
              "Shipping Status",
              "Assigned To",
              "Items",
            ].map((header) => (
              <TableHead className="text-[hsl(45_100%_95%)] font-semibold">
                <h2 className="flex flex-row gap-2">
                  {header}
                  <AnimatePresence>
                    {header == "Items" && !isToggled ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, type: "spring" }}
                      >
                        <ArrowDownToLine
                          onClick={() => setIsToggled(true)}
                          className="w-5 h-5"
                        />
                      </motion.div>
                    ) : header == "Items" && isToggled ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, type: "spring" }}
                      >
                        <ArrowUpToLine
                          onClick={() => setIsToggled(false)}
                          className="w-5 h-5"
                        />
                      </motion.div>
                    ) : (
                      ""
                    )}
                  </AnimatePresence>
                </h2>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredOrders != null &&
            filteredOrders.map((order, ordIndex) => (
              <TableRow
                key={order.orderId}
                onMouseEnter={() =>
                  setSpecificToggle((prev) => ({
                    ...prev,
                    [ordIndex]: true,
                  }))
                }
                onMouseLeave={() =>
                  setSpecificToggle((prev) => ({
                    ...prev,
                    [ordIndex]: false,
                  }))
                }
                onClick={() =>
                  setClicked((prev) => ({
                    ...prev,
                    [ordIndex]: !clicked[ordIndex],
                  }))
                }
                className="hover:bg-[hsl(220_60%_20%)]/50 border-b border-[hsl(222_30%_18%)] bg-[hsl(222_47%_9%)]"
              >
                <TableCell className="font-medium text-[hsl(45_100%_51%)]">
                  {order.orderId}
                </TableCell>
                <TableCell className="text-[hsl(45_100%_95%)]">
                  {order.customerData.name}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={statusColors[order.paymentStatus]}
                  >
                    {order.paymentStatus.replace("-", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={statusShippingColors[order.shippingStatus]}
                  >
                    {order.shippingStatus.replace("-", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-[hsl(220_20%_70%)]">
                  {order.workerData.name}
                </TableCell>
                <motion.div
                  initial={
                    isToggled || specificToggle[ordIndex] || clicked[ordIndex]
                      ? { maxHeight: "8vh" }
                      : { maxHeight: `${28 * order.items.length}vh` }
                  }
                  animate={
                    isToggled || specificToggle[ordIndex] || clicked[ordIndex]
                      ? { maxHeight: `${28 * order.items.length}vh` }
                      : { maxHeight: "8vh" }
                  }
                  transition={{ duration: 0.6, type: "spring" }}
                  className="overflow-y-hidden"
                >
                  <TableCell className="text-[hsl(220_20%_70%)]">
                    <div className="flex flex-col gap-2 text-md font-semibold">
                      {order.items.map((item, itemIndex) => (
                        <div className="flex flex-col gap-2 border-b-[1px] border-b-white py-4">
                          <h2 className="text-[hsl(45_100%_51%)] flex flex-row gap-2">
                            {"Part Number: "}
                            <span className="text-[hsl(45_100%_95%)]">
                              {item.partNumber}
                            </span>
                          </h2>
                          <h2 className="text-[hsl(45_100%_51%)] flex flex-row gap-2">
                            {"Part Name: "}
                            <span className="text-[hsl(45_100%_95%)]">
                              {item.partName}
                            </span>
                          </h2>
                          <h2 className="text-[hsl(45_100%_51%)] flex flex-row gap-2">
                            {"Brand: "}
                            <span className="text-[hsl(45_100%_95%)]">
                              {item.brand}
                            </span>
                          </h2>
                          <h2 className="text-[hsl(45_100%_51%)] flex flex-row gap-2">
                            {"Quantity: "}
                            <span className="text-[hsl(45_100%_95%)]">
                              {item.quantity}
                            </span>
                          </h2>
                          <h2 className="text-[hsl(45_100%_51%)] flex flex-row gap-2">
                            {"Price: "}
                            <span className="text-[hsl(45_100%_95%)]">
                              {item.price}
                            </span>
                          </h2>
                          <h2 className="text-[hsl(45_100%_51%)] flex flex-row gap-2">
                            {"Place: "}
                            <a
                              href={item.place}
                              className="text-[hsl(45_100%_95%)]"
                            >
                              link
                            </a>
                          </h2>
                          <h2 className="text-[hsl(45_100%_51%)] flex flex-row gap-3 items-center">
                            {"Status: "}
                            <Badge
                              variant="outline"
                              className={statusAdminColors[item.adminStatus]}
                            >
                              {item.adminStatus}
                            </Badge>
                            <PenLine
                              onClick={() => {
                                setChange((prev) => ({
                                  ...prev,
                                  [ordIndex]: {
                                    ...prev[ordIndex],
                                    [itemIndex]: !prev[ordIndex][itemIndex],
                                  },
                                }));
                              }}
                              className="w-5 h-5 text-[hsl(45_100%_95%)]"
                            />
                            <AnimatePresence>
                              {change[0] != undefined &&
                                change[ordIndex][itemIndex] && (
                                  <motion.div
                                    initial={{ x: 30, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: 30, opacity: 0 }}
                                    transition={{
                                      duration: 0.4,
                                      type: "spring",
                                    }}
                                    className="py-2 px-4 ml-2 text-[hsl(45_100%_95%)] flex flex-row gap-2 rounded-full border-[1px] border-[hsl(45_100%_95%)]"
                                  >
                                    {[
                                      {
                                        icon: CircleDotDashed,
                                        tooltip: "Pending",
                                      },
                                      {
                                        icon: BadgePlus,
                                        tooltip: "Created",
                                      },
                                      { icon: PackageCheck, tooltip: "Passed" },
                                    ].map((status) => (
                                      <status.icon
                                        onClick={() =>
                                          handleChangeStatus(
                                            status.tooltip,
                                            order,
                                            itemIndex,
                                            item
                                          )
                                        }
                                        className="w-5 h-5"
                                      />
                                    ))}
                                  </motion.div>
                                )}
                            </AnimatePresence>
                          </h2>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                </motion.div>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}
