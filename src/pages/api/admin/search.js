import { OpenAI } from "openai";
import Alatrade from "@/models/Alatrade";
import { getGrid } from "@/lib/gridfs";
import {
  MicroBatcher,
  openaiMessagesTransportFactory,
} from "@/lib/microBatcher.js";
import { createLimitedCaller } from "@/lib/limiterBackoff";
import Semaphore from "@/lib/bulkhead";
import CircuitBreaker from "@/lib/circuitBreaker";
import connectDB from "@/lib/mongoose";
import VinData from "@/models/AdminChat";

connectDB();

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

// === Wrapper For Bulkhead And Circuit Breaker ===
function resilientVendorCall(breaker, semaphore, fn) {
  return breaker.exec(() => semaphore.run(fn));
}

export const config = {
  api: {
    bodyParser: { sizeLimit: "20mb" },
  },
};

export default async function handler(req, res) {
  if (req.method != "POST") {
    res.status(500).json("Wrong request method!");
  }
  const { partName, vin, userImages } = req.body;
  let partNumber = "";

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || `http://${req.headers.host}`;

  console.log("User Images:", userImages);

  // If user sent images and did NOT supply a part name, extract from image
  if (
    Array.isArray(userImages) &&
    userImages.length > 0 &&
    partName === "nothing"
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

    let detected = completion.choices?.[0]?.message?.content?.trim() || "";
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

    const history = await VinData.findOne({ vin: vin.toUpperCase() });
    const part = history.records.find((r) => r.user.part === partName);

    console.log("Existing Part in History:", part);
    console.log("Full History Records:", history.records);

    if (part != undefined) {
      return res.status(200).json({
        message: "This part had already been searched",
        answer: part,
      });
    }

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
        `${normalize(s.place)}|${s.partPrice}|${s.delivery?.start ?? ""}|${
          s.delivery?.end ?? ""
        }`;
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
                  start: item.deliveryInfo.deliveryDateTimes[0].deliveryDate,
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
            expires: data?.auth_data?.find((c) => c.name === "ci_sessions")
              ?.expires,
          },
          rem_id: {
            value: data?.auth_data?.find((c) => c.name === "REMMEID")?.value,
            expires: data?.auth_data?.find((c) => c.name === "REMMEID")
              ?.expires,
          },
        };
        alatrade
          ? (alatrade = await Alatrade.findOneAndUpdate({}, next, {
              new: true,
              lean: true,
            }))
          : (alatrade = (await Alatrade.create(next)).toObject?.() ?? next);
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
      const cookies = Array.isArray(data?.auth_data) ? data.auth_data : [];

      const get = (name) => cookies.find((c) => c.name === name)?.value || "";

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
          pictures: Array.isArray(item.pictures) ? [...item.pictures] : [],
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
          const set = new Set([...(prev.pictures ?? []), ...item.pictures]);
          prev.pictures = [...set];
        }
        prev.stocks = mergeStocks(prev.stocks, item.stocks ?? []);

        // track all sources (unique)
        if (!prev.sources.includes(item.source)) prev.sources.push(item.source);
      }
    }

    const analogs = Array.from(mergedMap.values());
    res.status(200).json({ original: original, analogs: analogs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
