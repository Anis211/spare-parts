import connectDB from "@/lib/mongoose";
import VinData from "@/models/AdminChat";

connectDB();

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ error: "Result Data is Required!" });
    }

    const vinCode = data.user.vin.toUpperCase();

    try {
      // Check if document exists
      const existingDoc = await VinData.findOne({ vin: vinCode });

      if (!existingDoc) {
        // Create new document
        await VinData.create({
          vin: vinCode,
          records: [data],
        });
      } else {
        // Push new record
        await VinData.findOneAndUpdate(
          { vin: vinCode },
          {
            $push: {
              records: {
                $each: [data],
                $position: 0,
              },
            },
          },
          { new: true }
        );
      }

      return res.status(200).json("AdminChat data updated successfully");
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else if (req.method === "GET") {
    const { vin, limit } = req.query;
    console.log("GET Request Params:", req.query);

    if (!vin) {
      return res.status(400).json({ error: "VIN parameter is required" });
    }

    try {
      let vinData = null;

      if (vin != "none") {
        const vinCode = vin.toUpperCase();
        vinData = await VinData.findOne({ vin: vinCode });
        console.log("Fetched VIN Data for:", vinCode);
      } else {
        vinData = await VinData.find()
          .sort({
            createdAt: -1,
          })
          .limit(limit);
      }

      if (!vinData) {
        return res.status(404).json({ error: "VIN data not found" });
      }

      res.status(200).json({ vinData });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else if (req.method === "PUT") {
    const { result, length } = req.body;

    if (!result) {
      console.log("Delete Request Missing Results:", result);
      return res.status(400).json({ error: "Results data is required" });
    }

    try {
      if (length > 1) {
        await VinData.updateOne(
          { vin: result.user.vin.toUpperCase() },
          { $pull: { records: result } }
        );
      } else {
        await VinData.deleteOne({ vin: result.user.vin.toUpperCase() });
      }
      return res.status(200).json({ message: "Result deleted successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}
