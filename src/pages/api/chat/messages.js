import Chat from "../../../models/Chat";
import connectDB from "@/lib/mongoose";

connectDB();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { user } = req.body;

  if (!user) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const chatData = await Chat.findOne({ user: user });

    if (!chatData) {
      return res
        .status(404)
        .json({ error: "No chat history found for this user" });
    }

    return res.status(200).json({ chat: chatData.chat });
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
