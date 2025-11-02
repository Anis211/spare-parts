import connectDB from "@/lib/mongoose";
import User from "@/models/User";

// Connect to MongoDB when the API route is accessed
connectDB();

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { email } = req.query;

    try {
      const user = await User.findOne({ email });

      res.status(200).json(user);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else if (req.method === "POST") {
    try {
      const { firstName, lastName, email, phone, password, country, city } =
        req.body;

      // Validate input
      if (
        !firstName ||
        !lastName ||
        !email ||
        !phone ||
        !password ||
        !country ||
        !city
      ) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Create a new user
      const newUser = new User({
        firstName,
        lastName,
        email,
        phone,
        password,
        country,
        city,
        totalOrders: 0,
        totalSpent: 0,
        status: "Active",
        orders: [],
        history: [],
      });
      await newUser.save();

      const count = await Total.findById("680f76ede345aea0f2104a24");
      await Total.findByIdAndUpdate(
        "680f76ede345aea0f2104a24",
        { totalCount: count.totalCount + 1 },
        { new: true }
      );

      // Return success response
      res
        .status(201)
        .json({ message: "User created successfully", user: newUser });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else if (req.method === "PUT") {
    const { newUser } = req.body;
    try {
      if (!newUser) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const user = await User.findByIdAndUpdate(newUser._id, newUser, {
        new: true,
      });

      res
        .status(201)
        .json({
          success: true,
          message: "User updated successfully",
          user: user,
        });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
