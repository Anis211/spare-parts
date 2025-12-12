// pages/api/py/alatrade.js
import { spawn } from "child_process";
import path from "path";

export const config = { api: { bodyParser: true } };

const MAX_ATTEMPTS = 3;
const TIMEOUT_MS = 120_000;
const INITIAL_DELAY = 700;
const BACKOFF = 1.7;

// --- Python exe resolver (Windows dev vs Linux/macOS prod)
function resolvePythonExe() {
  if (process.env.PYTHON_EXE) return process.env.PYTHON_EXE;
  if (process.platform === "win32") {
    return path.join(process.cwd(), "python", "Scripts", "python.exe");
  }
  return "python3";
}

// --- run once and return stdout as string
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
              `Python script exited with code ${code}`
          )
        );
      }
      resolve((stdoutData || "").trim());
    });
  });
}

// --- retry wrapper that parses JSON and treats empty/empty-array as retryable
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

      // Python must print ONLY JSON
      const parsed = JSON.parse(out);

      // If the result is an array and empty, treat it as transient and retry
      if (Array.isArray(parsed) && parsed.length === 0) {
        throw new Error("Python returned empty array (retrying)");
      }

      return parsed;
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

// --- API handler
export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("Started alatrade_auth proxy");

  const scriptPath = path.join(process.cwd(), "python", "alatrade_auth.py");

  try {
    // call the script (no extra args). If you need to pass args add them to the array.
    const authData = await runPythonJSONWithRetry([scriptPath], {
      attempts: MAX_ATTEMPTS,
      timeoutMs: TIMEOUT_MS,
      initialDelay: INITIAL_DELAY,
      backoff: BACKOFF,
      label: "alatrade-auth",
    });

    console.log(
      "[alatrade-auth] success:",
      Array.isArray(authData) ? `array(${authData.length})` : typeof authData
    );

    return res.status(200).json({
      auth_data: authData,
      attempts: MAX_ATTEMPTS,
    });
  } catch (e) {
    console.error("All alatrade auth attempts failed.", e);
    return res.status(500).json({
      error: "Failed to retrieve auth data after multiple attempts",
      details: e.message || "Unknown error",
    });
  }
}
