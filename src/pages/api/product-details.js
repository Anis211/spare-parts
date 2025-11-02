import connectDB from "@/lib/mongoose";
import Product from "@/models/Product";

// Connect to MongoDB when the API route is accessed
connectDB();

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { sku } = req.query;

    try {
      // Fetch all users from the database
      const products = await Product.find({ sku: sku });

      // Return the users as a JSON response
      res.status(200).json(products);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
