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

// --- Run Python and capture structured output ---
function runPythonOnce(args, { timeoutMs = TIMEOUT_MS } = {}) {
  const pythonExecutable = resolvePythonExe();
  const pyCwd = path.join(process.cwd(), "python");

  return new Promise((resolve, reject) => {
    const pr = spawn(pythonExecutable, ["-u", ...args], {
      stdio: ["ignore", "pipe", "pipe"],
      cwd: pyCwd,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: "1",
        PYTHONUTF8: "1",
      },
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
      const s = chunk.toString("utf8").trim();
      if (!s) return;
      stderrData += s + "\n";
      // Log but don't spam
      if (s.startsWith("[DEBUG]")) {
        console.debug(s);
      } else {
        console.error("[Python stderr]:", s);
      }
    });

    pr.on("error", (err) => {
      clearTimeout(killer);
      reject(new Error(`Failed to start Python: ${err.message}`));
    });

    pr.on("close", (code) => {
      clearTimeout(killer);
      if (timedOut) return reject(new Error("Python script timed out"));

      // Try to parse structured error from stderr first
      const stderrLines = stderrData.trim().split("\n").filter(Boolean);
      for (const line of stderrLines.reverse()) {
        try {
          const errObj = JSON.parse(line);
          if (errObj.error) {
            // Structured error from Python
            const err = new Error(errObj.error);
            err.pythonError = errObj;
            err.retryable = errObj.retryable ?? false;
            err.details = errObj.details;
            return reject(err);
          }
        } catch {}
      }

      if (code !== 0) {
        return reject(
          new Error(stderrData.trim() || `Python exited with code ${code}`),
        );
      }

      resolve((stdoutData || "").trim());
    });
  });
}

// --- Retry wrapper with smart retry logic ---
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

      const parsed = JSON.parse(out);

      // Empty array = transient, retry
      if (Array.isArray(parsed) && parsed.length === 0) {
        throw Object.assign(new Error("Empty cookies array"), {
          retryable: true,
        });
      }

      return parsed;
    } catch (err) {
      // Check if error is retryable
      const isRetryable = err.retryable ?? err.pythonError?.retryable ?? false;

      console.warn(
        `[${label}] attempt ${i} failed: ${err.message}${isRetryable ? " (retryable)" : ""}`,
      );
      lastErr = err;

      // Don't retry permanent errors
      if (!isRetryable) break;

      if (i < attempts) {
        const jitter = Math.random() * 200;
        await new Promise((r) => setTimeout(r, delay + jitter));
        delay = Math.min(Math.ceil(delay * backoff), 10000); // Cap at 10s
      }
    }
  }

  // Wrap final error with context
  const finalErr = new Error(`[${label}] failed after attempts`);
  finalErr.cause = lastErr;
  finalErr.pythonError = lastErr?.pythonError;
  throw finalErr;
}

// --- Smart auth fetch with retry on transient errors ---
async function fetchAlatradeAuthWithRetry(maxAttempts = 2) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[alatrade-auth] fetch attempt ${attempt}`);

      const authData = await runPythonJSONWithRetry(
        [path.join(process.cwd(), "python", "alatrade_auth.py")],
        { label: "alatrade-auth", attempts: 1 }, // Single attempt, outer loop handles retry
      );

      // Validate cookies structure
      if (!Array.isArray(authData) || authData.length === 0) {
        throw new Error("Invalid auth response format");
      }

      const ciSession = authData.find((c) => c.name === "ci_sessions");
      const remId = authData.find((c) => c.name === "REMMEID");

      if (!ciSession?.value || !remId?.value) {
        throw new Error("Missing required cookies");
      }

      return {
        ci: ciSession.value,
        rem: remId.value,
        raw: authData, // Keep for debugging if needed
      };
    } catch (err) {
      lastError = err;
      const isRetryable = err.retryable ?? err.pythonError?.retryable ?? true;

      if (!isRetryable || attempt === maxAttempts) {
        console.error(`[alatrade-auth] final failure: ${err.message}`);
        break;
      }

      // Exponential backoff for retryable errors
      const delay = Math.min(1000 * Math.pow(1.5, attempt), 5000);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastError || new Error("Alatrade auth failed");
}

// --- API handler ---
export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("Started alatrade_auth proxy");
  const startTime = Date.now();

  try {
    const authData = await fetchAlatradeAuthWithRetry();

    console.log(
      "[alatrade-auth] success:",
      `cookies: ${Array.isArray(authData.raw) ? authData.raw.length : 0}, time: ${Date.now() - startTime}ms`,
    );

    return res.status(200).json({
      auth_data: authData.raw,
      attempts: MAX_ATTEMPTS,
      timestamp: Date.now(),
    });
  } catch (e) {
    console.error("Alatrade auth failed:", {
      message: e.message,
      retryable: e.retryable,
      pythonError: e.pythonError,
      time: Date.now() - startTime,
    });

    // Return structured error for client-side handling
    return res.status(e.retryable === false ? 400 : 500).json({
      error: e.message || "auth_failed",
      retryable: e.retryable ?? true,
      details: e.pythonError?.details || e.details,
      timestamp: Date.now(),
    });
  }
}
