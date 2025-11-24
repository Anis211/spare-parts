import { spawn } from "child_process";
import path from "path";

// Allow large payloads if necessary
export const config = { api: { bodyParser: true } };

const MAX_ATTEMPTS = 3;
const TIMEOUT_MS = 120_000; // 2 minutes timeout
const INITIAL_DELAY = 700;
const BACKOFF = 1.7;

// --- Helper Functions (from your reference) ---

function resolvePythonExe() {
  if (process.env.PYTHON_EXE) return process.env.PYTHON_EXE;
  if (process.platform === "win32") {
    return path.join(process.cwd(), "python", "Scripts", "python.exe");
  }
  return "python3";
}

function runPythonOnce(args, { timeoutMs = TIMEOUT_MS } = {}) {
  const pythonExecutable = resolvePythonExe();
  const pyCwd = path.join(process.cwd(), "python");

  return new Promise((resolve, reject) => {
    const pr = spawn(pythonExecutable, ["-u", ...args], {
      stdio: ["ignore", "pipe", "pipe"],
      cwd: pyCwd,
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
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
      const str = chunk.toString("utf8");
      stderrData += str;
      // Log stderr for debugging (crucial for your python logging setup)
      console.error("[Python stderr]:", str);
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
              `Python script exited with code ${code}`
          )
        );
      }
      resolve((stdoutData || "").trim());
    });
  });
}

async function runPythonJSONWithRetry(args, opts = {}) {
  const {
    attempts = MAX_ATTEMPTS,
    timeoutMs = TIMEOUT_MS,
    initialDelay = INITIAL_DELAY,
    backoff = BACKOFF,
    label = "python",
  } = opts;

  let lastErr;
  let delay = initialDelay;

  for (let i = 1; i <= attempts; i++) {
    try {
      console.log(`[${label}] attempt ${i}/${attempts}`);
      const out = await runPythonOnce(args, { timeoutMs });
      if (!out) throw new Error("Empty output from Python script");
      try {
        return JSON.parse(out);
      } catch (e) {
        throw new Error("Invalid JSON output from Python script");
      }
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

// --- Main Handler ---

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 1. Extract Parameters (body or query)
  const params = req.body;
  const {
    q,
    auth_key = ":auth_key",
    ddg8,
    ddg9,
    ddg10,
    ddg1,
    lang,
    sessid,
    series,
    logindt,
    referer,
  } = params;

  if (!q) {
    return res.status(400).json({ error: "Missing 'q' parameter" });
  }

  console.log("Started autotrade chain for query:", q);

  // Default Cookies (from your prompt)
  const cookies = {
    ddg8: ddg8 || "5a0zPwNpy82t7lhT",
    ddg9: ddg9 || "123.138.107.3",
    ddg10: ddg10 || "1763585193",
    ddg1: ddg1 || "xu64035pkFmwT3b7zaAh",
    lang: lang || "ru",
    sessid: sessid || "nph224ghe9e76pbvnklaa49p07",
    series: series || "",
    logindt: logindt || "2025-11-19",
    referer: referer || "",
  };

  try {
    // ============================================================
    // STEP 1: Search (Get Items)
    // ============================================================
    const searchScriptPath = path.join(
      process.cwd(),
      "python",
      "autotrade_json.py"
    );

    const searchArgs = [
      searchScriptPath,
      auth_key,
      q,
      cookies.ddg8,
      cookies.ddg9,
      cookies.ddg10,
      cookies.ddg1,
      cookies.lang,
      cookies.sessid,
      cookies.series,
      cookies.logindt,
      cookies.referer,
    ];

    const searchResult = await runPythonJSONWithRetry(searchArgs, {
      label: "autotrade-json",
    });

    if (!searchResult || !searchResult.items) {
      return res
        .status(200)
        .json({ error: "No items found in search step", raw: searchResult });
    }

    // ============================================================
    // STEP 2: Transform Data
    // Target Format: '{"Article": {"Brand": 1}, ...}'
    // ============================================================
    const itemsMap = {};

    // Ensure searchResult.items is an array
    const itemsArray = Array.isArray(searchResult.items)
      ? searchResult.items
      : [];

    itemsArray.forEach((item) => {
      // We need both article and brand_name to create the mapping
      if (item.article && item.brand_name) {
        // Example: itemsMap["95218372"] = { "GENERAL MOTORS": 1 }
        itemsMap[item.article] = { [item.brand_name]: 1 };
      }
    });

    const itemsJsonString = JSON.stringify(itemsMap);

    if (Object.keys(itemsMap).length === 0) {
      return res.status(200).json({
        message: "No valid items found to check stocks",
        searchResult,
      });
    }

    // ============================================================
    // STEP 3: Get Stocks (Get Prices/Stocks)
    // ============================================================
    const stocksScriptPath = path.join(
      process.cwd(),
      "python",
      "autotrade_stocks.py"
    );

    const strict = "1";
    const check_transit = "1";

    const stocksArgs = [
      stocksScriptPath,
      auth_key,
      itemsJsonString, // The transformed JSON string
      strict,
      check_transit,
      cookies.ddg8,
      cookies.ddg9,
      cookies.ddg10,
      cookies.ddg1,
      cookies.lang,
      cookies.sessid,
      cookies.series,
      cookies.logindt,
      cookies.referer,
    ];

    const stocksResult = await runPythonJSONWithRetry(stocksArgs, {
      label: "autotrade-stocks",
    });

    // ============================================================
    // STEP 4: Return Final Result
    // ============================================================
    return res.status(200).json(stocksResult);
  } catch (e) {
    console.error("Unexpected error in autotrade handler:", e);
    return res
      .status(500)
      .json({ error: e.message || "Internal server error" });
  }
}
