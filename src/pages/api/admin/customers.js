import connectDB from "@/lib/mongoose";
import User from "@/models/User";

export default async function handler(req, res) {
  await connectDB();

  if (req.method === "POST") {
    const { limitl, limitr } = req.body;

    if (limitl == undefined || limitr == undefined) {
      console.log("Something Wrong: ", limitl, ",", limitr);
      return res.status(400).json("Limits are Required!");
    }

    try {
      const users = await User.find({}).skip(limitl).limit(limitr);
      return res.status(200).json({ users });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else if (req.method === "GET") {
    const { phone } = req.query;

    if (phone == undefined) {
      console.log("Something Wrong: ", id);
      return res.status(400).json("User's Phone Number is Required!");
    }

    try {
      const user = await User.find({ phone: phone });
      return res.status(200).json({ user });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}
