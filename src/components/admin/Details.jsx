import { Package, Wrench, User } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/admin/ui/sales/details/tabs";
import { OrderHeader } from "@/components/admin/shopSales_components/salesDetails_components/OrderHeader";
import { PartsTab } from "@/components/admin/shopSales_components/salesDetails_components/PartsTab";
import { RepairWorksTab } from "@/components/admin/shopSales_components/salesDetails_components/RepairWorksTab";
import { ClientDataTab } from "@/components/admin/shopSales_components/salesDetails_components/ClientDataTab";
import { useEffect, useState } from "react";

const OrderDetails = ({ setActiveTab, selectedSalesTab }) => {
  const [orderData, setOrderData] = useState({});
  const [clientData, setClientData] = useState({});

  const [currentParts, setCurrentParts] = useState([]);
  const [historyParts, setHistoryParts] = useState([]);

  const [currentRepairs, setCurrentRepairs] = useState([]);
  const [historyRepairs, setHistoryRepairs] = useState([]);

  const [futureRepairNotes, setFutureRepairNotes] = useState([]);
  const [partsNeededNotes, setPartsNeededNotes] = useState([]);

  useEffect(() => {
    const find = async () => {
      if (!selectedSalesTab?.clientPhone) return;

      try {
        const encodedPhone = encodeURIComponent(selectedSalesTab.clientPhone);
        const res = await fetch(`/api/admin/customers?phone=${encodedPhone}`, {
          method: "GET",
        });

        if (!res.ok) {
          console.error("Failed to fetch customer data:", res.status);
          return;
        }

        const data = await res.json();
        const user =
          Array.isArray(data.user) && data.user.length > 0
            ? data.user[0]
            : null;

        if (!user) {
          console.warn(
            "No user found for phone:",
            selectedSalesTab.clientPhone
          );
          return;
        }

        // ✅ Safely process parts history
        let hisParts = [];
        if (Array.isArray(user.parts)) {
          for (const order of user.parts) {
            if (Array.isArray(order?.items)) {
              hisParts = [...hisParts, ...order.items];
            }
          }
        }

        // ✅ Safely process repair history
        let hisRepairs = [];
        if (Array.isArray(user.repairWorks)) {
          hisRepairs = user.repairWorks.map((repairWork) => {
            const worker = repairWork.assignedWorker || {};
            const nameParts = (worker.name || "").split(" ");
            const avatar =
              nameParts.length >= 2
                ? `${nameParts[0][0]}${nameParts[1][0]}`
                : nameParts[0]?.[0] || "??";

            return {
              id: repairWork.id || "",
              name: repairWork.description || "",
              master: {
                name: worker.name || "Unknown",
                phone: worker.phone || "",
                avatar,
              },
              status: repairWork.status || "unknown",
              startDate: repairWork.arrivalDate || "",
              completedDate: repairWork.completionDate || "",
              cost: repairWork.cost || 0,
            };
          });
        }

        // ✅ Process current order
        let curParts = [];
        let curRepairs = [];

        const currentPartIds = new Set();
        let totalCost = 0;

        if (Array.isArray(selectedSalesTab.repairWorks)) {
          for (const repairWork of selectedSalesTab.repairWorks) {
            const userRepairWorkData = user.repairWorks?.find(
              (userRepairWork) => userRepairWork?.id === repairWork?.id
            );
            totalCost += repairWork.laborCost || 0;

            const worker = repairWork.assignedWorker || {};
            const nameParts = (worker.name || "").split(" ");
            const avatar =
              nameParts.length >= 2
                ? `${nameParts[0][0]}${nameParts[1][0]}`
                : nameParts[0]?.[0] || "??";

            curRepairs.push({
              id: repairWork.id || "",
              name: repairWork.name || "",
              master: {
                name: worker.name || "Unknown",
                phone: worker.phone || "",
                avatar,
              },
              status: repairWork.status || "pending",
              startDate: selectedSalesTab.arrivalDate || "",
              estimatedEnd:
                selectedSalesTab.completionDate?.length > 0
                  ? selectedSalesTab.completionDate
                  : "in progress",
              notes:
                userRepairWorkData?.notes.length > 0
                  ? userRepairWorkData.notes[
                      userRepairWorkData.notes.length - 1
                    ]
                  : "No notes available",
            });

            if (Array.isArray(repairWork.parts)) {
              for (const part of repairWork.parts) {
                totalCost += part.totalPrice || 0;

                curParts.push({
                  id: part.id || "",
                  name: part.name || "",
                  partNumber: part.partNumber || "",
                  quantity: part.quantity || 1,
                  price: part.unitPrice || 0,
                  status: part.status || "pending",
                  orderDate: part.purchaseDate || "—",
                  deliveryDate: part.arrivalDate || "—",
                });

                if (part.id) currentPartIds.add(part.id);
              }
            }
          }
        }

        // ✅ Filter out current items from history
        const filteredHisParts = hisParts.filter(
          (hisPart) => hisPart?.partId && !currentPartIds.has(hisPart.partId)
        );

        const filteredHisRepairs = hisRepairs.filter(
          (hisRepair) =>
            !selectedSalesTab.repairWorks?.some(
              (curRepair) => curRepair?.id === hisRepair?.id
            )
        );

        // ✅ Update states
        setOrderData({
          orderId: selectedSalesTab.id || "",
          vin: selectedSalesTab.vin || "",
          clientName: selectedSalesTab.clientName || "",
          status: selectedSalesTab.status || "",
          arrivalDate: selectedSalesTab.arrivalDate || "",
          estimatedCompletion:
            selectedSalesTab.completionDate?.length > 0
              ? selectedSalesTab.completionDate
              : "in progress",
          totalCost: totalCost,
        });

        setClientData({
          personal: {
            name: user.name || "",
            phone: user.phone || selectedSalesTab.clientPhone,
            email: user.email != null ? user.email : "Not Provided",
          },
          vehicle: {
            vin: user?.car.vin || "Unknown",
            make: user?.car.make || "Unknown",
            model: user?.car.model || "Unknown",
            year: user?.car.year || "Unknown",
            color: user?.car.color != null ? user?.car.color : "Unknown",
            mileage: user?.car.mileage != null ? user?.car.mileage : "Unknown",
            licensePlate:
              user?.car.licensePlate != null
                ? user?.car.licensePlate
                : "Unknown",
            engine: user?.car.engine != null ? user?.car.engine : "Unknown",
            transmission:
              user?.car.transmission != null
                ? user?.car.transmission
                : "Unknown",
            driveType:
              user?.car.driveType != null ? user?.car.driveType : "Unknown",
            fuelType:
              user?.car.fuelType != null ? user?.car.fuelType : "Unknown",
          },
          serviceHistory: {
            firstVisit:
              user.firstVisit != null ? user.firstVisit : "Never Been",
            totalVisits: user.totalVisits,
            lastService: user.lastVisit
              ? new Date(user.lastVisit).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Never Been",
            totalSpent: user.totalSpent || 0,
          },
        });

        setCurrentParts(curParts);
        setHistoryParts(filteredHisParts);

        setCurrentRepairs(curRepairs);
        setHistoryRepairs(filteredHisRepairs);

        setFutureRepairNotes(user.futureRepairNotes || []);
        setPartsNeededNotes(user.partsNeededNotes || []);
      } catch (error) {
        console.error("Error in customer details fetch:", error);
      }
    };

    if (selectedSalesTab) {
      find();
    }
  }, [selectedSalesTab]);

  return (
    <div className="min-h-screen bg-[hsl(222_47%_6%)] text-[hsl(220_10%_95%)]">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <OrderHeader {...orderData} setActiveTab={setActiveTab} />

        <Tabs defaultValue="parts" className="w-full">
          <TabsList className="w-[40%] md:w-auto grid grid-cols-3 gap-1 bg-[hsl(222_47%_9%)] p-1 rounded-lg border border-[hsl(220_15%_18%)]">
            <TabsTrigger
              value="parts"
              className="gap-2 data-[state=active]:bg-[hsl(36_100%_50%)] data-[state=active]:text-[hsl(220_20%_7%)] rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(36_100%_50%)] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(220_18%_10%)]"
            >
              <Package className="h-4 w-4" />
              <span className="inline">Parts</span>
            </TabsTrigger>
            <TabsTrigger
              value="repairs"
              className="gap-2 data-[state=active]:bg-[hsl(36_100%_50%)] data-[state=active]:text-[hsl(220_20%_7%)] rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(36_100%_50%)] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(220_18%_10%)]"
            >
              <Wrench className="h-4 w-4" />
              <span className="inline">Repair Works</span>
            </TabsTrigger>
            <TabsTrigger
              value="client"
              className="gap-2 data-[state=active]:bg-[hsl(36_100%_50%)] data-[state=active]:text-[hsl(220_20%_7%)] rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(36_100%_50%)] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(220_18%_10%)]"
            >
              <User className="h-4 w-4" />
              <span className="inline">Client Data</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="parts" className="mt-6">
            <PartsTab currentParts={currentParts} historyParts={historyParts} />
          </TabsContent>

          <TabsContent value="repairs" className="mt-6">
            <RepairWorksTab
              currentRepairs={currentRepairs}
              historyRepairs={historyRepairs}
              futureRepairNotes={futureRepairNotes}
              partsNeededNotes={partsNeededNotes}
            />
          </TabsContent>

          <TabsContent value="client" className="mt-6">
            <ClientDataTab clientData={clientData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OrderDetails;
