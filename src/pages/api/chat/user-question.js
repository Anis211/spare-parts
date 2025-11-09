import connectDB from "@/lib/mongoose";
import { OpenAI } from "openai";
import Chat from "@/models/Chat";
import User from "@/models/User";
import Alatrade from "@/models/Alatrade";
import { getGrid } from "@/lib/gridfs";

connectDB();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
});

export const config = {
  api: {
    bodyParser: { sizeLimit: "20mb" }, // increase JSON body limit for base64 images
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed. Use POST.",
    });
  }

  try {
    const { userQuestion, userImages, user } = req.body;
    console.log("Started user-question.js");

    if (!userQuestion || !user) {
      return res.status(400).json({
        success: false,
        message: "Missing parameters",
      });
    }

    const pastMessages = await Chat.find({}).sort({ createdAt: -1 }).limit(3);
    let messages = [
      {
        role: "system",
        content: `You are a helpful auto parts assistant with two capabilities:
    
1. Get part analogs by scraping using scrape_website function
2. If the user asks simple questions not related to parts, answer directly without using functions

Use scrape_website when:
- The user asks about the part in stock, ask for vin code and the part name
- The user asks about the details from the part photo provided, dont ask for part number or part name, only ask for vin code if not provided
- Do not ask for the part name, second time, if the user already provided it
- You need to find the most similar parts to the requested one by their name, name is the key inside the request
- The user asks for alternatives, analogs, or similar parts for a specific part, by vin code and part name
- The user asks for prices or availability of a specific part by vin code and part name
- The user needs from 3 to 7 analogs information (including names, prices, available in stores, do not give the links)
- For example user sends a message like this (i need an oil filter for this car 5YJ3E1EA7KF000001) so the 'oil filter' is the name of the part and '5YJ3E1EA7KF000001' is the vin code, do not ask for confirmation if everything is clear. 

Do NOT use scrape_website when:
- The user asks general questions about cars, maintenance, or anything not related to specific parts
- The user asks for advice on car issues, repairs, or recommendations not tied to a specific part

When scraping:
- Always use the exact part number from our database

Output for scrape_website function results:
- Give the answer in a friendly, conversational tone in the language the user used
- You must use name, brand, price (is the base_price in the stocks part), and stocks (name, tariffDeliveryTimingWithTimezone(make it user readable), quantity) from the stocks part, do not show the oe number, the links and the address like Akzhol 30 (just show the city, like in Astana or in Karaganda) to the client
- Do not use chatData information in the output
- Output the exact name prop you recieve from the scrape_website function
- Output the whole set of items in the analogs given to you as a function answer (for example if in the array you have 8 items, you must output all 8 of the items given to you, without any exceptions!!), but do now output the images of the products until the user asks you to do it

Use order_parts function when:
- The user wants to make an order
- When the user is ready to make an order
- When the user wants to get the part he chose, like brand, part name or etc.

Output when order_parts is called:
- Confirm the order with a friendly message including the number of parts ordered and the order ID
- Provide a link to the page with the order information , like http://localhost:3000/details/XXX (where XXX is the orderId)

Output when order_parts is called: 

Your order is confirmed! 🎉

You've successfully ordered:
1) STELLOX Oil Filter
2) KS Oil Filter

You can check your order details here: http://localhost:3000/details/XXX (replace XXX with your actual order ID)

If you have any more questions or need help with anything else, just let me[object Object]🚗💨

Use find_and_send_pictures:
- When the user wants to see what part looks like
- When the user asks for a picture to compare with his borken one
- If the user wants to be sure that the part is the one he wants

Output when find_and_send_pictures is called:
- Just return an array that includes links for the pictures of specified part
- Example of the output: some text about the part or etc. and for images output strictly like this ( images: ["url1", "url2", "url3"] ) dont use '(' and ')' in the output

🛑 CRITICAL FORMATTING RULE — READ AND OBEY:

You MUST output responses in clean, human-readable plain text with REAL line breaks — not “\\n”, not “\n”, not concatenated lines. Each item, label, or section must be on its own line. Use spacing to create visual clarity. No Markdown. No bold. No asterisks. No code-like formatting.

📌 HOW TO FORMAT:

Start every numbered item on a NEW LINE.
Put each detail (part, description, price, availability) on its OWN LINE.
Separate items with a blank line.
Use emojis SPARINGLY: 1 per line max.
NEVER run lines together. ALWAYS break them.
🔧 Example of CORRECT output after calling scrape_website function:

Alternatives for part "Oil Filter":

1) BMW
  🔧 Oil Filter Insert
  💰 2,453
  📍 In 11 stores — pick up today (10:00–22:00)
2) Mann
  🔧 Oil Filter Insert
  💰 925
  📍 In 25 stores — available today

Need help choosing? I’m here for you! 🚗💨

🚫 FORBIDDEN:

“**”, “__”, “##”, “\\n”, “\n”
All details on one line
No spacing between items
Robotic, dense, or concatenated output
💡 You are a formatting assistant first. Clarity > brevity. Beauty > speed.
Every line break is sacred. Every space is intentional.

—
`,
      },
    ];

    // Add past messages
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

    messages.push({ role: "user", content: userQuestion });

    // ✅ MIGRATED: functions → tools
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
                        "It is the name of the part being ordered (it must be translated to russian language)",
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

    // Create embedding
    let queryEmbedding;
    try {
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: userQuestion,
      });
      queryEmbedding = embeddingResponse.data[0].embedding;
    } catch (embeddingError) {
      console.warn("Embedding failed:", embeddingError);
      queryEmbedding = [];
    }

    // First LLM call with tools
    const firstResponse = await openai.chat.completions.create({
      model: "gpt-4o", // ✅ Real, supported model
      messages,
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

        console.log(
          "User Images:",
          Array.isArray(userImages) ? userImages.length : 0
        );

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

          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content:
                  "You are an expert auto parts identifier. Return ONLY the part name. No punctuation, no extra words, like ('Oil filter', 'Alternator') (the output needs to be in russian language). If you cannot identify, respond with 'Unknown'.",
              },
              { role: "user", content },
            ],
            temperature: 0,
          });

          let detected =
            completion.choices?.[0]?.message?.content?.trim() || "";
          // normalize a bit
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

          const aiResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: extractionMessages,
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
                  guid: "",
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

          // ── run all vendors concurrently ───────────────────────────────────────────
          const alatradeTokenPromise = ensureAlatradeAuth();
          const shatemTokenPromise = ensureShatemAuth();

          const rosskoPromise = (async () => {
            const r = await fetchWithTimeout(proxyRosskoUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ partNumber, partName }),
            });
            if (!r.ok) throw new Error(`Rossko HTTP ${r.status}`);
            return r.json();
          })();

          const alatradePromise = (async () => {
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
          })();

          const shatemPromise = (async () => {
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
          })();

          const emptyVendor = { original: null, analogs: [] };
          const mapRosskoP = (val) => Promise.resolve(mapRossko(val));
          const mapAlatradeP = (val) => Promise.resolve(mapAlatrade(val));
          const mapShatemP = (val) => mapShatem(val); // already async

          const [rossko, alatrade, shatem] = await Promise.all([
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
          ]);

          console.log("rossko analogs:", rossko.analogs.length);
          console.log("alatrade analogs:", alatrade.analogs.length);
          console.log("shatem analogs:", shatem.analogs.length);

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
          const functionResponse = {
            partNumber: partNumber,
            analogs: analogs,
          };

          // ✅ Add tool response (role: "tool")
          messages.push(responseMessage); // assistant's tool_call message
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: functionName,
            content: JSON.stringify(functionResponse),
          });

          // now set the data you return / store
          chatData = { original, analogs };
          finalResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages,
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

          finalResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages,
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

        const chatData = chatDoc.chatData[chatDoc.chatData.length - 1];
        const allAvailableParts = [
          {
            ...chatData.original,
            name: chatData.original?.name,
            brand: chatData.original?.brand,
            article: chatData.original?.article,
            type: "original",
          },
          ...(chatData.analogs || []).map((analog) => ({
            ...analog,
            name: analog.name,
            brand: analog.brand,
            article: analog.article,
            pictures: analog.pictures,
            type: "analog",
          })),
        ];

        // Match each ordered part to full data
        const enrichedParts = partNumbers.map((requestedPart) => {
          // Find best match: brand + name (case-insensitive)
          const match = allAvailableParts.find(
            (p) => p.brand?.toLowerCase() === requestedPart.brand?.toLowerCase()
          );

          if (!match) {
            console.warn("Ordered part not found in chatData:", requestedPart);
            // Still allow ordering with minimal data if needed
            return {
              ...requestedPart,
              article: null,
              guid: null,
              stocks: [],
            };
          }

          // Find the stock info that matches the price (optional but useful)
          let selectedStock = null;
          if (match.stocks && match.stocks.length > 0) {
            // Flatten stocks if nested (your current structure has stocks: [ [ {...}, {...} ] ])
            const flatStocks = match.stocks.flat();
            selectedStock = flatStocks.find(
              (stock) => stock.partPrice === requestedPart.partPrice
            );
          }

          return {
            brand: match.brand,
            partName: match.name,
            orderQuantity: requestedPart.orderQuantity,
            partPrice: requestedPart.partPrice,
            article: match.article,
            guid: match.guid,
            pictures: match.pictures,
            stockInfo:
              selectedStock || (match.stocks ? match.stocks.flat()[0] : null),
          };
        });

        try {
          const baseUrl =
            process.env.NEXT_PUBLIC_BASE_URL || `http://${req.headers.host}`;

          const orderResponse = await fetch(`${baseUrl}/api/order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              parts: enrichedParts, // ✅ Now includes full data from chatData
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

          finalResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages,
          });
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

          finalResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages,
          });
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

          finalResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages,
          });
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

          finalResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages,
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
    const chatUpdate = {
      text: userQuestion,
      metadata: {
        role: "user",
        createdAt: new Date(),
      },
    };

    if (queryEmbedding.length > 0) {
      chatUpdate.embedding = queryEmbedding;
    }

    const existingChat = await Chat.findOne({ user });
    const assistantMessage = {
      text: aiResponse,
      metadata: {
        role: "assistant",
        createdAt: new Date(),
      },
    };

    if (queryEmbedding.length > 0) {
      assistantMessage.embedding = queryEmbedding;
    }

    if (existingChat) {
      await Chat.findOneAndUpdate(
        { user },
        {
          $push: {
            chat: chatUpdate,
          },
        }
      );

      await Chat.findOneAndUpdate(
        { user },
        {
          $push: {
            chat: assistantMessage,
          },
        }
      );

      if (chatData != null) {
        const previous = await Chat.findOne({ user });
        let check = [];

        check = previous.chatData.filter(
          (item) =>
            chatData.original.article == item.original.article &&
            chatData.original.name == item.original.name
        );

        if (check.length == 0) {
          await Chat.findOneAndUpdate(
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
        chatData: chatData != null ? chatData : [],
        chat: [chatUpdate, assistantMessage],
      });
      await newChat.save();
    }

    res.status(200).json({
      response: aiResponse,
      matchedPartIds,
      success: true,
    });
  } catch (error) {
    console.error("API Error:", error);

    if (
      error.message.includes("timeout") ||
      error.message.includes("timed out")
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
