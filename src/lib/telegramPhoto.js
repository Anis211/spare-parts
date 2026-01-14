import axios from "axios";
import { sendMessage } from "@/pages/api/bot-webhooks/telegram-webhook";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Get file URL and download
export async function handlePhotoFile(fileId, chatId) {
  try {
    // 1. Get file info from Telegram
    const fileRes = await axios.get(
      `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
    );

    const filePath = fileRes.data.result.file_path; // e.g., "photos/abc123.jpg"

    // 2. Construct direct download URL
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;

    return fileUrl;
  } catch (error) {
    console.error("Error handling photo:", error);
    await sendMessage(chatId, "❌ Failed to process image.");
  }
}
