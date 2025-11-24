import connectDB from "@/lib/mongoose";
import { OpenAI } from "openai";
import Chat from "@/models/Chat";
import User from "@/models/User";
import Alatrade from "@/models/Alatrade";
import { getGrid } from "@/lib/gridfs";
import { tonEncode } from "@/lib/ton";
import {
  MicroBatcher,
  openaiMessagesTransportFactory,
} from "@/lib/microBatcher.js";
import { createLimitedCaller } from "@/lib/limiterBackoff";
import Semaphore from "@/lib/bulkhead";
import CircuitBreaker from "@/lib/circuitBreaker";

connectDB();

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed. Use POST.",
    });
  }

  try {
    const { userMessages, userImages, user } = req.body;
    console.log("Started user-question.js");

    if (!userMessages || !user) {
      return res.status(400).json({
        success: false,
        message: "Missing parameters",
      });
    }

    const userQuestion = userMessages.map((text) => ({
      role: "user",
      content: text,
    }));

    const pastMessages = await Chat.find({}).sort({ createdAt: -1 }).limit(3);
    let messages = [
      {
        role: "system",
        content: `
You are a helpful auto-parts assistant with 3 functions:

1. scrape_website – find analogs for parts.
2. order_parts – confirm user orders.
3. find_and_send_pictures – show part images.

scrape_website rules:
if there is images: ['url', 'url'] in the user message than it is the image user have provided to you
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
Reply friendly confirmation listing ordered parts and link:
http://localhost:3000/details/XXX (XXX = orderId)

Example:
Your order is confirmed! 🎉
1) STELLOX Oil Filter
2) KS Oil Filter
Check details: http://localhost:3000/details/123 🚗💨

find_and_send_pictures rules:
Use when user asks to see or compare a part.
Return exactly: images: ["url1","url2","url3"]

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

          const compact = toShortSchema(original, analogs);
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

        if (!Array.isArray(partNumbers) || partNumbers.length === 0) {
          throw new Error("No parts provided for ordering");
        }

        // Fetch user and chat
        const userData = await User.findOne({ email: user });
        if (!userData) {
          throw new Error("User not found");
        }

        const chatDoc = await Chat.findOne({ user });
        if (!chatDoc || !chatDoc.chatData || chatDoc.chatData.length === 0) {
          throw new Error(
            "No previous part data found. Please search for parts first."
          );
        }

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
          return (2 * inter) / (A.size + B.size);
        };

        const nameSimilarity = (a, b) =>
          Math.max(levRatio(a, b), tokenSetRatio(a, b));

        const brandEqual = (a, b) => normalize(a) === normalize(b);

        // ---------- pick ONE best analog ----------
        const getBestAnalog = (
          analogs,
          partData,
          { strict = 0.95, fallback = 0.9 } = {}
        ) => {
          let best = { product: null, score: 0 };

          for (const product of analogs) {
            if (!brandEqual(product?.brand, partData?.brand)) continue;

            const score = nameSimilarity(product?.name, partData?.partName);

            if (score > best.score) {
              best = { product, score };
            }
          }

          if (best.product && best.score >= strict) return best.product;
          if (best.product && best.score >= fallback) return best.product;
          return null;
        };

        console.log(
          "chatData: ",
          chatDoc.chatData.flatMap((item) => item.analogs)
        );

        const enrichedParts = partNumbers.map((requestedPart) => {
          const bestMatch = getBestAnalog(
            chatDoc.chatData.flatMap((item) => item.analogs),
            {
              brand: requestedPart.brand,
              partName: requestedPart.partName,
            },
            {
              strict: 0.95,
              fallback: 0.9,
            }
          );

          if (!bestMatch) {
            console.warn("Ordered part not found in chatData:", requestedPart);
            return {
              ...requestedPart,
              article: null,
              guid: null,
              stocks: [],
            };
          }

          let selectedStock = null;
          if (bestMatch.stocks && bestMatch.stocks.length > 0) {
            const flatStocks = bestMatch.stocks.flat();
            selectedStock =
              flatStocks.find(
                (stock) => stock.partPrice === requestedPart.partPrice
              ) ||
              flatStocks[0] ||
              null;
          }

          return {
            brand: bestMatch.brand,
            partName: bestMatch.name,
            orderQuantity: requestedPart.orderQuantity,
            partPrice: requestedPart.partPrice,
            article: bestMatch.article,
            guid: bestMatch.guid,
            pictures: bestMatch.pictures,
            stockInfo: selectedStock,
            sources: bestMatch.sources,
          };
        });

        try {
          const baseUrl =
            process.env.NEXT_PUBLIC_BASE_URL || `http://${req.headers.host}`;

          const orderResponse = await fetch(`${baseUrl}/api/order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              parts: enrichedParts,
              user: userData,
            }),
          });

          const orderResult = await orderResponse.json();

          if (!orderResponse.ok) {
            throw new Error(orderResult.message || "Order API failed");
          }

          console.log("Order result id:", orderResult);

          const functionResponse = {
            status: "success",
            message: `Successfully ordered ${enrichedParts.length} part(s)!`,
            orderId: orderResult.order.orderId.split("-")[1],
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

        // Fetch user and chat
        const userData = await User.findOne({ email: user });
        if (!userData) {
          throw new Error("User not found");
        }

        const chatDoc = await Chat.findOne({ user });
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
        // bestProduct is either the single most similar product (brand matched) or null

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

    const existingChat = await Chat.findOne({ user });

    if (existingChat) {
      await Chat.updateOne(
        { user },
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
            { user },
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
        user,
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
