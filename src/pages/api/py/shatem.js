// pages/api/py/shatem.js
import { spawn } from "child_process";
import path from "path";

export const config = { api: { bodyParser: true } };

const MAX_ATTEMPTS = 3;
const TIMEOUT_MS = 120_000;
const INITIAL_DELAY = 700;
const BACKOFF = 1.7;

// --- Python exe resolver ---
function resolvePythonExe() {
  if (process.env.PYTHON_EXE) return process.env.PYTHON_EXE;
  if (process.platform === "win32") {
    return path.join(process.cwd(), "python", "Scripts", "python.exe");
  }
  return "python3";
}

// --- Run Python once ---
function runPythonOnce(args, { timeoutMs = TIMEOUT_MS } = {}) {
  const pythonExecutable = resolvePythonExe();
  const pyCwd = path.join(process.cwd(), "python");

  return new Promise((resolve, reject) => {
    const pr = spawn(pythonExecutable, ["-u", ...args], {
      stdio: ["ignore", "pipe", "pipe"],
      cwd: pyCwd,
      env: { ...process.env, PYTHONUNBUFFERED: "1", PYTHONUTF8: "1" },
      windowsHide: true,
    });

    let stdoutData = "";
    let stderrData = "";
    let timedOut = false;

    const killer = setTimeout(() => {
      timedOut = true;
      try {
        pr.kill("SIGTERM");
      } catch {}
    }, timeoutMs);

    pr.stdout.on("data", (chunk) => {
      stdoutData += chunk.toString("utf8");
    });
    pr.stderr.on("data", (chunk) => {
      const s = chunk.toString("utf8");
      stderrData += s;
      console.error("[Python stderr]:", s);
    });

    pr.on("error", (err) => {
      clearTimeout(killer);
      reject(new Error(`Failed to start Python: ${err.message}`));
    });

    pr.on("close", (code) => {
      clearTimeout(killer);
      if (timedOut) return reject(new Error("Python script timed out"));
      if (code !== 0) {
        return reject(
          new Error(
            (stderrData && stderrData.trim()) ||
              `Python exited with code ${code}`,
          ),
        );
      }
      resolve((stdoutData || "").trim());
    });
  });
}

// --- Retry wrapper ---
async function runPythonJSONWithRetry(args, opts = {}) {
  const {
    attempts = MAX_ATTEMPTS,
    timeoutMs = TIMEOUT_MS,
    initialDelay = INITIAL_DELAY,
    backoff = BACKOFF,
    label = "python",
  } = opts;
  let lastErr,
    delay = initialDelay;

  for (let i = 1; i <= attempts; i++) {
    try {
      console.log(`[${label}] attempt ${i}/${attempts}`);
      const out = await runPythonOnce(args, { timeoutMs });
      if (!out) throw new Error("Empty output from Python script");
      return JSON.parse(out);
    } catch (err) {
      console.warn(`[${label}] failed attempt ${i}: ${err.message}`);
      lastErr = err;
      if (i < attempts) {
        await new Promise((r) => setTimeout(r, delay));
        delay = Math.ceil(delay * backoff);
      }
    }
  }
  throw lastErr || new Error(`[${label}] failed after ${attempts} attempts`);
}

// --------------- API handler ---------------
export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    partNumber,
    agreement,
    partName,
    antiforgery,
    x_access_token,
    x_refresh_token,
    car_data = "{}",
    city = "Астана",
  } = req.method === "POST" ? req.body : req.query;

  console.log(
    "Started shatem proxy for partNumber:",
    partNumber,
    "city:",
    city,
  );

  try {
    // === STEP 1: Smart part selection ===
    const selectorPath = path.join(
      process.cwd(),
      "python",
      "shatem_part_selector.py",
    );
    const selectionResult = await runPythonJSONWithRetry(
      [
        selectorPath,
        partNumber || "",
        car_data || "{}",
        antiforgery || "",
        x_access_token || "",
        x_refresh_token || "",
      ],
      { label: "shatem_part_selector" },
    );

    // Handle selection errors
    // Replace the selection error handling block with this:
    if (selectionResult.error) {
      console.error("❌ Part selector failed:", {
        error: selectionResult.error,
        details: selectionResult,
        args: [
          selectorPath,
          partNumber,
          car_data,
          antiforgery ? "..." : "empty",
          x_access_token ? "..." : "empty",
        ],
      });
      return res.status(400).json({
        error: selectionResult.error,
        details: selectionResult,
        debug:
          process.env.NODE_ENV === "development"
            ? { args: [partNumber, car_data] }
            : undefined,
      });
    }

    const selectedPart = selectionResult.selected_part;
    if (!selectedPart?.partId) {
      return res.status(404).json({
        error: "No suitable part found",
        query: partNumber,
        parts_found: selectionResult.parts_found,
      });
    }

    console.log(
      `Selected part: partId=${selectedPart.partId} brand=${selectedPart.tradeMark} reason=${selectionResult.selection_reason}`,
    );

    // === STEP 2: Fetch analogs for selected partId ===
    const analogsPath = path.join(process.cwd(), "python", "shatem_analogs.py");
    const analogsResult = await runPythonJSONWithRetry(
      [
        analogsPath,
        String(selectedPart.partId),
        agreement || "",
        antiforgery || "",
        x_access_token || "",
        x_refresh_token || "",
        selectedPart.article || "",
        selectedPart.tradeMark || "",
      ],
      { label: "shatem_analogs" },
    );

    // 🔥 DEBUG: Log what the analogs API actually returned
    console.log("🔍 ANALOGS API RESPONSE:", {
      part_id: analogsResult.part_id,
      original_prices_count: Array.isArray(analogsResult.original_prices)
        ? analogsResult.original_prices.length
        : "N/A",
      analogs_prices_count: Array.isArray(analogsResult.analogs_prices)
        ? analogsResult.analogs_prices.length
        : "N/A",
      analogs_media_count: Array.isArray(analogsResult.analogs_media)
        ? analogsResult.analogs_media.length
        : "N/A",
      error: analogsResult.error || null,
    });

    // Handle analogs errors
    if (analogsResult.error) {
      return res
        .status(500)
        .json({ error: analogsResult.error, part_id: selectedPart.partId });
    }

    // === STEP 3: Filter & format results (Node.js side) ===
    const analogsRaw =
      (Array.isArray(analogsResult?.analogs_prices) &&
        analogsResult.analogs_prices) ||
      [];
    const analogsMedia = analogsResult?.analogs_media || [];
    const cityNorm = String(city || "").trim();

    // 🔥 FIXED: Flatten offers from analogs - keep ALL city-matched items
    const offers = [];
    for (const row of analogsRaw) {
      const info = row?.partInfo || {};
      const prices = Array.isArray(row?.prices) ? row.prices : [];
      for (const pr of prices) {
        const prCity = (pr?.city || "").trim();
        // Only filter by city, NOT by name similarity
        if (!cityNorm || prCity === cityNorm) {
          offers.push({
            name: info.description || info.descriptionFormatted || "",
            article: info.article || info.itemNumber || "",
            brand: info.tradeMarkName || "",
            guid: info.id,
            price: pr.price,
            currency: pr.currencyCode,
            city: prCity,
            availability: pr.availability,
            inventory: pr.inventory,
            location: pr.location,
            deliveryDate:
              pr.deliveryInfo?.deliveryDateTimes?.[0]?.deliveryDate || null,
            deliveryTime:
              pr.deliveryInfo?.deliveryDateTimes?.[0]?.deliveryTime || null,
            source: "shatem", // Tag with source for name prioritization
          });
        }
      }
    }

    const ranked = offers;
    console.log(
      `🔍 City filter: ${cityNorm} → ${ranked.length} analogs (all kept)`,
    );

    return res.status(200).json({
      searched_number: partNumber,
      selected_part: selectedPart,
      selection_reason: selectionResult.selection_reason,
      analogs: ranked,
      analogs_raw: analogsRaw,
      analogs_media: analogsMedia,
      original_prices: analogsResult.original_prices,
      attempts: MAX_ATTEMPTS,
    });
  } catch (e) {
    console.error("Unexpected error in handler:", e);
    return res
      .status(500)
      .json({ error: e.message || "Internal server error" });
  }
}
