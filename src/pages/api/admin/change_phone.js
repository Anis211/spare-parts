import connectDB from "@/lib/mongoose";
import VinData from "@/models/AdminChat";

connectDB();

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { vin, phone } = req.body;

    if (!vin || phone.length < 1) {
      return res
        .status(400)
        .json({ error: "Phone Changing Data is Required!" });
    }

    const vinCode = vin.toUpperCase();

    try {
      const existingDoc = await VinData.findOne({ vin: vinCode });
      await VinData.updateOne(
        { vin: vinCode },
        {
          vin: existingDoc.vin,
          phoneNumber: phone,
          records: existingDoc.records,
        }
      );

      return res.status(200).json("Phone Number was updated successfully");
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}
