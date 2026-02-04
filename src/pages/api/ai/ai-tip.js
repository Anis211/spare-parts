import connectDB from "@/lib/mongoose";
import { OpenAI } from "openai";
import Chat from "@/models/Chat";
import User from "@/models/User";
import {
  MicroBatcher,
  openaiMessagesTransportFactory,
} from "@/lib/microBatcher.js";
import { createLimitedCaller } from "@/lib/limiterBackoff";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 10000, // reduced timeout
});

// Keep your existing rate limiter & batcher (they're fine)
const REQS_PER_MIN = 60;
const ratePerSec = REQS_PER_MIN / 60;
const burstCapacity = 60;
const limitedCall = createLimitedCaller({ ratePerSec, burstCapacity });

const chatBatcher = new MicroBatcher({
  maxBatchSize: 16,
  maxWaitMs: 50,
  transport: openaiMessagesTransportFactory({ openai }),
});

const llmChat = (messages, options = {}) =>
  limitedCall(
    async () => {
      return chatBatcher.enqueue({ messages, options });
    },
    {
      cost: 1,
      backoffOpts: {
        maxRetries: 3, // reduced retries for speed
        baseMs: 100,
        onShouldRetry: (err) => {
          const code = err?.code;
          const status = err?.status ?? err?.response?.status;
          const transientNet = [
            "ETIMEDOUT",
            "ECONNRESET",
            "EAI_AGAIN",
          ].includes(code);
          return (
            transientNet || status === 429 || (status >= 500 && status <= 599)
          );
        },
      },
    }
  );

function parseJsonFromLlmResponse(str) {
  if (typeof str !== "string") return null;

  const cleaned = str
    .replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/g, "$1")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);

    if (Array.isArray(parsed)) {
      if (
        parsed.every(
          (item) => item && typeof item === "object" && !Array.isArray(item)
        )
      ) {
        return parsed;
      }
      return null;
    }

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return [parsed];
    }

    return null;
  } catch (e) {
    console.warn("Failed to parse LLM JSON response:", str);
    return null;
  }
}

export const config = {
  api: {
    bodyParser: { sizeLimit: "5mb" },
  },
};

export default async function handler(req, res) {
  await connectDB();

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed. Use POST." });
  }

  try {
    const { chatId } = req.body;
    if (!chatId) {
      return res
        .status(400)
        .json({ success: false, message: "chatId is required" });
    }

    const user = await User.findOne({ "chatId.id": chatId }).lean();
    const chatData = await Chat.findOne({ "user.id": chatId }).lean();

    if (!user || !chatData) {
      return res
        .status(404)
        .json({ success: false, message: "User or chat not found" });
    }

    // ✂️ COMPACT USER CONTEXT (critical for speed)
    const compactUser = {
      name: user.name || "",
      phone: user.phone || "",
      cars: (user.cars || []).map((c) => ({
        make: c.make || "",
        model: c.model || "",
        year: c.year || null,
      })),
      activeRepairs: (user.repairWorks || []).filter(
        (r) => r.status !== "completed"
      ).length,
      pendingOrders: (user.parts || []).filter(
        (p) => p.purchaseStatus === "pending"
      ).length,
      lastVisit: user.lastVisit
        ? new Date(user.lastVisit).toISOString().split("T")[0]
        : null,
    };

    // 📝 LAST 3 MESSAGES ONLY
    const recentChat = (chatData.chat || [])
      .slice(-15)
      .map(
        (m) =>
          `${m.metadata?.role || "user"}: ${m.text?.substring(0, 200) || ""}`
      )
      .join("\n");

    const currentDate = new Date().toISOString();

    const messages = [
      {
        role: "system",
        content: `You are an AI assistant for an automotive CRM system.
Analyze the user data and generate from one to three actionable tip for the owner of the auto parts shop.

Return STRICT JSON with ONLY these fields:
{
  "type": "maintenance|warning|upsell|followup",
  "title": "Short title",
  "description": "Concise recommendation under 100 words",
  "priority": "low|medium|high"
}

Rules:
- Be extremely concise
- Do not invent data
- Output JSON only
- Use Today's date in Asia/Astana timezone is ${currentDate}.`,
      },
      {
        role: "user",
        content: `User data:\n${JSON.stringify(
          compactUser,
          null,
          0
        )}\n\nRecent chat:\n${recentChat}`,
      },
    ];

    // ⚡ USE gpt-4o-mini FOR SPEED
    const rawResponse = await llmChat(messages, { model: "gpt-4o-mini" });
    const content =
      typeof rawResponse === "string"
        ? rawResponse
        : rawResponse?.choices?.[0]?.message?.content;

    const tipsArray = parseJsonFromLlmResponse(content);

    if (!tipsArray || tipsArray.length === 0) {
      throw new Error("No valid tips found in AI response");
    }

    // Add IDs and createdAt to each tip
    const tipsWithMeta = tipsArray.map((tip) => ({
      id: Math.floor(10000000000 + Math.random() * 900000).toString(),
      ...tip,
      createdAt: new Date().toISOString().split("T")[0],
    }));

    // Replace aiTips array in DB
    await User.findOneAndUpdate(
      { "chatId.id": chatId },
      { $set: { aiTips: tipsWithMeta } }
    );

    return res.status(200).json(tipsWithMeta);
  } catch (err) {
    console.error("AI Tip API error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to generate AI tip",
    });
  }
}
