import connectDB from "@/lib/mongoose";
import { OpenAI } from "openai";

import Worker from "@/models/admin/RepairWorker";
import {
  MicroBatcher,
  openaiMessagesTransportFactory,
} from "@/lib/microBatcher.js";
import { createLimitedCaller } from "@/lib/limiterBackoff";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
});

// === Rate limiter + backoff configuration ===
const REQS_PER_MIN = 60;
const ratePerSec = REQS_PER_MIN / 60;
const burstCapacity = 60;
const limitedCall = createLimitedCaller({ ratePerSec, burstCapacity });

// === Micro Batcher configuration ===
const chatBatcher = new MicroBatcher({
  maxBatchSize: 16,
  maxWaitMs: 50,
  transport: openaiMessagesTransportFactory({ openai }),
});

// === LLM Wrapper ===
const llmChat = (messages, options = {}) =>
  limitedCall(
    async () => {
      // MicroBatcher will call OpenAI under the hood via your transport
      return chatBatcher.enqueue({ messages, options });
    },
    {
      cost: 1, // 1 "request" per call – adjust if you want token-based costing
      backoffOpts: {
        maxRetries: 6,
        baseMs: 250,
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
    },
  );

// === Embedding Protection ===
async function safeEmbedding(input) {
  return limitedCall(
    async () => {
      return await openai.embeddings.create({
        model: "text-embedding-3-small",
        input,
      });
    },
    {
      cost: 1,
      backoffOpts: {
        maxRetries: 4,
        baseMs: 200,
      },
    },
  );
}

export const config = {
  api: {
    bodyParser: { sizeLimit: "20mb" },
  },
};

export default async function handler(req, res) {
  await connectDB();

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed. Use POST.",
    });
  }

  try {
    const { userMessages, source, id, ...rest } = req.body;
    console.log("Started user-question.js");

    if (!userMessages) {
      return res.status(400).json({
        success: false,
        message: "Missing parameters",
      });
    }

    const userQuestion = userMessages.map((text) => ({
      role: "user",
      content: [{ type: "text", text: text }],
    }));

    console.log("userQuestion: ", userQuestion);

    const worker = await Worker.findOne({ id: id }).lean();
    console.log("Worker: ", worker);
    console.log("Worker id: ", id);

    let pastMessages = worker.chat.messages.slice(
      worker.chat.messages.length - 20,
    );

    console.log("Past messages count: ", pastMessages?.length);
    console.log("Past messages: ", pastMessages);

    if (!pastMessages) {
      pastMessages = [];
    }

    let messages = [
      {
        role: "system",
        content: `
You are a helpful auto-parts assistant for a car repair worker.

Formatting (critical):
Plain text only — real line breaks.
No markdown, "\\n", asterisks, or bold.
Each item/detail on its own line.
Separate items with blank lines.
Max one emoji per line.
Clarity > brevity.
`,
      },
    ];

    if (pastMessages.length > 0) {
      pastMessages.forEach((msg) => {
        messages.push({
          role: msg.metadata.role,
          content: msg.text,
        });
      });
    }

    userQuestion.map((message) => messages.push(message));

    // === Embedding creation with strict dimension check ===
    let queryEmbedding = null;
    let textForEmbedding = "";

    if (Array.isArray(userMessages) && userMessages.length > 0) {
      textForEmbedding = userMessages.join("\n");
    } else if (typeof userQuestion === "string" && userQuestion.trim()) {
      textForEmbedding = userQuestion;
    }

    try {
      if (textForEmbedding.trim().length > 0) {
        const embeddingResponse = await safeEmbedding(textForEmbedding);
        const vec = embeddingResponse?.data?.[0]?.embedding;

        if (Array.isArray(vec) && vec.length === 1536) {
          queryEmbedding = vec;
        } else {
          console.warn(
            "Unexpected embedding dimension:",
            Array.isArray(vec) ? vec.length : "no embedding",
          );
          queryEmbedding = null; // do NOT save invalid embeddings
        }
      } else {
        queryEmbedding = null;
      }
    } catch (embeddingError) {
      console.warn("Embedding failed:", embeddingError);
      queryEmbedding = null; // null instead of []
    }

    // First LLM call with tools
    const firstResponse = await llmChat(messages, {
      model: "gpt-4o",
      temperature: 1,
    });

    const responseMessage = firstResponse.choices[0].message;
    let finalResponse;
    let matchedPartIds = [];
    let chatData = null;

    const aiResponse = responseMessage.content;

    // Save chat
    const combinedUserText =
      Array.isArray(userMessages) && userMessages.length > 0
        ? userMessages.join("\n")
        : String(userQuestion || "");

    const chatUpdate = {
      text: combinedUserText,
      metadata: {
        role: "user",
        createdAt: new Date(),
        multi: Array.isArray(userMessages) && userMessages.length > 1,
        messages:
          Array.isArray(userMessages) && userMessages.length > 0
            ? userMessages
            : [combinedUserText],
      },
    };

    if (Array.isArray(queryEmbedding) && queryEmbedding.length === 1536) {
      chatUpdate.embedding = queryEmbedding;
    }

    const assistantMessage = {
      text: aiResponse,
      metadata: {
        role: "assistant",
        createdAt: new Date(),
      },
    };
    const existingWorker = await Worker.findOne({ id });

    if (existingWorker) {
      await Worker.updateOne(
        { id },
        {
          $push: {
            "chat.messages": {
              $each: [chatUpdate, assistantMessage],
            },
          },
        },
        { runValidators: true },
      );

      if (chatData != null) {
        const alreadyExists =
          Array.isArray(existingChat.chatData) &&
          existingChat.chatData.some(
            (item) =>
              item?.original?.article === chatData.original?.article &&
              item?.original?.name === chatData.original?.name,
          );

        if (!alreadyExists) {
          await Worker.updateOne(
            { id },
            {
              $push: {
                chatData: chatData,
              },
            },
          );
        }
      }
    }

    res
      .status(200)
      .json({ response: aiResponse, matchedPartIds, success: true });
  } catch (error) {
    console.error("API Error:", error);

    if (
      error.message?.includes("timeout") ||
      error.message?.includes("timed out")
    ) {
      return res.status(408).json({
        success: false,
        message: "Request timeout. Please try again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}
