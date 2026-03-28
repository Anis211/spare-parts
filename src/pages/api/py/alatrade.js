// pages/api/py/alatrade.js
import { spawn } from "child_process";
import path from "path";

export const config = { api: { bodyParser: true } };

const MAX_ATTEMPTS = 3;
const TIMEOUT_MS = 180_000;
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

// --- Run Python and capture output ---
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
      if (s.trim()) console.error("[Python stderr]:", s.trim());
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
          new Error(stderrData.trim() || `Python exited with code ${code}`),
        );
      }
      resolve({ stdout: (stdoutData || "").trim(), stderr: stderrData });
    });
  });
}

// --- Retry wrapper with JSON parsing ---
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
      const result = await runPythonOnce(args, { timeoutMs });
      const out = result.stdout;

      if (!out) throw new Error("Empty output from Python script");

      // Try parsing full output first
      try {
        const parsed = JSON.parse(out);
        if (Array.isArray(parsed)) return parsed;
        return parsed;
      } catch (e) {
        // Fallback: try last line
        const lines = out
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean);
        const last = lines[lines.length - 1] || "";
        if (!last) throw new Error("No JSON-like line");

        const parsedLast = JSON.parse(last);
        if (Array.isArray(parsedLast) && parsedLast.length === 0) {
          throw new Error("Empty array (transient)");
        }
        return parsedLast;
      }
    } catch (err) {
      console.warn(`[${label}] attempt ${i} failed: ${err.message}`);
      lastErr = err;
      if (i < attempts) {
        await new Promise((r) => setTimeout(r, delay));
        delay = Math.ceil(delay * backoff);
      }
    }
  }
  throw lastErr || new Error(`[${label}] failed after ${attempts} attempts`);
}

// --- Flexible location filter (FIXED) ---
function isInAstana(part) {
  // Check multiple possible location fields
  const location = (
    part.SNAME ||
    part.CITY ||
    part.LOCATION ||
    part.WAREHOUSE ||
    part.place ||
    ""
  )
    .toString()
    .toLowerCase()
    .trim();

  // Match any variant of "Астана"
  return location.includes("астана") || location.includes("astana");
}

// --- Part name filter (kept from your code) ---
function filterPartsFunc(parts, partName) {
  if (!Array.isArray(parts) || !partName || typeof partName !== "string") {
    return parts || [];
  }

  const normalize = (s) =>
    (s || "")
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/[^a-z0-9\u0430-\u044f\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const canonicalize = (s) => {
    let t = " " + s + " ";
    if (
      /\bрадиатор\b/.test(t) &&
      (/\bосновн/.test(t) ||
        /\bохлажд/.test(t) ||
        /\bсистем[аы]\s+охлажден/.test(t))
    ) {
      t = t.replace(
        /\bрадиатор\b[^\S\r\n]*(?:двигателя|охлаждения|охлаждающей|основной)?/g,
        " радиатор системы охлаждения ",
      );
    }
    return normalize(t);
  };

  const ngrams = (s, n = 3) => {
    s = " " + canonicalize(s) + " ";
    if (s.length < n) return new Set([s]);
    const set = new Set();
    for (let i = 0; i <= s.length - n; i++) set.add(s.slice(i, i + n));
    return set;
  };

  const jaccard = (aSet, bSet) => {
    if (!aSet.size && !bSet.size) return 0;
    let inter = 0;
    for (const x of aSet) if (bSet.has(x)) inter++;
    return inter / (aSet.size + bSet.size - inter || 1);
  };

  const levenshtein = (a, b, cap = 100) => {
    a = canonicalize(a);
    b = canonicalize(b);
    if (a === b) return 0;
    const m = a.length,
      n = b.length;
    if (Math.max(m, n) === 0) return 0;
    if (Math.abs(m - n) > cap) return cap;
    const dp = Array(n + 1)
      .fill(0)
      .map((_, j) => j);
    for (let i = 1; i <= m; i++) {
      let prev = dp[0];
      dp[0] = i;
      for (let j = 1; j <= n; j++) {
        const temp = dp[j];
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
        prev = temp;
      }
    }
    return Math.min(dp[n], cap);
  };

  const TARGET = canonicalize(partName);
  const targetTokens = TARGET.split(" ").filter(Boolean);
  const targetNgrams = ngrams(TARGET, 3);
  const STOP = new Set([
    "для",
    "в",
    "и",
    "на",
    "с",
    "стд",
    "комплект",
    "оригинал",
    "качество",
    "левый",
    "правый",
    "передний",
    "задний",
  ]);
  const simplifyTokens = (arr) => arr.filter((t) => !STOP.has(t));

  const scorePair = (candidateName) => {
    const C = canonicalize(candidateName);
    if (!C) return 0;
    if (C === TARGET) return 100;
    if (C.includes(TARGET) || TARGET.includes(C)) return 92;
    const ngSim = jaccard(targetNgrams, ngrams(C, 3));
    const candTokens = simplifyTokens(C.split(" ").filter(Boolean));
    const tt = new Set(simplifyTokens(targetTokens));
    let common = 0;
    for (const t of candTokens) if (tt.has(t)) common++;
    const tokenOverlap =
      common / Math.max(1, Math.max(tt.size, candTokens.length));
    const firstBoost =
      targetTokens[0] && candTokens[0] && targetTokens[0] === candTokens[0]
        ? 0.08
        : 0;
    const lv = levenshtein(TARGET, C, 60);
    const lvSim = Math.max(0, 1 - lv / Math.max(6, TARGET.length));
    let score = 70 * ngSim + 18 * tokenOverlap + 7 * lvSim + 100 * firstBoost;
    return Math.max(0, Math.min(99, Math.round(score)));
  };

  return parts
    .map((part) => {
      const name = part.NAME || part.name || "";
      const s = scorePair(name);
      const article = normalize(part.article || part.ARTICLE || "");
      let bonus = 0;
      if (!name && article) {
        const comp = article.replace(/[^a-z0-9]/g, "");
        const inTarget = normalize(partName).replace(/[^a-z0-9]/g, "");
        if (
          comp &&
          inTarget &&
          (inTarget.includes(comp) || comp.includes(inTarget))
        )
          bonus = 10;
      }
      return { ...part, __score: s + bonus };
    })
    .filter((x) => x.__score > 0)
    .sort((a, b) => b.__score - a.__score)
    .map(({ __score, ...rest }) => rest);
}

// --------------- API handler ---------------
export default async function handler(req, res) {
  const { partNumber, partName, ci_session, rem_id } =
    req.method === "POST" ? req.body : req.query;

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log(
    `[alatrade] Starting: partNumber=${partNumber}, partName=${partName}`,
  );

  try {
    const scriptPath = path.join(
      process.cwd(),
      "python",
      "alatrade_analogs.py",
    );

    // Run spider with all required args
    const products = await runPythonJSONWithRetry(
      [
        scriptPath,
        partNumber || "",
        ci_session || "",
        rem_id || "",
        partName || "",
      ],
      { label: "alatrade-analogs" },
    );

    // Debug: Log raw results BEFORE filtering
    console.log(
      `[alatrade] Raw results: ${Array.isArray(products) ? products.length : 0} items`,
    );
    if (Array.isArray(products) && products.length > 0) {
      const sample = products[0];
      console.log(
        `[alatrade] Sample item keys: ${Object.keys(sample).join(", ")}`,
      );
      console.log(
        `[alatrade] Sample SNAME/CITY: "${sample.SNAME}" / "${sample.CITY}"`,
      );
    }

    // Apply name filtering first
    const nameFiltered = filterPartsFunc(products, partName);
    console.log(`[alatrade] After name filter: ${nameFiltered.length} items`);

    // Apply LOCATION filter with flexible matching + debug logging
    const locationFiltered = nameFiltered.filter((p, idx) => {
      const inAstana = isInAstana(p);
      if (!inAstana && idx < 3) {
        // Log first few filtered-out items for debugging
        console.log(
          `[alatrade] Filtered out (location): SNAME="${p.SNAME}", CITY="${p.CITY}"`,
        );
      }
      return inAstana;
    });

    console.log(
      `[alatrade] After location filter (Астана): ${locationFiltered.length} items`,
    );

    // If filter removed everything, return unfiltered results with warning (fallback)
    if (locationFiltered.length === 0 && nameFiltered.length > 0) {
      console.warn(
        "[alatrade] Location filter removed all results - returning unfiltered as fallback",
      );
      // Optional: return a subset with location info so client can decide
      return res.status(200).json({
        analogs: nameFiltered.slice(0, 20), // Limit to avoid huge responses
        warning:
          "No items matched location 'Астана' - returning unfiltered results",
        returned: nameFiltered.length,
        attempts: MAX_ATTEMPTS,
      });
    }

    return res.status(200).json({
      analogs: locationFiltered,
      returned: locationFiltered.length,
      attempts: MAX_ATTEMPTS,
    });
  } catch (e) {
    console.error("[alatrade] Handler error:", e.message);
    return res.status(500).json({
      error: e.message || "Internal server error",
      details: process.env.NODE_ENV === "development" ? e.stack : undefined,
    });
  }
}
