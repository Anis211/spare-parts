import connectDB from "@/lib/mongoose";
import User from "@/models/User";

// Connect to MongoDB when the API route is accessed
connectDB();

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { countl, countr } = req.query;

    try {
      // Fetch all users from the database
      const users = await User.find({}).skip(countl).limit(countr);

      // Return the users as a JSON response
      res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
