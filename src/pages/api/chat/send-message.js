import { sendMessage } from "../bot-webhooks/telegram-webhook";
import Chat from "../../../models/Chat";
import connectDB from "@/lib/mongoose";

export default async function handler(req, res) {
  await connectDB();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { message, chatId } = req.body;

  if (!chatId || !message) {
    return res
      .status(400)
      .json({ error: "User ID and a Text Message is required" });
  }

  try {
    await sendMessage(chatId, message);
    await Chat.findOneAndUpdate(
      { "user.id": chatId },
      {
        $push: {
          chat: {
            text: message,
            metadata: {
              role: "assistant",
            },
          },
        },
      }
    );

    return res.status(200).json("Message was Sent!");
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
