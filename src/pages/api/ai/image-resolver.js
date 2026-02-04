import { OpenAI } from "openai";
import {
  MicroBatcher,
  openaiMessagesTransportFactory,
} from "@/lib/microBatcher.js";
import { createLimitedCaller } from "@/lib/limiterBackoff";
import connectDB from "@/lib/mongoose";

// === OpenAI Client Initialization ===
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
    }
  );

export const config = {
  api: {
    bodyParser: { sizeLimit: "20mb" },
  },
};

export default async function handler(req, res) {
  await connectDB();

  if (req.method != "POST") {
    res.status(500).json("Wrong request method!");
  }

  const { userImages } = req.body;
  let partName = "";

  try {
    if (Array.isArray(userImages) && userImages.length > 0) {
      const content = [
        {
          type: "text",
          text: "Identify the automotive part shown. Respond with ONLY the precise part name (e.g., 'Oil filter', 'Front brake pad', 'Alternator'). No extra words.",
        },
        ...userImages.map((url) => ({
          type: "image_url",
          image_url: { url },
        })),
      ];

      const completion = await llmChat(
        [
          {
            role: "system",
            content:
              "You are an expert auto parts identifier. Return ONLY the part name. No punctuation, no extra words, like ('Oil filter', 'Alternator') (the output needs to be in russian language). If you cannot identify, respond with 'Unknown'.",
          },
          { role: "user", content },
        ],
        { model: "gpt-4o", temperature: 0 }
      );

      let detected = completion.choices?.[0]?.message?.content?.trim() || "";
      detected = detected.replace(/^"|"$/g, "").replace(/\s+/g, " ").trim();

      if (detected && detected.toLowerCase() !== "unknown") {
        partName = detected;
      } else {
        res
          .status(500)
          .json("Couldn't detect the part name from user images list!");
      }

      res.status(200).json({ partName: partName });
    } else {
      res.status(500).json("Incorrect user images list!");
    }
  } catch (err) {
    res.status(500).json("Error while resolving user images: ", err.message);
  }
}
