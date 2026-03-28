import axios from "axios";
import { handlePhotoFile } from "@/lib/telegramPhoto";
import User from "@/models/User";
import Chat from "@/models/Chat";
import PendingOrder from "@/models/PendingOrder";
import connectDB from "@/lib/mongoose";
import { findEnrichedParts } from "@/helpers/orderParts";
import { isMessageProcessed, markMessageProcessed } from "@/lib/redis";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

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
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text,
    });
  } catch (error) {
    console.error("Failed to send Telegram message:", error.message);
  }
}

export default async function handler(req, res) {
  await connectDB();

  if (req.method === "POST" || req.method === "PUT") {
    const { message } = req.body;

    if (!message || !message.chat?.id) {
      return res.status(200).json({ status: "ignored" });
    }

    const chatId = message.chat.id;
    const messageId = message.message_id;

    // ✅ Check Redis for duplicate
    try {
      const alreadyProcessed = await isMessageProcessed(chatId, messageId);
      if (alreadyProcessed) {
        console.log(`[SKIP] Duplicate message_id: ${messageId} (Redis)`);
        return res.status(200).json({ status: "ignored" });
      }
    } catch (err) {
      console.error("Redis check failed, proceeding anyway:", err);
      // Fail-open: process the message if Redis is unavailable
    }

    // ✅ Skip bot messages
    if (message.from?.is_bot) {
      console.log(`[SKIP] Message from bot: ${message.from.username}`);
      return res.status(200).json({ status: "ignored" });
    }

    // ✅ Respond to Telegram IMMEDIATELY (prevent retries)
    res.status(200).json({ status: "accepted" });

    // ✅ Mark as processed in Redis (fire-and-forget, don't await)
    markMessageProcessed(chatId, messageId).catch((err) => {
      console.error("Failed to mark message as processed in Redis:", err);
    });

    // ✅ Process message in background
    processMessageInBackground(message).catch((err) => {
      console.error("Background processing failed:", err);
    });

    return; // Important: don't continue with synchronous logic
  }

  return res.status(405).json({ error: "Method not allowed" });
}

// --- Background processing function ---
async function processMessageInBackground(message) {
  await connectDB(); // Reconnect if needed

  const chatId = message.chat.id;

  try {
    // 🔁 Your existing logic goes here:
    if (message.contact) {
      // ... [Your existing contact/order creation logic - unchanged] ...
      const phoneNumber = message.contact.phone_number;
      console.log("Received phone number:", phoneNumber);

      await sendMessage(
        chatId,
        `Creating an order using phone number: ${phoneNumber}`,
      );

      const pendingOrder = await PendingOrder.findOne({ chatId }).lean();
      if (!pendingOrder) {
        await sendMessage(chatId, "No pending order found.");
        return;
      }

      const chatDoc = await Chat.findOne({ "user.id": chatId }).lean();
      const vin = chatDoc?.chat ? extractVinFromChat(chatDoc.chat) : null;

      const enrichedParts = findEnrichedParts(
        pendingOrder.partNumbers,
        chatDoc,
      );
      const plainParts = enrichedParts.map((p) =>
        p.toObject ? p.toObject() : p,
      );

      // Validate each part has required fields
      for (const part of plainParts) {
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

      const orderId = Math.floor(
        10000000000 + Math.random() * 900000,
      ).toString();

      const vinRes = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/py/vin_data`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vin: vin?.toUpperCase().trim(),
          }),
        },
      );
      const carData = await vinRes.json();

      const newUser = new User({
        phone: phoneNumber,
        name: message.from?.first_name || "Unknown",
        isVerified: true,
        car: {
          vin,
          make: "",
          model: "",
          year: 0,
          color: "",
          mileage: 0,
          licensePlate: "",
          engine: "",
          transmission: "",
          driveType: "",
          fuelType: "",
        },
        parts: [
          {
            id: orderId,
            items: enrichedParts.map((part) => ({
              partId: Math.floor(100000 + Math.random() * 900000).toString(),
              name: part.partName,
              brand: part.brand,
              article: part.article,
              quantity: part.orderQuantity,
              price: part.partPrice,
              source: part.sources[0] || "unknown",
            })),
            purchaseDate: new Date(),
          },
        ],
        chatId: {
          source: "telegram",
          id: chatId.toString(),
        },
      });

      await newUser.save();
      await PendingOrder.deleteOne({ chatId });

      await sendMessage(
        chatId,
        `✅ Your Order Has Been Successfully Created! Your Order Id is ${orderId}!`,
      );
      await sendMessage(
        chatId,
        "We Also Have Repair Work Services, Do You Want To Make An Appointment?",
      );

      await Chat.findOneAndUpdate(
        { "user.id": chatId.toString() },
        {
          $push: {
            chat: {
              text:
                `✅ Your Order Has Been Successfully Created! Your Order Id is ${orderId}!\n` +
                `[SYSTEM_META: order_id="${orderId}"]`,
              metadata: { role: "assistant" },
            },
          },
        },
      );
      await Chat.findOneAndUpdate(
        { "user.id": chatId.toString() },
        {
          $push: {
            chat: {
              text: "We Also Have Repair Work Services, Do You Want To Make An Appointment?",
              metadata: { role: "assistant" },
            },
          },
        },
      );
    } else {
      // ... handle text/photo + call /api/chat/user-question
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

      // 🔥 NEW: Detect pagination/"show more" requests
      const isShowMoreRequest = textContent
        .toLowerCase()
        .match(
          /show more|next|еще|показать|больше|далее|more options|продолжить/,
        );

      // 🔥 NEW: Get last searched part number from chat history if this is a "show more" request
      let lastPartNumber = null;
      if (isShowMoreRequest) {
        const chatDoc = await Chat.findOne({ "user.id": chatId }).lean();
        if (chatDoc?.chatData?.length > 0) {
          // Get the most recent search result
          const lastSearch = chatDoc.chatData[chatDoc.chatData.length - 1];
          lastPartNumber = lastSearch.original?.article;
          console.log(`🔄 Pagination request for part: ${lastPartNumber}`);
        }
      }

      // 🔥 Prepare functionArgs for pagination or normal search
      const functionArgs = isShowMoreRequest
        ? {
            showMore: true,
            partNumber: lastPartNumber,
            partName1: textContent, // Keep original message for context
          }
        : {
            partName1: textContent,
            vin: extractVinFromChat([message]) || "",
          };

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
            functionArgs, // 🔥 Pass functionArgs for pagination detection
          }),
        },
      );

      const data = await apiResponse.json();
      console.log("Response from /api/chat/user-question:", data);

      if (data.response) {
        await sendMessage(chatId, data.response);
      } else {
        await sendMessage(chatId, "Sorry, no response was generated.");
      }
    }
  } catch (err) {
    console.error("Error in background processing:", err);
    // Optionally send error message to user
    await sendMessage(chatId, `❌ Error: ${err.message}`);
  }
}
