import connectDB from "@/lib/mongoose";
import seedCalendar from "@/helpers/seedCalendar";

export default async function handler(req, res) {
  await connectDB();

  if (req.method == "POST") {
    try {
      await seedCalendar(5);

      return res.status(200).json("done");
    } catch (err) {
      return res.status(500).json("Error: ", err.message);
    }
  }
}
