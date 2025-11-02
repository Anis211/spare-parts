import { useState, useEffect } from "react";
import { Button } from "@/components/admin/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/admin/ui/card";
import { CheckCircle2, Package, Truck, CreditCard } from "lucide-react";
import DotWave from "@/components/custom/DotWave";
import { useRouter } from "next/router";

const Index = () => {
  const [orders, setOrders] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    const order = async () => {
      try {
        const response = await fetch(`/api/order_details?orderId=ORD-${id}`, {
          method: "GET",
        });
        const order = await response.json();
        console.log("Orders Data: ", order);

        let calculatedTotal = 0;
        order.items.forEach((item) => {
          calculatedTotal += item.price * item.quantity;
        });

        setTotal(calculatedTotal);
        setOrders(order);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    orders == null && id != undefined && order();
  }, [setOrders, id]);

  if (loading) {
    return <DotWave />;
  }

  return (
    <div className="min-h-screen bg-[hsl(222_47%_11%)] text-[hsl(210_40%_98%)]">
      {/* Main Content */}
      <main className="container px-[2vw] py-8 max-w-6xl mt-[8vh]">
        <div className="flex flex-col justify-center items-center gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border border-[hsl(217_33%_24%)] bg-[hsl(220_40%_16%)] text-[hsl(210_40%_98%)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-[hsl(45_93%_58%)]" />
                  Order Items
                </CardTitle>
                <CardDescription className="text-[hsl(215_20%_65%)]">
                  Review your selected products
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 w-[96vw]">
                {orders != null &&
                  orders.items.map((item) => (
                    <div
                      key={item.partNumber}
                      className="flex gap-4 p-4 rounded-lg transition-colors bg-[hsl(217_33%_22%/0.3)] hover:bg-[hsl(217_33%_22%/0.5)]"
                    >
                      <img
                        src={item.imageUrls[0]}
                        alt={item.partName}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-[hsl(210_40%_98%)]">
                          {item.partName + " - " + item.brand}
                        </h3>
                        <p className="text-sm mt-1 text-[hsl(215_20%_65%)]">
                          {item.fromStock
                            ? "In Stock"
                            : "On the way from supplier"}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-[hsl(215_20%_65%)]">
                            Qty: {item.quantity}
                          </span>
                          <span className="font-semibold text-[hsl(45_93%_58%)]">
                            {(item.price * item.quantity).toFixed(2) + " тг"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Shipping Info */}
            <Card className="border border-[hsl(217_33%_24%)] bg-[hsl(220_40%_16%)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[hsl(45_93%_58%)]" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[hsl(215_20%_65%)]">Name:</span>
                    <span className="text-[hsl(210_40%_98%)]">John Doe</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[hsl(215_20%_65%)]">Email:</span>
                    <span className="text-[hsl(210_40%_98%)]">
                      john.doe@example.com
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[hsl(215_20%_65%)]">Address:</span>
                    <span className="text-right text-[hsl(210_40%_98%)]">
                      123 Main Street
                      <br />
                      New York, NY 10001
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[hsl(215_20%_65%)]">
                      Estimated Delivery:
                    </span>
                    <span className="font-semibold text-[hsl(45_93%_58%)]">
                      3-5 Business Days
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1 w-[96vw]">
            <Card className="sticky top-24 border border-[hsl(217_33%_24%)] bg-[hsl(220_40%_16%)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[hsl(45_93%_58%)]" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-[hsl(210_40%_98%)]">
                      Total
                    </span>
                    <span className="text-xl font-bold text-[hsl(45_93%_58%)]">
                      {total.toFixed(2) + " тг"}
                    </span>
                  </div>
                </div>

                <Button className="w-full font-semibold py-6 text-lg shadow-lg transition-all bg-[hsl(45_93%_58%)] hover:bg-[hsl(45_93%_58%/0.9)] text-[hsl(222_47%_11%)]">
                  Proceed to Payment
                </Button>

                <div className="space-y-2 pt-4">
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-[hsl(45_93%_58%)]" />
                    <span className="text-[hsl(215_20%_65%)]">
                      Secure 256-bit SSL encryption
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-[hsl(45_93%_58%)]" />
                    <span className="text-[hsl(215_20%_65%)]">
                      30-day money-back guarantee
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-[hsl(45_93%_58%)]" />
                    <span className="text-[hsl(215_20%_65%)]">
                      Free returns on all orders
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
