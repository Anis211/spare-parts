import { spawn } from "child_process";
import path from "path";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000; // 2 seconds wait

// Helper to wait
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to run the script once
function runPythonScript(pythonExecutable, scriptPath) {
  return new Promise((resolve, reject) => {
    const pr1 = spawn(pythonExecutable, [scriptPath], {
      env: {
        ...process.env,
        SHATE_LOGIN: process.env.SHATE_LOGIN || "CARMAX",
        SHATE_PASSWORD: process.env.SHATE_PASSWORD || "7013005755",
        SHATE_REMEMBER: process.env.SHATE_REMEMBER || "false",
      },
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"], // stdout + stderr separated
    });

    let stdoutData = "";
    let stderrData = "";

    pr1.stdout.on("data", (data) => {
      stdoutData += data.toString("utf8");
    });

    pr1.stderr.on("data", (data) => {
      const str = data.toString("utf8");
      stderrData += str;
      console.error("[Python stderr]:", str);
    });

    pr1.on("close", (code) => {
      // Trim BOM/whitespace just in case
      const out = (stdoutData || "").trim();

      if (code !== 0) {
        return reject(
          new Error(
            stderrData.trim() || `Python script exited with code ${code}`
          )
        );
      }

      if (!out) {
        return reject(new Error("Python returned empty output"));
      }

      try {
        const parsed = JSON.parse(out);

        // TRIGGER RETRY if array is empty (similar to alatrade logic)
        if (Array.isArray(parsed) && parsed.length === 0) {
          return reject(new Error("Python script returned empty array"));
        }

        // Also check if it's an empty object if that's a possibility for failure
        if (
          typeof parsed === "object" &&
          parsed !== null &&
          !Array.isArray(parsed) &&
          Object.keys(parsed).length === 0
        ) {
          return reject(new Error("Python script returned empty object"));
        }

        return resolve(parsed);
      } catch (e) {
        return reject(
          new Error("Invalid output from Python script (JSON parse failed)")
        );
      }
    });

    pr1.on("error", (err) => {
      console.error("Failed to start Python process:", err.message);
      reject(new Error(`Failed to start Python: ${err.message}`));
    });

    // Watchdog: kill if hanging
    const timeoutMs = 30000;
    const timer = setTimeout(() => {
      try {
        pr1.kill("SIGTERM");
      } catch {}
      reject(
        new Error(`Python script timed out after ${timeoutMs / 1000} seconds`)
      );
    }, timeoutMs);

    // Ensure timer is cleared if process exits early
    pr1.on("exit", () => clearTimeout(timer));
  });
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("Started shatem_auth proxy");

  // Prefer venv python if present; else fallback to "python"
  const venvPython = path.join(
    process.cwd(),
    "python",
    "Scripts",
    "python.exe"
  );
  const pythonExecutable = process.platform === "win32" ? venvPython : "python";

  const scriptPath = path.join(process.cwd(), "python", "shatem_auth.py");
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(
        `[Shatem Auth Attempt ${attempt}/${MAX_RETRIES}] Running script...`
      );

      const products = await runPythonScript(pythonExecutable, scriptPath);

      console.log(`[Shatem Auth Attempt ${attempt}] Success.`);
      return res.status(200).json({ auth_data: products });
    } catch (error) {
      console.warn(`[Shatem Auth Attempt ${attempt}] Failed: ${error.message}`);
      lastError = error;

      if (attempt < MAX_RETRIES) {
        console.log(`Waiting ${RETRY_DELAY_MS}ms before retry...`);
        await wait(RETRY_DELAY_MS);
      }
    }
  }

  console.error("All shatem auth attempts failed.");
  return res.status(500).json({
    error: "Failed to retrieve auth data after multiple attempts",
    details: lastError ? lastError.message : "Unknown error",
  });
}
