import connectDB from "@/lib/mongoose";
import Order from "@/models/Order";

// Connect to MongoDB when the API route is accessed
connectDB();

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { orderId } = req.query;

    try {
      if (orderId != undefined && orderId.startsWith("ORD-")) {
        const order = await Order.findOne({ orderId: orderId });
        res.status(200).json(order);
      } else {
        res.status(500).json("Incorect order ID or it is missing");
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
