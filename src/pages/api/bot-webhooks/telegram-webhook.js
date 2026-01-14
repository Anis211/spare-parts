import axios from "axios";
import { handlePhotoFile } from "@/lib/telegramPhoto";
import User from "@/models/User";
import Chat from "@/models/Chat";
import PendingOrder from "@/models/PendingOrder";
import connectDB from "@/lib/mongoose";
import { findEnrichedParts } from "@/helpers/orderParts";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
connectDB();

function extractVinFromChat(chatMessages) {
  const vinRegex = /\b[A-HJ-NPR-Z0-9]{17}\b/g;
  if (!Array.isArray(chatMessages)) return null;

  for (const message of chatMessages) {
    if (typeof message?.text === "string") {
      const match = message.text.match(vinRegex);
      if (match) return match[0];
    }
  }
  return null;
}

export async function sendMessage(chatId, text) {
  if (!BOT_TOKEN) {
    console.error("Missing TELEGRAM_BOT_TOKEN");
    return;
  }

  try {
    // ✅ Fixed URL: no extra space
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text,
    });
  } catch (error) {
    console.error("Failed to send Telegram message:", error.message);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;

  if (!message || !message.chat?.id) {
    return res.status(200).json({ status: "ignored" });
  }

  const chatId = message.chat.id;
  console.log("Received message from Telegram:", message);

  // ✅ Handle contact sharing — create user WITH NESTED parts.items
  if (message.contact) {
    try {
      const phoneNumber = message.contact.phone_number;
      console.log("Received phone number:", phoneNumber);

      await sendMessage(
        chatId,
        `Creating an order using phone number: ${phoneNumber}`
      );

      const pendingOrder = await PendingOrder.findOne({ chatId });
      if (!pendingOrder) {
        await sendMessage(chatId, "No pending order found.");
        return res.status(200).json({ status: "no pending order" });
      }

      const chatDoc = await Chat.findOne({ "user.id": chatId });
      const vin = chatDoc?.chat ? extractVinFromChat(chatDoc.chat) : null;

      const enrichedParts = findEnrichedParts(
        pendingOrder.partNumbers,
        chatDoc
      );
      console.log("Enriched parts:", enrichedParts);

      // Validate each part has required fields
      for (const part of enrichedParts) {
        if (
          !part.brand ||
          !part.partName ||
          !part.article ||
          part.orderQuantity == null ||
          part.partPrice == null
        ) {
          throw new Error("Missing required part data");
        }
      }

      const newUser = new User({
        phone: phoneNumber,
        name: message.from?.first_name || "Unknown",
        isVerified: true,
        cars: vin ? [{ vin, make: "", model: "", year: 0 }] : [],
        parts: [
          {
            items: enrichedParts.map((part) => ({
              id: Math.floor(100000 + Math.random() * 900000).toString(),
              name: part.partName,
              brand: part.brand,
              article: part.article,
              quantity: part.orderQuantity,
              price: part.partPrice,
            })),
            purchaseDate: new Date(),
            purchaseStatus: "pending",
            repairWorkId: null,
          },
        ],
        chatId: {
          source: "telegram",
          id: chatId.toString(),
        },
      });

      await newUser.save();
      await PendingOrder.deleteOne({ chatId });

      await sendMessage(chatId, "✅ Your Order Has Been Successfully Created!");
      await sendMessage(
        chatId,
        "We Also Have Repair Work Services, Do You Want To Make An Appointment?"
      );
      return res.status(200).json({ success: true, phoneNumber });
    } catch (err) {
      console.error("Error creating order:", err);
      await sendMessage(chatId, `❌ Error: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }
  }

  // ✅ Handle regular messages
  try {
    let userMessages = [];
    let userImages = [];

    if (message.photo) {
      const photo = message.photo[message.photo.length - 1];
      const fileId = photo.file_id;
      const caption = message.caption || "";

      await sendMessage(chatId, "📸 Received your image!");
      const fileUrl = await handlePhotoFile(fileId, chatId, caption);
      userImages.push(fileUrl);
    }

    const textContent = message.text || message.caption || "";
    if (textContent) userMessages.push(textContent);

    const apiResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/chat/user-question`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessages,
          userImages,
          source: "telegram",
          chatId,
        }),
      }
    );

    const data = await apiResponse.json();
    console.log("Response from /api/chat/user-question:", data);

    if (data.response) {
      await sendMessage(chatId, data.response);
    } else {
      await sendMessage(chatId, "Sorry, no response was generated.");
    }

    return res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Webhook error:", error);
    await sendMessage(
      chatId,
      "An error occurred while processing your message."
    );
    return res.status(500).json({ error: "Internal server error" });
  }
}
