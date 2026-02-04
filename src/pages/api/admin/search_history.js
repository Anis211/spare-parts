import connectDB from "@/lib/mongoose";
import VinData from "@/models/AdminChat";

export default async function handler(req, res) {
  await connectDB();

  if (req.method === "GET") {
    const { limitl, limitr } = req.query;
    console.log("GET Request Params:", req.query);

    if (!limitl && !limitr) {
      return res.status(400).json({ error: "VIN parameter is required" });
    }
    let vinData = null;

    try {
      vinData = await VinData.find({})
        .sort({ createdAt: -1 })
        .skip(limitl)
        .limit(limitr);

      if (!vinData) {
        return res.status(404).json({ error: "VIN data not found" });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    } finally {
      res.status(200).json({ vinData });
    }
  }
}
