import connectDB from "@/lib/mongoose";
import Product from "@/models/Product";

// Connect to MongoDB when the API route is accessed
connectDB();

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { liked } = req.body;

    try {
      const orders = await Product.find({ _id: { $in: Object.keys(liked) } });

      res.status(200).json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
