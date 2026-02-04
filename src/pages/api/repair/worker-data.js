import connectDB from "@/lib/mongoose";
import Worker from "@/models/admin/RepairWorker";

export default async function handler(req, res) {
  await connectDB();

  if (req.method === "GET") {
    const { id } = req.query;

    try {
      // Fetch all users from the database
      const worker = await Worker.find({ id });

      res.status(200).json(worker);
    } catch (error) {
      console.error("Error fetching worker:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
