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
    },
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
  await connectDB();

  if (req.method != "POST") {
    res.status(500).json("Wrong request method!");
  }

  const { partName, vin } = req.body;
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || `http://${req.headers.host}`;

  try {
    console.log("Fetching part number for:", partName, vin);

    const partRes = await fetch(`${baseUrl}/api/search/catalogSearch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vin: vin.toUpperCase().trim(),
        partName: partName,
      }),
    });
    const carData = await partRes.json();
    const { partNumber } = carData.secondResponseData;

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
    const fetchWithTimeout = (url, opts = {}, ms = 60000) => {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), ms);
      return fetch(url, { ...opts, signal: ctl.signal }).finally(() =>
        clearTimeout(t),
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
      // d is the response from /api/py/shatem:
      // { searched_number, selected_part, selection_reason, analogs: [...], analogs_media: [...], ... }

      const analogs = await Promise.all(
        (d?.analogs ?? []).map(async (item) => {
          // Match media by article + brand
          const analog_media_data = d?.analogs_media?.find(
            (media) =>
              media.article === item.article &&
              (media.brand === item.brand ||
                media.brand === item.partInfo?.tradeMarkName),
          );

          const rawList = Array.isArray(analog_media_data?.media)
            ? analog_media_data.media
            : [];

          const pictures = await Promise.all(
            rawList.map(async (m, idx) => {
              try {
                const base64 = m.value?.split(",")?.[1];
                if (!base64) return null;

                const buffer = Buffer.from(base64, "base64");
                const contentType =
                  m.value?.match(/^data:(.*?);/)?.[1] || "image/jpeg";
                const brand =
                  item.brand || item.partInfo?.tradeMarkName || "unknown";
                const filename = `${item.article}_${brand}_${idx}.jpg`;

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
            }),
          );

          // 🔥 Map with detailed name priority
          return {
            source: "shatem",
            original_id: item.guid || item.partInfo?.id,
            article: item.article,
            brand: item.brand || item.partInfo?.tradeMarkName,
            // 🔥 Use Shatem's detailed description as primary name
            name:
              item.name ||
              item.partInfo?.description ||
              item.partInfo?.descriptionFormatted ||
              "",
            guid: item.guid,
            pictures: pictures.filter(Boolean),
            stocks: [
              {
                partPrice: item.price,
                place: item.city,
                currency: item.currency,
                availability: item.availability,
                inventory: item.inventory,
                location: item.location,
                delivery: {
                  start:
                    item.deliveryDate ||
                    item.deliveryInfo?.deliveryDateTimes?.[0]?.deliveryDate,
                  end: "",
                },
              },
            ],
          };
        }),
      );

      return { original: null, analogs };
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

    async function ensureAlatradeAuth({ forceRefresh = false } = {}) {
      const expired = (expires) => {
        if (!expires) return true;
        const d = new Date(expires);
        if (!Number.isFinite(+d)) return true;
        // Compare with 1-hour buffer to avoid edge cases
        return d.getTime() < Date.now() - 3600_000;
      };

      // Try to get cached auth first
      let cached = null;
      try {
        cached = await Alatrade.findOne({}).lean();
      } catch (e) {
        console.warn(
          "[Alatrade] DB read error, proceeding to refresh:",
          e.message,
        );
      }

      const hasValidCookies =
        cached?.ci_session?.value &&
        cached?.rem_id?.value &&
        !expired(cached.ci_session.expires) &&
        !expired(cached.rem_id.expires);

      if (!forceRefresh && hasValidCookies) {
        console.log("[Alatrade] Using cached auth");
        return { ci: cached.ci_session.value, rem: cached.rem_id.value };
      }

      console.log("[Alatrade] Refreshing auth...");

      // Fetch fresh auth with retry
      const authResult = await fetchAlatradeAuthInline();

      // Save to DB
      const next = {
        ci_session: {
          value: authResult.ci,
          expires: authResult.raw?.find((c) => c.name === "ci_sessions")
            ?.expires,
        },
        rem_id: {
          value: authResult.rem,
          expires: authResult.raw?.find((c) => c.name === "REMMEID")?.expires,
        },
        lastRefreshed: new Date(),
      };

      try {
        if (cached?._id) {
          await Alatrade.findByIdAndUpdate(cached._id, next, {
            upsert: true,
          });
        } else {
          await Alatrade.create(next);
        }
        console.log("[Alatrade] Auth saved to DB");
      } catch (dbErr) {
        console.warn(
          "[Alatrade] DB save failed, continuing with in-memory auth:",
          dbErr.message,
        );
        // Continue anyway - auth still works, just not persisted
      }

      return { ci: authResult.ci, rem: authResult.rem };
    }

    async function ensureShatemAuth({ forceRefresh = false } = {}) {
      console.log("[Shatem] ensureShatemAuth called", { forceRefresh });

      // Helper: Check if token is expired (with 1-hour buffer)
      const expired = (expires) => {
        if (!expires) return true;
        const d = new Date(expires);
        if (!Number.isFinite(+d)) return true;
        // Consider expired if 1 hour before actual expiry (safety buffer)
        return d.getTime() < Date.now() - 3600_000;
      };

      // Try to get cached auth from DB
      let cached = null;
      try {
        cached = await ShatemAuth.findOne({}).lean();
        console.log("[Shatem] Cached auth:", {
          has_antiforgery: !!cached?.antiforgery?.value,
          has_access: !!cached?.x_access_token?.value,
          has_refresh: !!cached?.x_refresh_token?.value,
          access_expires: cached?.x_access_token?.expires,
          refresh_expires: cached?.x_refresh_token?.expires,
        });
      } catch (e) {
        console.warn(
          "[Shatem] DB read error, proceeding to refresh:",
          e.message,
        );
      }

      // Check if all required tokens are present and not expired
      const hasValidCookies =
        cached?.antiforgery?.value &&
        cached?.x_access_token?.value &&
        !expired(cached.antiforgery.expires) &&
        !expired(cached.x_access_token.expires);

      console.log("[Shatem] hasValidCookies:", hasValidCookies);

      // Return cached auth if valid and not forcing refresh
      if (!forceRefresh && hasValidCookies) {
        console.log("[Shatem] Using cached auth");
        return {
          antiforgery: cached.antiforgery.value,
          x_access_token: cached.x_access_token.value,
          x_refresh_token: cached.x_refresh_token?.value || "",
        };
      }

      // Fetch fresh auth from API
      console.log("[Shatem] Refreshing auth...");
      const r = await fetchWithTimeout(proxyShatemAuthUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!r.ok) throw new Error(`Shatem auth HTTP ${r.status}`);
      const data = await r.json();

      // Handle structured Python errors
      if (data.error) {
        const err = new Error(data.error);
        err.retryable = data.retryable ?? true;
        err.pythonError = data;
        throw err;
      }

      // Parse cookies from response
      const cookies = Array.isArray(data?.auth_data) ? data.auth_data : [];
      const get = (name) => cookies.find((c) => c.name === name)?.value || "";

      const antiforgery = get(".AspNetCore.Antiforgery.VyLW6ORzMgk");
      const x_access_token = get("X-Access-Token");
      const x_refresh_token = get("X-Refresh-Token");

      if (!antiforgery || !x_access_token) {
        throw new Error("Shatem auth missing required cookies");
      }

      // Extract expiration dates from cookies (if available)
      const parseCookieExpiry = (cookie) => {
        const c = cookies.find((c) => c.name === cookie);
        return c?.expires ? new Date(c.expires) : null;
      };

      // Save fresh auth to DB
      const next = {
        antiforgery: {
          value: antiforgery,
          expires: parseCookieExpiry(".AspNetCore.Antiforgery.VyLW6ORzMgk"),
        },
        x_access_token: {
          value: x_access_token,
          expires: parseCookieExpiry("X-Access-Token"),
        },
        x_refresh_token: {
          value: x_refresh_token,
          expires: parseCookieExpiry("X-Refresh-Token"),
        },
        lastRefreshed: new Date(),
      };

      try {
        // Upsert: update if exists, insert if not
        await ShatemAuth.findOneAndUpdate({}, next, {
          upsert: true,
          new: true,
        });
        console.log("[Shatem] Auth saved to DB");
      } catch (dbErr) {
        console.warn(
          "[Shatem] DB save failed, continuing with in-memory auth:",
          dbErr.message,
        );
        // Continue anyway - auth still works, just not persisted
      }

      return { antiforgery, x_access_token, x_refresh_token };
    }

    async function ensureAutotradeAuth({ forceRefresh = false } = {}) {
      console.log("[Autotrade] ensureAutotradeAuth called", {
        forceRefresh,
      });

      // Helper: Check if token is expired (with 1-hour buffer)
      const expired = (expires) => {
        if (!expires) return true;
        const d = new Date(expires);
        if (!Number.isFinite(+d)) return true;
        return d.getTime() < Date.now() - 3600_000;
      };

      // Try to get cached auth from DB
      let cached = null;
      try {
        cached = await AutotradeAuth.findOne({}).lean();
        console.log("[Autotrade] Cached auth:", {
          has_jar: !!cached?.cookie_jar?.value,
          jar_expires: cached?.cookie_jar?.expires,
        });
      } catch (e) {
        console.warn(
          "[Autotrade] DB read error, proceeding to refresh:",
          e.message,
        );
      }

      // Check if cookie jar is present and not expired
      const hasValidJar =
        cached?.cookie_jar?.value && !expired(cached.cookie_jar.expires);

      console.log("[Autotrade] hasValidJar:", hasValidJar);

      // Return cached auth if valid and not forcing refresh
      if (!forceRefresh && hasValidJar) {
        console.log("[Autotrade] Using cached auth");
        try {
          return JSON.parse(cached.cookie_jar.value);
        } catch {
          console.warn("[Autotrade] Cached jar parse failed, refreshing");
        }
      }

      // Fetch fresh auth from API
      console.log("[Autotrade] Refreshing auth...");
      const r = await fetchWithTimeout(proxyAutotradeAuthUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!r.ok) throw new Error(`Autotrade Auth HTTP ${r.status}`);
      const data = await r.json();

      // Extract jar from response
      const jar = data.cookie_jar || data.auth_data?.cookie_jar;
      if (!jar) throw new Error("Autotrade auth missing cookie_jar");

      // Estimate expiration (Autotrade doesn't provide explicit expiry; assume 24h)
      const estimatedExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Save fresh auth to DB
      const next = {
        cookie_jar: {
          value: JSON.stringify(jar),
          expires: estimatedExpiry,
        },
        lastRefreshed: new Date(),
      };

      try {
        await AutotradeAuth.findOneAndUpdate({}, next, {
          upsert: true,
          new: true,
        });
        console.log("[Autotrade] Auth saved to DB");
      } catch (dbErr) {
        console.warn(
          "[Autotrade] DB save failed, continuing with in-memory auth:",
          dbErr.message,
        );
      }

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

    async function runWithRetry(label, fn, options = {}) {
      const {
        maxAttempts = 3,
        initialDelayMs = 700,
        backoffMultiplier = 1.7,
        maxDelayMs = 10000,
        isRetryable = defaultIsRetryable,
        onAttempt = () => {},
        fallbackValue = null,
      } = options;

      let lastError;
      let delay = initialDelayMs;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const startTime = Date.now();
        try {
          console.log(`[${label}] attempt ${attempt}/${maxAttempts}`);

          const result = await fn();

          // Success hook
          onAttempt(attempt, null, result);
          console.log(`[${label}] ✓ success in ${Date.now() - startTime}ms`);
          return result;
        } catch (err) {
          lastError = err;
          const elapsed = Date.now() - startTime;

          // Determine if error is retryable
          const retryable = isRetryable(err);

          // Attempt hook (for logging/metrics)
          onAttempt(attempt, err, null);

          console.warn(
            `[${label}] attempt ${attempt} failed after ${elapsed}ms: ${err.message}${retryable ? " (retryable)" : " (permanent)"}${
              err.pythonError?.error ? ` [${err.pythonError.error}]` : ""
            }`,
          );

          // Don't retry permanent errors
          if (!retryable) {
            console.error(`[${label}] permanent failure, stopping retries`);
            break;
          }

          // Exponential backoff with jitter before next attempt
          if (attempt < maxAttempts) {
            const jitter = Math.random() * 200; // 0-200ms randomization
            const nextDelay = Math.min(
              Math.ceil(delay * backoffMultiplier) + jitter,
              maxDelayMs,
            );
            console.log(`[${label}] retrying in ${Math.round(nextDelay)}ms...`);
            await new Promise((resolve) => setTimeout(resolve, nextDelay));
            delay = nextDelay; // Update for next iteration
          }
        }
      }

      // All attempts exhausted
      console.error(`[${label}] ✗ all ${maxAttempts} attempts failed`);

      // Return fallback instead of throwing (keeps Promise.allSettled happy)
      return fallbackValue;
    }

    function defaultIsRetryable(err) {
      // Explicit retryable flag from Python structured errors
      if (err.retryable !== undefined) return err.retryable;
      if (err.pythonError?.retryable !== undefined)
        return err.pythonError.retryable;

      const msg = (err.message || "").toLowerCase();
      const pythonErr = err.pythonError?.error?.toLowerCase() || "";

      // Network/timeout errors
      if (
        msg.includes("timeout") ||
        msg.includes("network") ||
        msg.includes("fetch failed")
      )
        return true;
      if (
        msg.includes("econnrefused") ||
        msg.includes("enotfound") ||
        msg.includes("econnreset")
      )
        return true;

      // HTTP status codes
      if (msg.includes("429") || msg.includes("rate limit")) return true; // Rate limited
      if (msg.match(/5\d{2}/)) return true; // 5xx server errors

      // Python error codes
      if (pythonErr.includes("timeout") || pythonErr.includes("network"))
        return true;
      if (
        pythonErr.includes("rate_limited") ||
        pythonErr.includes("anticaptcha_unavailable")
      )
        return true;
      if (
        pythonErr.includes("captcha_solve_failed") ||
        pythonErr.includes("auth_transient")
      )
        return true;

      // Empty/invalid responses (often transient)
      if (
        msg.includes("empty output") ||
        msg.includes("unexpected token") ||
        msg.includes("json parse")
      )
        return true;

      // Default: assume unknown errors are NOT retryable (fail fast for bugs)
      return false;
    }

    // ── Generic vendor runner: auth + fetch + retry + circuit breaker ──────────
    async function runVendorWithAuthRetry({
      name,
      fetchAuth, // async () => { ci, rem } or similar
      fetchAnalog, // async (auth) => response JSON
      mapper, // (data) => { original, analogs }
      breaker,
      semaphore,
      retryOptions = {},
    }) {
      return runWithRetry(
        name,
        async () => {
          // Run inside semaphore + circuit breaker
          return await resilientVendorCall(breaker, semaphore, async () => {
            // Fetch auth FRESH on each retry attempt (critical!)
            const auth = fetchAuth ? await fetchAuth() : null;

            // Fetch analogs with auth
            const rawData = await fetchAnalog(auth);

            // Map to common format
            return mapper(rawData);
          });
        },
        {
          fallbackValue: { original: null, analogs: [] },
          ...retryOptions,
        },
      );
    }

    // ── Helper: Fetch Alatrade auth with retry (inline) ────────────────────────
    const fetchAlatradeAuthInline = async (maxAttempts = 2) => {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          console.log(`[alatrade-auth] inline attempt ${attempt}`);

          const r = await fetchWithTimeout(proxyAlatradeAuthUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });

          if (!r.ok) throw new Error(`Auth HTTP ${r.status}`);

          const data = await r.json();

          // Handle structured Python errors
          if (data.error) {
            const err = new Error(data.error);
            err.retryable = data.retryable ?? true;
            err.pythonError = data;
            throw err;
          }

          const authData = data.auth_data || data;
          if (!Array.isArray(authData) || authData.length === 0) {
            throw Object.assign(new Error("Empty auth response"), {
              retryable: true,
            });
          }

          const ciSession = authData.find((c) => c.name === "ci_sessions");
          const remId = authData.find((c) => c.name === "REMMEID");

          if (!ciSession?.value || !remId?.value) {
            throw new Error("Missing required cookies");
          }

          return { ci: ciSession.value, rem: remId.value, raw: authData };
        } catch (err) {
          const isRetryable =
            err.retryable ?? err.pythonError?.retryable ?? true;
          console.warn(
            `[alatrade-auth] attempt ${attempt} failed: ${err.message}${isRetryable ? " (retryable)" : ""}`,
          );

          if (!isRetryable || attempt === maxAttempts) throw err;

          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }
    };

    // ── Define vendor configs ──────────────────────────────────────────────────
    const vendorConfigs = [
      {
        name: "rossko",
        fetchAuth: null, // No auth needed
        fetchAnalog: async () => {
          const r = await fetchWithTimeout(proxyRosskoUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ partNumber, partName }),
          });
          if (!r.ok) throw new Error(`Rossko HTTP ${r.status}`);
          return r.json();
        },
        mapper: mapRossko,
        breaker: rosskoBreaker,
        semaphore: rosskoSemaphore,
        retryOptions: { maxAttempts: 3 },
      },
      {
        name: "alatrade",
        // ✅ Use ensureAlatradeAuth to check cache + expiration
        fetchAuth: async () => {
          const { ci, rem } = await ensureAlatradeAuth();
          return { ci, rem };
        },
        fetchAnalog: async (auth) => {
          const r = await fetchWithTimeout(proxyAlatradeUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              partNumber,
              partName,
              ci_session: auth.ci,
              rem_id: auth.rem,
            }),
          });
          if (!r.ok) throw new Error(`Alatrade HTTP ${r.status}`);
          return r.json();
        },
        mapper: mapAlatrade,
        breaker: alatradeBreaker,
        semaphore: alatradeSemaphore,
        retryOptions: {
          maxAttempts: 3,
          isRetryable: (err) => {
            if (
              err.message?.includes("auth") ||
              err.pythonError?.error?.includes("auth")
            )
              return true;
            return defaultIsRetryable(err);
          },
        },
      },
      {
        name: "shatem",
        // ✅ Use ensureShatemAuth to check cache + expiration
        fetchAuth: async () => {
          const { antiforgery, x_access_token, x_refresh_token } =
            await ensureShatemAuth();
          return { antiforgery, x_access_token, x_refresh_token };
        },
        fetchAnalog: async (auth) => {
          const r = await fetchWithTimeout(proxyShatemUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              partNumber,
              agreement: SHATEM_AGREEMENT,
              partName,
              antiforgery: auth.antiforgery,
              x_access_token: auth.x_access_token,
              x_refresh_token: auth.x_refresh_token, // 🔥 Include refresh token if needed
            }),
          });
          if (!r.ok) throw new Error(`Shatem HTTP ${r.status}`);
          return r.json();
        },
        mapper: mapShatem,
        breaker: shatemBreaker,
        semaphore: shatemSemaphore,
        retryOptions: { maxAttempts: 2, initialDelayMs: 1500 },
      },
      {
        name: "autotrade",
        // ✅ Use ensureAutotradeAuth to check cache + expiration
        fetchAuth: async () => {
          const jar = await ensureAutotradeAuth();
          return jar;
        },
        fetchAnalog: async (jar) => {
          const payload = {
            q: partNumber,
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
        },
        mapper: mapAutotrade,
        breaker: autotradeBreaker,
        semaphore: autotradeSemaphore,
        retryOptions: { maxAttempts: 3 },
      },
    ];

    // ── Execute all vendors concurrently with proper retry logic ───────────────
    console.log(
      `[AGGREGATION] Starting vendor fetches for part: ${partNumber}`,
    );

    const vendorResults = await Promise.all(
      vendorConfigs.map((config) =>
        runVendorWithAuthRetry(config).catch((err) => {
          console.error(`[${config.name}] final failure: ${err.message}`);
          return { original: null, analogs: [] };
        }),
      ),
    );

    // ── Merge results ──────────────────────────────────────────────────────────
    const [rossko, alatrade, shatem, autotrade] = vendorResults;

    console.log({
      rossko: rossko.analogs?.length || 0,
      alatrade: alatrade.analogs?.length || 0,
      shatem: shatem.analogs?.length || 0,
      autotrade: autotrade.analogs?.length || 0,
    });

    // Prefer Rossko original if available
    let original = rossko.original ??
      alatrade.original ?? {
        name: partName,
        brand: "",
        guid: "",
        article: partNumber,
      };

    // Combine all analogs (no filtering)
    const combined = [
      ...(rossko.analogs || []),
      ...(alatrade.analogs || []),
      ...(shatem.analogs || []),
      ...(autotrade.analogs || []),
    ].filter(Boolean);

    const keyOf = (a) => {
      if (a.article && a.brand)
        return `a:${normalize(a.article)}|${normalize(a.brand)}`;
      if (a.article) return `a:${normalize(a.article)}`;
      if (a.brand && a.name)
        return `bn:${normalize(a.brand)}|${normalize(a.name)}`;
      return `n:${normalize(a.name)}`;
    };

    const mergedMap = new Map();
    for (const item of combined) {
      const k = keyOf(item);
      const prev = mergedMap.get(k);

      if (!prev) {
        mergedMap.set(k, {
          article: item.article ?? null,
          brand: item.brand ?? null,
          name:
            item.source === "shatem" && item.name?.length > 10
              ? item.name
              : (item.name ?? null),
          guid: item.guid ?? null,
          pictures: Array.isArray(item.pictures) ? [...item.pictures] : [],
          stocks: Array.isArray(item.stocks) ? [...item.stocks] : [],
          sources: [item.source],
        });
      } else {
        if (
          item.source === "shatem" &&
          item.name?.length > 10 &&
          (!prev.name || prev.name.length < 15)
        ) {
          prev.name = item.name;
        }

        // Merge other fields
        prev.article ||= item.article;
        prev.brand ||= item.brand;
        prev.guid ||= item.guid;

        if (Array.isArray(item.pictures) && item.pictures.length) {
          const set = new Set([...(prev.pictures ?? []), ...item.pictures]);
          prev.pictures = [...set];
        }
        prev.stocks = mergeStocks(prev.stocks, item.stocks ?? []);

        if (!prev.sources.includes(item.source)) {
          prev.sources.push(item.source);
        }
      }
    }

    const analogs = Array.from(mergedMap.values());
    console.log(`[AGGREGATION] Completed: ${analogs.length} unique analogs`);

    res.status(200).json({ original: original, analogs: analogs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
