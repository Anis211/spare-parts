import connectDB from "@/lib/mongoose";
import Total from "@/models/Total";

// Connect to MongoDB when the API route is accessed
connectDB();

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { id } = req.query;

    try {
      const total = await Total.findById(id);

      res.status(200).json(total);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
