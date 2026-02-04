import connectDB from "@/lib/mongoose";
import { OpenAI } from "openai";
import axios from "axios";

import Chat from "@/models/Chat";
import User from "@/models/User";
import PendingOrder from "@/models/PendingOrder";
import Worker from "@/models/admin/RepairWorker";
import Calendar from "@/models/Calendar";
import Alatrade from "@/models/Alatrade";
import Reservation from "@/models/admin/Reservation";

import { getGrid } from "@/lib/gridfs";
import { tonEncode } from "@/lib/ton";
import {
  MicroBatcher,
  openaiMessagesTransportFactory,
} from "@/lib/microBatcher.js";
import { createLimitedCaller } from "@/lib/limiterBackoff";
import Semaphore from "@/lib/bulkhead";
import CircuitBreaker from "@/lib/circuitBreaker";

import { sendMessage } from "../bot-webhooks/telegram-webhook";
import { findEnrichedParts } from "@/helpers/orderParts";
import {
  toUTCDateOnly,
  addHoursToTime,
  checkTimePeriodAvailability,
} from "@/lib/dateUtils";

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

// === Embedding Protection ===
async function safeEmbedding(input) {
  return limitedCall(
    async () => {
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input,
      });
      return embeddingResponse;
    },
    {
      cost: 1,
      backoffOpts: {
        maxRetries: 4,
        baseMs: 200,
      },
    }
  );
}

// === Wrapper For Bulkhead And Circuit Breaker ===
function resilientVendorCall(breaker, semaphore, fn) {
  return breaker.exec(() => semaphore.run(fn));
}

export const config = {
  api: {
    bodyParser: { sizeLimit: "20mb" },
  },
};

// === Function That Shortens Analogs ===
function toShortSchema(original, analogs) {
  // original: {name,brand,article}
  const O = original
    ? {
        n: original.name ?? null,
        b: original.brand ?? null,
        a: original.article ?? null,
      }
    : null;

  const A = (analogs || []).map((x) => ({
    s: x.source ?? null, // source
    a: x.article ?? null, // article
    b: x.brand ?? null, // brand
    n: x.name ?? null, // name
    k: (x.stocks || []).map((st) => ({
      pr: st.partPrice ?? null, // price
      ct: st.place ?? null, // city/place
      qt: st.quantity ?? null, // quantity if present
      ds: st.delivery?.start ?? null, // delivery start
      de: st.delivery?.end ?? null, // delivery end
    })),
  }));

  return { O, A };
}

// === Parser For Reservation Data ===
function parseReservationResponse(str) {
  if (typeof str !== "string") return null;
  let cleaned = str.replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/g, "$1").trim();

  cleaned = cleaned.replace(/\\ /g, "\\\\ ");

  if (!cleaned) return null;

  try {
    const parsed = JSON.parse(cleaned);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return null;
    if (typeof parsed.confirmationMessage !== "string") return null;
    if (!Array.isArray(parsed.services)) return null;

    for (const service of parsed.services) {
      if (!service || typeof service !== "object" || Array.isArray(service))
        return null;
      if (
        typeof service.serviceType !== "string" ||
        typeof service.description !== "string"
      )
        return null;
      if (!Array.isArray(service.parts)) return null;

      for (const part of service.parts) {
        if (!part || typeof part !== "object" || Array.isArray(part))
          return null;
        if (
          typeof part.id !== "string" ||
          typeof part.name !== "string" ||
          typeof part.partNumber !== "string" ||
          typeof part.quantity !== "number" ||
          typeof part.unitPrice !== "number"
        )
          return null;
        if (part.quantity <= 0 || part.unitPrice < 0) return null;
      }
    }

    return parsed;
  } catch (e) {
    console.warn(
      "Failed to parse reservation response after fixes:",
      e.message
    );
    console.warn("Problematic string snippet:", cleaned.substring(0, 200));
    return null;
  }
}

export default async function handler(req, res) {
  await connectDB();

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed. Use POST.",
    });
  }

  try {
    const { userMessages, userImages, source, ...rest } = req.body;
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

    userImages.length > 0 &&
      source != "chat" &&
      userImages.map((imageUrl) =>
        userQuestion[userQuestion.length - 1].content.push({
          type: "image_url",
          image_url: { url: imageUrl },
        })
      );

    console.log("userQuestion: ", userQuestion);
    console.log("userImages: ", userImages);

    let pastMessages = await Chat.find({ "user.id": rest.chatId })
      .sort({ createdAt: -1 })
      .limit(20);

    if (!pastMessages) {
      pastMessages = [];
    }

    const currentDate = new Date().toISOString().split("T")[0];

    let messages = [
      {
        role: "system",
        content: `
You are a helpful auto-parts assistant with 3 functions:

1. scrape_website – find analogs for parts.
2. order_parts – confirm user orders.
3. find_and_send_pictures – show part images.

scrape_website rules:
if there is images: ['url', 'url'] in the user message then it is the image user have provided to you.
if the userImages is not an empty list then it is most likely an image of the part.
Use only if the user asks about part stock, price, analogs, or sends a photo of the part he needs.
Ask VIN if missing; never repeat requests for part name.
Do NOT use for general car or maintenance questions.
Use exact part number from DB.
Show all analogs returned (no skipping).
Each item must include: name, brand, base_price, and stocks → (city only, readable timing, quantity).
Exclude OE numbers, links, addresses.
Speak in user's language, friendly tone.
Do not output images unless asked.
Output the part name and brands exactly how they are in the data recieved, do not shorten them or use part name for the other brand, but do not include article of the part in part name, if there is 7 parts you must output all 7 of them

order_parts rules:
Use when the user wants or confirms an order.
Reply friendly confirmation listing ordered parts.

Example:
Your order is confirmed! 🎉
1) STELLOX Oil Filter
2) KS Oil Filter

find_and_send_pictures rules:
Use when user asks to see or compare a part.
Return exactly: images: ["url1","url2","url3"]

make_reservation rules:
Use when user asks for a repair work service reservation.
Use to continue the reservation process when user gives the time period he/she is comfortable to visit the shop.
Today's date in Asia/Almaty timezone is ${currentDate}.
All user requests refer to this timezone.
When the user wants to book a repair reservation, check the chat history for any recent part orders.
Look for lines containing [SYSTEM_META: ...] — these contain structured data.
Extract the 'part_ids' array from it and use those exact strings as the 'repairPartsIds' parameter in 'make_reservation'.
Example: [SYSTEM_META: order_id="ORD789"] → use ["ORD789"].
Do NOT guess part IDs. Only use those from SYSTEM_META.

Formatting (critical):
Plain text only — real line breaks.
No markdown, "\\n", asterisks, or bold.
Each item/detail on its own line.
Separate items with blank lines.
Max one emoji per line.
Clarity > brevity.

If tool content is TON {h,d,b} with {$:i} references, read by replacing {$:i} with d[i].
Decoded schema: O={n,b,a}, A=[{s,a,b,n,k:[{pr,ct,qt,ds,de}]}].

Example output:
Alternatives for "Oil Filter":

1) BMW
  🔧 Oil Filter Insert
  💰 2,453
  📍 In Astana — available today

2) Mann
  🔧 Oil Filter Insert
  💰 925
  📍 In Karaganda — pick up today

Need help choosing? 🚗💨
`,
      },
    ];

    if (pastMessages.length > 0) {
      pastMessages.forEach((item) => {
        item.chat.forEach((msg) => {
          messages.push({
            role: msg.metadata.role,
            content: msg.text,
          });
        });
      });
    }

    userQuestion.map((message) => messages.push(message));

    const tools = [
      {
        type: "function",
        function: {
          name: "scrape_website",
          description: "Scrape the website to get part details and analogs",
          parameters: {
            type: "object",
            properties: {
              partName1: {
                type: "string",
                description:
                  "The part name to search for (it must to be translated to russian language, translate is perfectly accurate for example 'tie rod' is the 'рулевая тяга' it is not 'рулевой наконечник') (if in user message is no part name at all return 'nothing' as the partName1)",
              },
              vin: {
                type: "string",
                description: "The VIN code of the user's car",
              },
            },
            required: ["partName1", "vin"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "order_parts",
          description: "Order the selected parts for the user",
          parameters: {
            type: "object",
            properties: {
              partNumbers: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    partName: {
                      type: "string",
                      description:
                        "It is the name of the part being ordered (it must be the same as it is in the previous message history)",
                    },
                    brand: { type: "string" },
                    orderQuantity: { type: "number", minimum: 1 },
                    partPrice: { type: "number" },
                  },
                  required: ["orderQuantity", "partName", "partPrice", "brand"],
                },
                description:
                  "Array of objects that contains: brand, partName, quantity on the brand and partName, and if the analog is from stock then analogDist.fromStock is true and the analogDist.place will contain the , else analogDist is false",
              },
            },
            required: ["partNumbers"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "find_and_send_pictures",
          description:
            "You need to get the name and brand of the part the user is talking about and send a url of the picture to the client side",
          parameters: {
            type: "object",
            properties: {
              partData: {
                type: "object",
                properties: {
                  partName: {
                    type: "string",
                    description:
                      "It is the exact name of the part that you have sent to the user before from scraping website function (it must to be translated to russian language)",
                  },
                  brand: {
                    type: "string",
                    description:
                      "It is the brand of the part that user wants to see",
                  },
                },
                required: ["partName", "brand"],
              },
            },
            required: ["partData"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "make_reservation",
          description:
            "You need to get the repair work service type that needs to be done to the clients car and the speciality of worker needed among: ['General Maintenance', 'Brake Systems', 'Engine Diagnostics'], depending on what parts he/she bought or the service type client asked for",
          parameters: {
            type: "object",
            properties: {
              serviceTypes: {
                type: "array",
                items: {
                  type: "string",
                  description:
                    "It is the repair work service type that need to be applied to clients car needs according to the parts being ordered before",
                },
              },
              repairPartsIds: {
                type: "array",
                items: {
                  type: "string",
                  description:
                    "It is the list of order parts ids that are connected to the serviceType client needs. Take the parts order id from the chat history",
                },
              },
              speciality: {
                type: "string",
                description:
                  "It is the speciality of the repair worker that can do the serviceType work",
              },
              date: {
                type: "string",
                description:
                  "It is the specified by the client date when he has free time to visit the shop, if there is not date return 'nothing', else the date should look like this 'year-month-day' for example '2024-05-12'",
              },
              time: {
                type: "string",
                description:
                  "It is the time period when the user is comfortable to make reservation, it should look like this '16:00' which is the start time for the repair service. If the time is not defined return 'nothing'",
              },
              duration: {
                type: "number",
                description:
                  "It is the approximated duration of the repair work process, depending on the serviceType needed to be done. The lowest duration value can be one hour, the value is counted in hours like '1' or '1.5'",
              },
            },
          },
          required: ["serviceType", "speciality", "date", "time", "duration"],
        },
      },
    ];

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
            Array.isArray(vec) ? vec.length : "no embedding"
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
      tools,
      tool_choice: "auto",
      temperature: 1,
    });

    const responseMessage = firstResponse.choices[0].message;
    let finalResponse;
    let matchedPartIds = [];
    let chatData = null;

    // ✅ Handle tool calls
    if (responseMessage.tool_calls) {
      const toolCall = responseMessage.tool_calls[0];
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      // Declare partNumber here so it's accessible in catch
      let partNumber;

      if (functionName === "scrape_website") {
        console.log("Started Scrape Website");
        if (source !== "chat") {
          // Handle non-chat sources (e.g., Telegram)
          if (source === "telegram" && rest.chatId) {
            await sendMessage(
              rest.chatId,
              `🔍 Searching for part "${functionArgs.partName1}" using VIN ${functionArgs.vin}...`
            );
          }
        }

        const { partName1, vin } = functionArgs;
        let partName = partName1;

        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL || `http://${req.headers.host}`;

        console.log("User Images:", userImages);

        // If user sent images and did NOT supply a part name, extract from image
        if (
          Array.isArray(userImages) &&
          userImages.length > 0 &&
          partName1 === "nothing"
        ) {
          // content = text + images (data URLs or http(s) URLs)
          const content = [
            {
              type: "text",
              text: "Identify the automotive part shown. Respond with ONLY the precise part name (e.g., 'Oil filter', 'Front brake pad', 'Alternator'). No extra words.",
            },
            ...userImages.map((url) => ({
              type: "image_url",
              image_url: { url }, // must be { type:'image_url', image_url:{ url } }
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

          let detected =
            completion.choices?.[0]?.message?.content?.trim() || "";
          detected = detected.replace(/^"|"$/g, "").replace(/\s+/g, " ").trim();

          if (detected && detected.toLowerCase() !== "unknown") {
            partName = detected;
          }
        }

        try {
          console.log("Fetching part number for:", partName, vin);

          const partRes = await fetch(`${baseUrl}/api/mock/mock?vin=${vin}`);
          const carData = await partRes.json();
          const resText = `Found data for vin number ${vin}: ${
            carData.success ? JSON.stringify(carData.data) : "No data found"
          }`;

          // Ask LLM to extract part number
          const extractionMessages = [
            {
              role: "system",
              content: `You are an expert automotive parts matcher. The user will provide a short query (e.g., "oil filter", "front brake pad"). 
You will be given a list of available parts with their display names and part numbers.
Your task:
- Find the SINGLE most relevant part based on the user's query.
- Return ONLY the exact part number (e.g., "12345-ABC") — nothing else.
- If no match is found, return exactly: "NOT FOUND"
- Do NOT explain, apologize, add punctuation, or markdown. Just the part number or "NOT FOUND".`,
            },
            {
              role: "user",
              content: `User query: "${partName}"
Available parts data: ${resText}`,
            },
          ];

          const aiResponse = await llmChat(extractionMessages, {
            model: "gpt-4o",
            temperature: 0,
          });
          partNumber = aiResponse.choices[0].message.content.trim();

          if (partNumber === "NOT FOUND") {
            throw new Error("No relevant part found for the given name");
          }

          // after you have: baseUrl, partNumber, partName, vin
          const proxyRosskoUrl = `${baseUrl}/api/py/link`;

          const proxyAlatradeUrl = `${baseUrl}/api/py/alatrade`;
          const proxyAlatradeAuthUrl = `${baseUrl}/api/py/alatrade_auth`;

          const proxyShatemUrl = `${baseUrl}/api/py/shatem`;
          const proxyShatemAuthUrl = `${baseUrl}/api/py/shatem_auth`;
          const SHATEM_AGREEMENT = "KSAGR00684";

          const proxyAutotradeUrl = `${baseUrl}/api/py/autotrade`;
          const proxyAutotradeAuthUrl = `${baseUrl}/api/py/autotrade_auth`;

          // ── helpers ───────────────────────────────────────────────────────────────────
          const fetchWithTimeout = (url, opts = {}, ms = 20000) => {
            const ctl = new AbortController();
            const t = setTimeout(() => ctl.abort(), ms);
            return fetch(url, { ...opts, signal: ctl.signal }).finally(() =>
              clearTimeout(t)
            );
          };

          const normalize = (s) => (s ?? "").toString().trim().toLowerCase();

          function mergeStocks(a = [], b = []) {
            // flatten + remove obvious dupes by (place, partPrice, delivery.start, delivery.end)
            const keyOf = (s) =>
              `${normalize(s.place)}|${s.partPrice}|${
                s.delivery?.start ?? ""
              }|${s.delivery?.end ?? ""}`;
            const seen = new Set();
            const out = [];
            for (const s of [...a, ...b]) {
              const k = keyOf(s);
              if (!seen.has(k)) {
                seen.add(k);
                out.push(s);
              }
            }
            return out;
          }

          // map Rossko payload into common format (with per-item `source`)
          const mapRossko = (d) => {
            const original = d?.products?.[0]
              ? {
                  name: d.products[0].name,
                  brand: d.products[0].brand,
                  guid: d.products[0].id,
                  article: d.products[0].article,
                }
              : null;

            const analogs = (d?.analogs ?? []).map((item) => ({
              source: "rossko",
              original_id: item.original_id,
              article: item.article,
              brand: item.brand,
              name: item.name,
              guid: item.guid,
              pictures: item.pictures ?? [], // usually empty for Rossko; keep field for uniformity
              stocks: (item.stocks ?? []).map((stock) => ({
                partPrice: stock.basePrice,
                place: stock.name,
                delivery: {
                  start: stock.tariffDeliveryTimingWithTimezone?.start,
                  end: stock.tariffDeliveryTimingWithTimezone?.end,
                },
              })),
            }));

            return { original, analogs };
          };

          // map Alatrade payload into common format (with per-item `source`)
          const mapAlatrade = (d) => {
            const analogs = (d?.analogs ?? []).map((item) => ({
              source: "alatrade",
              original_id: item.RVALUE,
              article: item.PIN,
              brand: item.BRAND,
              name: item.NAME,
              guid: "",
              pictures: item.IMAGES_FULL ?? [],
              stocks: [
                {
                  partPrice: item.PRICER1,
                  place: item.SNAME,
                  delivery: { start: item.DLVDT, end: item.DLVDT },
                },
              ],
            }));
            return { original: null, analogs };
          };

          async function saveToGridFS({ buffer, contentType, filename }) {
            const { bucket } = await getGrid();
            return new Promise((resolve, reject) => {
              const upload = bucket.openUploadStream(filename, {
                metadata: { contentType },
              });
              upload.on("error", reject);
              upload.on("finish", () => resolve(upload.id)); // returns ObjectId
              upload.end(buffer);
            });
          }

          async function mapShatem(d) {
            const analogs = await Promise.all(
              (d?.analogs ?? []).map(async (item) => {
                const analog_media_data = d?.analogs_media?.find(
                  (media) =>
                    media.article == item.article &&
                    media.brand == item.partInfo.tradeMarkName
                );

                const rawList = Array.isArray(analog_media_data?.media)
                  ? analog_media_data.media
                  : [];

                const pictures = await Promise.all(
                  rawList.map(async (m, idx) => {
                    try {
                      const base64 = m.value.split(",")[1];
                      const buffer = Buffer.from(base64, "base64");
                      const contentType =
                        m.value.match(/^data:(.*?);/)?.[1] || "image/jpeg";
                      const filename = `${item.article}_${item.partInfo.tradeMarkName}_${idx}.jpg`;
                      const id = await saveToGridFS({
                        buffer,
                        contentType,
                        filename,
                      });
                      return `${baseUrl}/api/images/${id.toString()}`;
                    } catch (e) {
                      console.warn("GridFS save skipped:", e.message);
                      return null;
                    }
                  })
                );

                return {
                  source: "shatem",
                  original_id: item.partInfo.id,
                  article: item.article,
                  brand: item.partInfo.tradeMarkName,
                  name: item.name,
                  guid: item.guid,
                  pictures: pictures.filter(Boolean),
                  stocks: [
                    {
                      partPrice: item.price,
                      place: item.city,
                      delivery: {
                        start:
                          item.deliveryInfo.deliveryDateTimes[0].deliveryDate,
                        end: "",
                      },
                    },
                  ],
                };
              })
            );

            return { original: null, analogs }; // <- return an object like your other mappers
          }

          const mapAutotrade = (d) => {
            const rawItems = Array.isArray(d) ? d : d?.items || [];

            const analogs = rawItems.values().map((item) => ({
              source: "autotrade",
              original_id: item.id || item.guid,
              article: item.article,
              brand: item.brand,
              name: item.name,
              guid: item.id || "",
              pictures: item.images || [],
              stocks: item.stocks
                .values()
                .filter((place) => place.name.includes("Астана"))
                .map((stock) => ({
                  partPrice: item.price,
                  place: stock.name,
                  delivery: {
                    start: stock.delivery || "1",
                    end: stock.delivery || "1",
                  },
                })),
            }));
            return { original: null, analogs };
          };

          // get/refresh Alatrade cookies in parallel with Rossko (fast)
          async function ensureAlatradeAuth() {
            let alatrade = await Alatrade.findOne({}).lean();
            const expired = (expires) => {
              if (!expires) return true;
              const d = new Date(expires);
              if (!Number.isFinite(+d)) return true;
              const exUTC = Date.UTC(
                d.getUTCFullYear(),
                d.getUTCMonth(),
                d.getUTCDate()
              );
              const now = new Date();
              const nowUTC = Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate()
              );
              return exUTC < nowUTC;
            };
            const needRefresh =
              !alatrade ||
              expired(alatrade?.ci_session?.expires) ||
              expired(alatrade?.rem_id?.expires);

            if (needRefresh) {
              const r = await fetchWithTimeout(proxyAlatradeAuthUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
              });
              const data = await r.json();
              const next = {
                ci_session: {
                  value: data?.auth_data?.find((c) => c.name === "ci_sessions")
                    ?.value,
                  expires: data?.auth_data?.find(
                    (c) => c.name === "ci_sessions"
                  )?.expires,
                },
                rem_id: {
                  value: data?.auth_data?.find((c) => c.name === "REMMEID")
                    ?.value,
                  expires: data?.auth_data?.find((c) => c.name === "REMMEID")
                    ?.expires,
                },
              };
              alatrade
                ? (alatrade = await Alatrade.findOneAndUpdate({}, next, {
                    new: true,
                    lean: true,
                  }))
                : (alatrade =
                    (await Alatrade.create(next)).toObject?.() ?? next);
            }

            return {
              ci: alatrade.ci_session.value,
              rem: alatrade.rem_id.value,
            };
          }

          async function ensureShatemAuth() {
            const r = await fetchWithTimeout(proxyShatemAuthUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            });
            if (!r.ok) throw new Error(`Shatem auth HTTP ${r.status}`);
            const data = await r.json();
            const cookies = Array.isArray(data?.auth_data)
              ? data.auth_data
              : [];

            const get = (name) =>
              cookies.find((c) => c.name === name)?.value || "";

            const antiforgery = get(".AspNetCore.Antiforgery.VyLW6ORzMgk");
            const x_access_token = get("X-Access-Token");
            const x_refresh_token = get("X-Refresh-Token");

            if (!antiforgery || !x_access_token) {
              throw new Error("Shatem auth is missing required cookies");
            }
            return { antiforgery, x_access_token, x_refresh_token };
          }

          async function ensureAutotradeAuth() {
            const r = await fetchWithTimeout(proxyAutotradeAuthUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            });
            if (!r.ok) throw new Error(`Autotrade Auth HTTP ${r.status}`);
            const data = await r.json();

            // Extract jar based on your previous python script output
            const jar = data.cookie_jar || data.auth_data?.cookie_jar;
            if (!jar) throw new Error("Autotrade auth missing cookie_jar");

            return jar;
          }

          // how many concurrent calls per vendor
          const rosskoSemaphore = new Semaphore(6);
          const alatradeSemaphore = new Semaphore(6);
          const shatemSemaphore = new Semaphore(3);
          const autotradeSemaphore = new Semaphore(6);

          // circuit breaker configs (tune as needed)
          const rosskoBreaker = new CircuitBreaker({
            failureThreshold: 0.5,
            minSamples: 10,
            cooldownMs: 30_000,
            windowMs: 60_000,
          });

          const alatradeBreaker = new CircuitBreaker({
            failureThreshold: 0.5,
            minSamples: 10,
            cooldownMs: 30_000,
            windowMs: 60_000,
          });

          const shatemBreaker = new CircuitBreaker({
            failureThreshold: 0.5,
            minSamples: 10,
            cooldownMs: 60_000,
            windowMs: 60_000,
          });

          const autotradeBreaker = new CircuitBreaker({
            failureThreshold: 0.5,
            minSamples: 10,
            cooldownMs: 30_000,
            windowMs: 60_000,
          });

          // ── run all vendors concurrently ───────────────────────────────────────────
          const alatradeTokenPromise = ensureAlatradeAuth();
          const shatemTokenPromise = ensureShatemAuth();
          const autotradeTokenPromise = ensureAutotradeAuth();

          // Rossko (bulkhead + circuit breaker)
          const rosskoPromise = resilientVendorCall(
            rosskoBreaker,
            rosskoSemaphore,
            async () => {
              const r = await fetchWithTimeout(proxyRosskoUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ partNumber, partName }),
              });
              if (!r.ok) throw new Error(`Rossko HTTP ${r.status}`);
              return r.json();
            }
          );

          // Alatrade (bulkhead + circuit breaker)
          const alatradePromise = resilientVendorCall(
            alatradeBreaker,
            alatradeSemaphore,
            async () => {
              const { ci, rem } = await alatradeTokenPromise;
              const r = await fetchWithTimeout(proxyAlatradeUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  partNumber,
                  partName,
                  ci_session: ci,
                  rem_id: rem,
                }),
              });
              if (!r.ok) throw new Error(`Alatrade HTTP ${r.status}`);
              return r.json();
            }
          );

          // Shatem (bulkhead + circuit breaker)
          const shatemPromise = resilientVendorCall(
            shatemBreaker,
            shatemSemaphore,
            async () => {
              const { antiforgery, x_access_token, x_refresh_token } =
                await shatemTokenPromise;

              const r = await fetchWithTimeout(proxyShatemUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  partNumber,
                  agreement: SHATEM_AGREEMENT,
                  partName,
                  antiforgery,
                  x_access_token,
                  x_refresh_token,
                }),
              });
              if (!r.ok) throw new Error(`Shatem HTTP ${r.status}`);
              return r.json();
            }
          );

          const autotradePromise = resilientVendorCall(
            autotradeBreaker,
            autotradeSemaphore,
            async () => {
              const jar = await autotradeTokenPromise;

              // Construct payload mapping cookie_jar keys to API expectations
              const payload = {
                q: partNumber, // Uses the extracted partNumber from LLM
                auth_key: ":auth_key",
                sessid: jar.sessid,
                ddg8: jar.__ddg8_,
                ddg9: jar.__ddg9_,
                ddg10: jar.__ddg10_,
                ddg1: jar.__ddg1_,
                lang: jar.lang,
                series: jar.series,
                logindt: jar.logindt,
              };

              const r = await fetchWithTimeout(proxyAutotradeUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });

              if (!r.ok) throw new Error(`Autotrade HTTP ${r.status}`);
              return r.json();
            }
          );
          const emptyVendor = { original: null, analogs: [] };

          const mapRosskoP = (val) => Promise.resolve(mapRossko(val));
          const mapAlatradeP = (val) => Promise.resolve(mapAlatrade(val));
          const mapShatemP = (val) => mapShatem(val);
          const mapAutotradeP = (val) => Promise.resolve(mapAutotrade(val));

          const [rossko, alatrade, shatem, autotrade] = await Promise.all([
            rosskoPromise.then(mapRosskoP).catch((e) => {
              console.error("[rossko] failed:", e?.message || e);
              return emptyVendor;
            }),
            alatradePromise.then(mapAlatradeP).catch((e) => {
              console.error("[alatrade] failed:", e?.message || e);
              return emptyVendor;
            }),
            shatemPromise.then(mapShatemP).catch((e) => {
              console.error("[shatem] failed:", e?.message || e);
              return emptyVendor;
            }),
            autotradePromise.then(mapAutotradeP).catch((e) => {
              console.error("[autotrade] failed:", e?.message || e);
              return emptyVendor;
            }),
          ]);

          console.log("rossko analogs:", rossko.analogs.length);
          console.log("alatrade analogs:", alatrade.analogs.length);
          console.log("shatem analogs:", shatem.analogs.length);
          console.log("autotrade analogs:", autotrade.analogs.length);

          // if Rossko returned an original product, prefer it for chatData.original
          let original = rossko.original ??
            alatrade.original ?? {
              name: partName,
              brand: "",
              guid: "",
              article: partNumber,
            };

          // ── combine + dedupe analogs from BOTH sources ───────────────────────────────
          const combined = [
            ...rossko.analogs,
            ...alatrade.analogs,
            ...shatem.analogs,
            ...autotrade.analogs,
          ];

          console.log("combined: ", combined);

          // key preference: article > (brand+name) when article missing
          const keyOf = (a) => {
            if (a.article && a.brand)
              return `a:${normalize(a.article)}|${normalize(a.brand)}`;
            if (a.article) return `a:${normalize(a.article)}`;
            if (a.brand && a.name)
              return `bn:${normalize(a.brand)}|${normalize(a.name)}`;
            return `n:${normalize(a.name)}`; // last resort
          };

          const mergedMap = new Map();
          for (const item of combined) {
            const k = keyOf(item);
            const prev = mergedMap.get(k);
            if (!prev) {
              mergedMap.set(k, {
                article: item.article ?? null,
                brand: item.brand ?? null,
                name: item.name ?? null,
                guid: item.guid ?? null,
                pictures: Array.isArray(item.pictures)
                  ? [...item.pictures]
                  : [],
                stocks: Array.isArray(item.stocks) ? [...item.stocks] : [],
                sources: [item.source],
              });
            } else {
              // prefer non-empty fields
              prev.article ||= item.article;
              prev.brand ||= item.brand;
              prev.name ||= item.name;
              prev.guid ||= item.guid;

              // merge arrays
              if (Array.isArray(item.pictures) && item.pictures.length) {
                const set = new Set([
                  ...(prev.pictures ?? []),
                  ...item.pictures,
                ]);
                prev.pictures = [...set];
              }
              prev.stocks = mergeStocks(prev.stocks, item.stocks ?? []);

              // track all sources (unique)
              if (!prev.sources.includes(item.source))
                prev.sources.push(item.source);
            }
          }

          const analogs = Array.from(mergedMap.values());
          chatData = { original, analogs };

          const compact = toShortSchema({}, analogs);
          const ton = tonEncode(compact);

          const functionResponseForModel = {
            fmt: "TONv1",
            ton,
            partNumber,
          };

          messages.push(responseMessage);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: functionName,
            content: JSON.stringify(functionResponseForModel),
          });

          finalResponse = await llmChat(messages, {
            model: "gpt-4o",
            max_tokens: 800,
            temperature: 0,
          });
        } catch (scrapeError) {
          console.error("Scraping error:", scrapeError);

          const errorResponse = {
            status: "error",
            message: scrapeError.message,
            partNumber: partNumber || null,
          };

          messages.push(responseMessage);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: functionName,
            content: JSON.stringify(errorResponse),
          });

          finalResponse = await llmChat(messages, {
            model: "gpt-4o",
            max_tokens: 800,
            temperature: 0,
          });
        }
      } else if (functionName === "order_parts") {
        const { partNumbers } = functionArgs;
        console.log("Started Order Parts Function");

        if (!Array.isArray(partNumbers) || partNumbers.length === 0) {
          throw new Error("No parts provided for ordering");
        }

        // Fetch user and chat
        const userData = await User.findOne({ "chatId.id": rest.chatId });
        if (!userData) {
          await PendingOrder.findOneAndUpdate(
            { chatId: rest.chatId },
            {
              chatId: rest.chatId,
              partNumbers: partNumbers,
              createdAt: new Date(),
            },
            { upsert: true, new: true }
          );

          await axios.post(
            `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
              chat_id: rest.chatId,
              text: "📱 To place your order, please share your contact:",
              reply_markup: {
                keyboard: [
                  [{ text: "📱 Share My Contact", request_contact: true }],
                ],
                resize_keyboard: true,
                one_time_keyboard: true,
              },
            }
          );

          const functionResponse = {
            status: "pending",
            message: "User not registered. Awaiting contact information.",
          };

          messages.push(responseMessage);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: functionName,
            content: JSON.stringify(functionResponse),
          });

          finalResponse = await llmChat(messages, { model: "gpt-4o" });
          return res
            .status(200)
            .json("Phone Number Reciever Has Been Sent Successfully!");
        }

        const chatDoc = await Chat.findOne({ "user.id": rest.chatId });
        if (!chatDoc || !chatDoc.chatData || chatDoc.chatData.length === 0) {
          throw new Error(
            "No previous part data found. Please search for parts first."
          );
        }

        const enrichedParts = findEnrichedParts(partNumbers, chatDoc);

        try {
          function isSameDay(date1, date2) {
            if (!date1 || !date2) return false;
            const d1 = new Date(date1);
            const d2 = new Date(date2);
            return (
              d1.getFullYear() === d2.getFullYear() &&
              d1.getMonth() === d2.getMonth() &&
              d1.getDate() === d2.getDate()
            );
          }

          const foundIndex = userData.parts.findIndex(
            (item) =>
              item.purchaseStatus === "pending" &&
              isSameDay(item.purchaseDate, new Date())
          );

          if (foundIndex !== -1) {
            console.log("Found the Pending Part");

            // Create new items to add
            const newItems = enrichedParts.map((part) => ({
              id: Math.floor(100000 + Math.random() * 900000).toString(),
              name: part.partName,
              brand: part.brand,
              article: part.article,
              quantity: part.orderQuantity,
              price: part.partPrice,
              source: part.sources[0] || "unknown",
            }));

            // Update the specific part's items
            const updatedParts = [...userData.parts];
            updatedParts[foundIndex] = {
              ...updatedParts[foundIndex],
              items: [...updatedParts[foundIndex].items, ...newItems],
            };

            // Save back to DB
            await User.findOneAndUpdate(
              { "chatId.id": rest.chatId }, // ✅ Correct path
              { $set: { parts: updatedParts } }
            );
          } else {
            const orderId = Math.floor(
              10000000000 + Math.random() * 900000
            ).toString();

            await User.findOneAndUpdate(
              {
                "chatId.id": rest.chatId,
              },
              {
                $push: {
                  parts: {
                    id: orderId,
                    items: enrichedParts.map((part) => ({
                      partId: Math.floor(
                        100000 + Math.random() * 900000
                      ).toString(),
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
                },
              }
            );
          }

          const functionResponse = {
            status: "success",
            message: `Successfully ordered ${enrichedParts.length} part(s) and OrderId ${orderId}!`,
          };

          messages.push(responseMessage);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: functionName,
            content: JSON.stringify(functionResponse),
          });

          finalResponse = await llmChat(messages, { model: "gpt-4o" });
        } catch (orderError) {
          console.error("Order error:", orderError);

          const errorResponse = {
            status: "error",
            message: orderError.message || "Failed to place order",
          };

          messages.push(responseMessage);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: functionName,
            content: JSON.stringify(errorResponse),
          });

          finalResponse = await llmChat(messages, { model: "gpt-4o" });
        }
      } else if (functionName === "find_and_send_pictures") {
        const { partData } = functionArgs;

        if ((partData.partName.length == 0, partData.brand.length == 0)) {
          throw new Error("No parts data provided to find a proper photo!");
        }

        const chatDoc = await Chat.findOne({ "user.id": rest.chatId });
        if (!chatDoc || !chatDoc.chatData || chatDoc.chatData.length === 0) {
          throw new Error(
            "No previous part data found. Please search for parts first."
          );
        }

        console.log("Looking for pictures of:", partData);
        console.log(
          "Available chatData:",
          chatDoc.chatData.map((c) => c.analogs)
        );

        // ---------- helpers ----------
        const normalize = (s) =>
          (s ?? "")
            .toString()
            .toLowerCase()
            .replace(/[\\\/|_+.,!<>()[\]{}:;"'`~^%$#@*&?-]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        const levenshtein = (a, b) => {
          const m = a.length,
            n = b.length;
          if (!m) return n;
          if (!n) return m;
          const dp = Array.from({ length: m + 1 }, (_, i) =>
            Array(n + 1).fill(0)
          );
          for (let i = 0; i <= m; i++) dp[i][0] = i;
          for (let j = 0; j <= n; j++) dp[0][j] = j;
          for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
              const cost = a[i - 1] === b[j - 1] ? 0 : 1;
              dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost
              );
            }
          }
          return dp[m][n];
        };

        const levRatio = (a, b) => {
          const A = normalize(a),
            B = normalize(b);
          if (!A || !B) return 0;
          if (A === B) return 1;
          const dist = levenshtein(A, B);
          return 1 - dist / Math.max(A.length, B.length);
        };

        const tokenSetRatio = (a, b) => {
          const A = new Set(normalize(a).split(" ").filter(Boolean));
          const B = new Set(normalize(b).split(" ").filter(Boolean));
          if (!A.size || !B.size) return 0;
          let inter = 0;
          for (const t of A) if (B.has(t)) inter++;
          // Sørensen–Dice coefficient
          return (2 * inter) / (A.size + B.size);
        };

        const nameSimilarity = (a, b) =>
          Math.max(levRatio(a, b), tokenSetRatio(a, b));
        const brandEqual = (a, b) => normalize(a) === normalize(b);

        // ---------- main: pick ONE best analog ----------
        const getBestAnalog = (
          analogs,
          partData,
          { strict = 0.95, fallback = 0.9 } = {}
        ) => {
          let best = { product: null, score: 0 };

          for (const product of analogs) {
            if (!brandEqual(product?.brand, partData?.brand)) continue;

            const score = nameSimilarity(product?.name, partData?.partName);

            // Keep the highest scoring candidate
            if (score > best.score) {
              best = { product, score };
            }
          }

          // Enforce thresholds: prefer strict; otherwise allow fallback
          if (best.product && best.score >= strict) return best.product;
          if (best.product && best.score >= fallback) return best.product;
          return null;
        };

        // ---------- usage ----------
        const partNeeded = getBestAnalog(
          chatDoc.chatData.flatMap((item) => item.analogs),
          partData,
          {
            strict: 0.95,
            fallback: 0.9,
          }
        );
        console.log("Found part for pictures:", partNeeded);

        try {
          const functionResponse = {
            status: "success",
            message: `Successfully found ${partNeeded.pictures.length} of picture links!`,
            pictures: partNeeded.pictures,
          };

          messages.push(responseMessage);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: functionName,
            content: JSON.stringify(functionResponse),
          });

          finalResponse = await llmChat(messages, { model: "gpt-4o" });
        } catch (pictureError) {
          console.error("Find picture error:", pictureError);

          const errorResponse = {
            status: "error",
            message: pictureError.message || "Failed to send pictures",
          };

          messages.push(responseMessage);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: functionName,
            content: JSON.stringify(errorResponse),
          });

          finalResponse = await llmChat(messages, { model: "gpt-4o" });
        }
      } else if (functionName === "make_reservation") {
        const {
          serviceTypes,
          repairPartsIds,
          speciality,
          date,
          time,
          duration,
        } = functionArgs;

        if (!serviceTypes || !speciality) {
          return res.status(500).json("Not all of the arguments are there!");
        }
        console.log(
          `serviceTypes: ${serviceTypes}, repairPartsIds: ${repairPartsIds}, speciality: ${speciality}, date: ${date}, time: ${time}, duration: ${duration}`
        );

        try {
          const worker = await Worker.findOne({ speciality: speciality });
          if (!worker) {
            // ... handle no worker (your existing code)
            return; // ✅ Make sure you return!
          }

          if (date !== "nothing") {
            const targetDate = toUTCDateOnly(date); // Use the actual `date` from args
            const calendarDate = await Calendar.findOne({ date: targetDate });

            if (!calendarDate) {
              // ❗ Calendar entry doesn't exist for this date
              const errorMsg = `No calendar data available for ${date}.`;

              if (source === "telegram") {
                await sendMessage(rest.chatId, errorMsg);
              }

              const functionResponse = {
                status: "error",
                message: errorMsg,
              };

              messages.push(responseMessage);
              messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                name: functionName,
                content: JSON.stringify(functionResponse),
              });

              finalResponse = await llmChat(messages, { model: "gpt-4o" });
            } else {
              const workload = calendarDate.workers.find(
                (repairWorker) => repairWorker.id == worker.id
              );

              if (time != "nothing") {
                const endTime = addHoursToTime(time, duration);
                const isAvailable =
                  workload.length > 0
                    ? checkTimePeriodAvailability(workload, time, endTime)
                    : { available: true };

                if (isAvailable.available) {
                  const user = await User.findOne({ "chatId.id": rest.chatId });
                  let repairItems = [];

                  const availablePartsList = [];
                  for (const id of repairPartsIds) {
                    const userPart = user.parts.find((p) => p.id == id);
                    if (!userPart || !userPart.items?.[0]) continue;

                    userPart.items.map((item) => {
                      availablePartsList.push({
                        id: item.partId,
                        name: item.name,
                        partNumber: item.article,
                        quantity: item.quantity,
                        unitPrice: item.price,
                        purchaseDate: userPart.purchaseDate,
                        arrivalDate: item.arrivalDate,
                        status: item.status,
                      });
                    });
                  }

                  const partsDescription =
                    availablePartsList.length > 0
                      ? availablePartsList
                          .map(
                            (p) =>
                              `- ID: "${p.id}", Name: "${
                                p.name
                              }", Part Number: "${p.partNumber}", Quantity: ${
                                p.quantity
                              }, Unit Price: ${p.unitPrice}, Purchase Date: "${
                                p.purchaseDate.toISOString().split("T")[0]
                              }", Arrival Date: "${p.arrivalDate}", Status: "${
                                p.status
                              }"`
                          )
                          .join("\n")
                      : "No parts selected.";

                  const partsMessages = [
                    {
                      role: "user",
                      content: `You are a reservation assistant. Use ONLY the parts provided below. DO NOT invent, guess, or fabricate any part details.

AVAILABLE PARTS (use these EXACTLY — do not change names, IDs, prices, or quantities):
${partsDescription}

REQUIRED SERVICE TYPES:
${serviceTypes.map((s) => `- "${s}"`).join("\n")}

INSTRUCTIONS:
1. Return a JSON object with "confirmationMessage" and "services".
2. Each service must have:
   - "serviceType": use the exact string from the required list above
   - "description": write a short, generic description for the service
   - "parts": an array containing ONLY the parts from the AVAILABLE PARTS list
3. Assign ALL available parts to EVERY service.
4. NEVER add parts not in the list. NEVER change part IDs, names, prices, or quantities.
5. Output ONLY valid JSON. No markdown, no extra text.

Example output structure:
{
  "confirmationMessage": "Parts assigned successfully.",
  "services": [
    {
      "serviceType": "General Maintenance",
      "description": "Routine vehicle maintenance.",
      "parts": [
        { "id": "10000074548", "name": "Фильтр масляный", "partNumber": "1457429269", "quantity": 2, "unitPrice": 4642, "purchaseDate": "2024-06-15", arrivalDate: "2024-06-20", status: "ordered" },
      ]
    }
  ]
}`,
                    },
                  ];

                  const rawResponse = await llmChat(partsMessages, {
                    model: "gpt-4o-mini",
                  });

                  const content =
                    typeof rawResponse === "string"
                      ? rawResponse
                      : rawResponse?.choices?.[0]?.message?.content;
                  console.log("Raw Services Content: ", content);

                  const rawServices = parseReservationResponse(content);
                  console.log("Parsed Raw Services: ", rawServices);
                  console.log(
                    "Parsed Raw Service Items: ",
                    rawServices.services[0].parts
                  );

                  for (const service of rawServices.services) {
                    repairItems[service.serviceType] = {
                      description: service.description,
                      parts: service.parts.map((part) => ({
                        id: part.id,
                        name: part.name,
                        partNumber: part.partNumber,
                        quantity: part.quantity,
                        unitPrice: part.unitPrice,
                        totalPrice: part.quantity * part.unitPrice,
                        purchaseDate: part.purchaseDate,
                        arrivalDate:
                          part.arrivalDate != "null" ? part.arrivalDate : null,
                        status: part.status,
                      })),
                    };
                  }

                  const repairWorkIds = serviceTypes.map(() =>
                    Math.floor(1000000000 + Math.random() * 900000).toString()
                  );

                  const reservationId = Math.floor(
                    1000000000 + Math.random() * 900000
                  ).toString();

                  const newReservation = new Reservation({
                    id: reservationId,
                    date: targetDate,
                    startTime: time,
                    client: {
                      id: user.chatId.id,
                      phone: user.phone,
                      name: user.name,
                      email: user.email,
                      car: {
                        vin: user.car.vin,
                        make: user.car.make,
                        model: user.car.model,
                        year: user.car.year,
                      },
                    },
                    repairWorks: serviceTypes.map((serviceType, index) => {
                      console.log("item: ", {
                        id: repairWorkIds[index],
                        serviceType: serviceType,
                        description: repairItems[serviceType].description,
                        cost: 0,
                        repairItems: repairItems[serviceType].parts,
                      });

                      return {
                        id: repairWorkIds[index],
                        serviceType: serviceType,
                        description: repairItems[serviceType].description,
                        cost: 0,
                        assignedWorker: {
                          id: worker.id,
                          name: worker.name,
                          phone: worker.phone,
                        },
                        repairItems: repairItems[serviceType].parts,
                      };
                    }),
                  });
                  await newReservation.save();
                  console.log("Created the Reservation Sucessfully!");

                  const newUserRepairWorks = serviceTypes.map(
                    (serviceType, index) => ({
                      id: repairWorkIds[index],
                      description:
                        repairItems[serviceType]?.description ||
                        "No description",
                      cost: 0,
                      arrivalDate: targetDate,
                      assignedWorker: {
                        id: worker.id,
                        name: worker.name,
                        phone: worker.phone,
                      },
                      repairItems: (repairItems[serviceType]?.parts || []).map(
                        (part) => ({
                          partsId: part.id,
                          items: [part.name],
                        })
                      ),
                    })
                  );

                  await User.findOneAndUpdate(
                    { "chatId.id": rest.chatId },
                    { $push: { repairWorks: { $each: newUserRepairWorks } } },
                    { new: true }
                  );
                  console.log("Added Repair Works to User Succesfully!");

                  // Ensure targetDate is a string in YYYY-MM-DD format
                  let dateStr;
                  if (targetDate instanceof Date) {
                    dateStr = targetDate.toISOString().split("T")[0];
                  } else if (typeof targetDate === "string") {
                    // If it's already a string, assume it's YYYY-MM-DD
                    dateStr = targetDate;
                  } else {
                    throw new Error("Invalid targetDate format");
                  }

                  // Normalize time (as before)
                  const normalizeTime = (t) => {
                    if (!t || typeof t !== "string") return null;
                    const [h, m = "00"] = t.split(":");
                    return `${String(parseInt(h, 10) || 0).padStart(
                      2,
                      "0"
                    )}:${String(parseInt(m, 10) || 0).padStart(2, "0")}`;
                  };

                  const safeTime = normalizeTime(time);
                  const safeEndTime = normalizeTime(endTime);

                  if (!safeTime || !safeEndTime) {
                    throw new Error("Invalid time format");
                  }

                  // Create valid Date objects
                  const from = new Date(`${dateStr}T${safeTime}:00`);
                  const to = new Date(`${dateStr}T${safeEndTime}:00`);

                  // Validate
                  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
                    throw new Error(
                      `Invalid datetime: ${dateStr} ${safeTime} - ${safeEndTime}`
                    );
                  }

                  // Now use in update
                  await Calendar.findOneAndUpdate(
                    { date: toUTCDateOnly(date) },
                    {
                      $push: {
                        "workers.$[worker].workload": {
                          time_period: { from, to },
                          reservation: { id: reservationId },
                        },
                      },
                    },
                    { arrayFilters: [{ "worker.id": worker.id }], new: true }
                  );
                  console.log("Added the Reservation Time to the Calendar!");

                  const newWorkerRepairWorks = serviceTypes.map(
                    (serviceType, index) => ({
                      id: repairWorkIds[index],
                      title: serviceType,
                      client: {
                        id: user.chatId.id,
                      },
                      laborCost: 0,
                    })
                  );

                  await Worker.findOneAndUpdate(
                    {
                      id: worker.id,
                    },
                    {
                      $push: {
                        currentMonthWorks: {
                          $each: newWorkerRepairWorks,
                        },
                      },
                    }
                  );
                  console.log(
                    "Added the Reservation Details to the Repair Workers Dataset!"
                  );

                  const functionResponse = {
                    status: "success",
                    message: `Successfully created a reservation for ${targetDate} on ${time}!`,
                    serviceTypes: serviceTypes,
                    worker,
                  };

                  messages.push(responseMessage);
                  messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    name: functionName,
                    content: JSON.stringify(functionResponse),
                  });

                  finalResponse = await llmChat(messages, { model: "gpt-4o" });
                } else {
                  const functionResponse = {
                    status: "fail",
                    message: `The Reason of the Fail: ${isAvailable.reason}`,
                    workload,
                  };

                  messages.push(responseMessage);
                  messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    name: functionName,
                    content: JSON.stringify(functionResponse),
                  });

                  finalResponse = await llmChat(messages, { model: "gpt-4o" });
                }
              } else {
                const functionResponse = {
                  status: "success",
                  message: `Successfully found workload for ${worker.speciality} on ${date}!`,
                  worker,
                  workload: workload || null,
                };

                messages.push({
                  role: "user",
                  content:
                    "INSTRUCTION: Summarize the workload result in a friendly, customer-friendly way. Do not mention 'workload', 'worker ID', or technical terms. Just confirm availability for the requested date and service. Give the List of Available time periods of the specified worker.",
                });
                messages.push(responseMessage);
                messages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  name: functionName,
                  content: JSON.stringify(functionResponse),
                });

                finalResponse = await llmChat(messages, { model: "gpt-4o" });
              }
            }
          }

          // ✅ Only now extract AI response
          if (!finalResponse) {
            throw new Error("LLM call did not return a response");
          }

          // ... rest of your code (save chat, etc.)
        } catch (err) {
          console.error("Reservation error:", err);

          // 🚨 Always send a valid JSON response
          return res.status(500).json({
            error: "Error While Making Reservation",
            details: err.message,
          });
        }
      } else {
        // Unrecognized tool
        finalResponse = firstResponse;
      }
    } else {
      // No tool call needed
      finalResponse = firstResponse;
    }

    const aiResponse = finalResponse.choices[0].message.content;

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
    const existingChat = await Chat.findOne({ "user.id": rest.chatId });

    if (existingChat) {
      await Chat.updateOne(
        { "user.id": rest.chatId },
        {
          $push: {
            chat: { $each: [chatUpdate, assistantMessage] },
          },
        }
      );

      if (chatData != null) {
        const alreadyExists =
          Array.isArray(existingChat.chatData) &&
          existingChat.chatData.some(
            (item) =>
              item?.original?.article === chatData.original?.article &&
              item?.original?.name === chatData.original?.name
          );

        if (!alreadyExists) {
          await Chat.updateOne(
            { "user.id": rest.chatId },
            {
              $push: {
                chatData: chatData,
              },
            }
          );
        }
      }
    } else {
      const newChat = new Chat({
        user: {
          source: source == "chat" ? "website" : source,
          id: rest.chatId,
        },
        chatData: chatData != null ? [chatData] : [],
        chat: [chatUpdate, assistantMessage],
      });

      await newChat.save();
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
