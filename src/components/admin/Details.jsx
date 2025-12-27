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

const OrderDetails = ({ setActiveTab }) => {
  const orderData = {
    orderId: "ORD-2025-0042",
    vin: "WBA8E1C55JA765432",
    clientName: "Sarah Williams",
    status: "in-progress",
    arrivalDate: "Dec 18, 2025",
    estimatedCompletion: "Dec 22, 2025",
    totalCost: 464.25,
  };

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
            <PartsTab />
          </TabsContent>

          <TabsContent value="repairs" className="mt-6">
            <RepairWorksTab />
          </TabsContent>

          <TabsContent value="client" className="mt-6">
            <ClientDataTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OrderDetails;
