import connectDB from "@/lib/mongoose";
import Chat from "@/models/Chat";
import { OpenAI } from "openai";

// Initialize MongoDB connection
connectDB();

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed. Use POST.",
    });
  }

  try {
    const { user, chat } = req.body;

    // Validate required fields
    if (!user || typeof user !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing 'user' field (expected string).",
      });
    }

    if (!Array.isArray(chat) || chat.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty 'chat' array.",
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "sk-your-default-api-key",
    });

    // Process all messages with error handling per message
    const processedChat = await Promise.all(
      chat.map(async (message) => {
        try {
          // Validate message structure
          if (!message.text || typeof message.text !== "string") {
            console.warn("Skipping invalid message:", message);
            return null;
          }

          // Generate embedding if text exists
          const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-ada-002",
            input: message.text.trim(),
          });

          const embedding = embeddingResponse.data[0].embedding;

          // Validate embedding dimensions (1536 for text-embedding-ada-002)
          if (embedding.length !== 1536) {
            throw new Error(`Invalid embedding length: ${embedding.length}`);
          }

          return {
            text: message.text.slice(0, 1000), // Enforce maxlength
            embedding: embedding,
            metadata: {
              role: message.metadata?.role || "user", // Default to 'user'
              createdAt: new Date(),
            },
          };
        } catch (error) {
          console.error("Failed to process message:", message, error);
          return null; // Skip failed messages
        }
      })
    );

    // Remove null entries (invalid messages)
    const validChat = processedChat.filter(Boolean);

    // Save to MongoDB
    const isChat = await Chat.exists({ user: user });

    if (!isChat) {
      const newChat = new Chat({
        user: user,
        chatData: [],
        chat: validChat,
      });
      await newChat.save();

      return res.status(201).json({
        success: true,
        data: {
          user: newChat.user,
          chatData: [],
          chat: newChat.chat,
          createdAt: newChat.createdAt,
        },
      });
    } else {
      const userChat = await Chat.findOne({ user: user });

      const updatedChat = await Chat.findOneAndUpdate(
        { user: user },
        {
          user: user,
          chatData: [...userChat.chatData],
          chat: [...userChat.chat.slice(1), validChat],
        },
        { new: true } // This ensures you get the updated document
      );

      if (!updatedChat) {
        return res.status(404).json({
          success: false,
          message: "Chat not found",
        });
      }

      return res.status(200).json({
        // Changed to 200 since this is an update
        success: true,
        data: {
          user: updatedChat.user,
          chatData: updatedChat.chatData,
          chat: updatedChat.chat,
          updatedAt: updatedChat.updatedAt,
        },
      });
    }
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}
