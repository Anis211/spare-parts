import connectDB from "@/lib/mongoose";
import Chat from "@/models/Chat";

// Connect to MongoDB when the API route is accessed
connectDB();

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { answer, id, from } = req.body;

    try {
      const chat = await Chat.findOne({ user: id });

      const updatedChat = await Chat.findByIdAndUpdate(
        chat._id,
        {
          user: id,
          history: [
            ...chat.history,
            { isUser: from === "website" ? true : false, text: answer },
          ],
        },
        { new: true }
      );

      res.status(200).json({
        message: "Chat updated successfully",
        data: updatedChat,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to update chat" });
    }
  } else if (req.method == "GET") {
    const { id } = req.query;
    try {
      const chat = await Chat.findOne({ user: id });

      res
        .status(200)
        .json({ message: "Chat is found successfully", data: chat });
    } catch (error) {
      res.status(500).json({ error: "Failed to find the chat" });
    }
  } else {
    res.status(404).json({ error: "Internal server error" });
  }
}
