import { spawn } from "child_process";
import path from "path";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000; // 2 seconds wait between retries

// Helper function to wait
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to run the Python process once
function runPythonAuthScript(pythonExecutable, scriptPath) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExecutable, [scriptPath]);

    let stdoutData = "";
    let stderrData = "";

    pythonProcess.stdout.on("data", (data) => {
      stdoutData += data.toString("utf8");
    });

    pythonProcess.stderr.on("data", (data) => {
      stderrData += data.toString();
      console.error("[Python stderr]:", data.toString());
    });

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        // Clean whitespace
        const out = (stdoutData || "").trim();

        if (!out) {
          // This rejection triggers the retry loop
          return reject(new Error("Python script returned empty output"));
        }

        try {
          const parsedData = JSON.parse(out);
          // Extra check: ensure the object isn't empty {}
          if (Object.keys(parsedData).length === 0) {
            return reject(
              new Error("Python script returned empty JSON object")
            );
          }
          resolve(parsedData);
        } catch (e) {
          console.error("Failed to parse Python output:", e);
          reject(new Error("Invalid JSON output from Python script"));
        }
      } else {
        reject(
          new Error(
            stderrData.trim() || `Python script exited with code ${code}`
          )
        );
      }
    });

    pythonProcess.on("error", (err) => {
      reject(new Error(`Failed to start Python: ${err.message}`));
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      pythonProcess.kill("SIGTERM");
      reject(new Error("Python script timed out"));
    }, 30000);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("Started autotrade_auth proxy");

  const pythonExecutable = path.join(
    process.cwd(),
    "python",
    "Scripts",
    "python.exe"
  );
  const scriptPath = path.join(process.cwd(), "python", "autotrade_auth.py");

  let lastError = null;

  // Retry Loop
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(
        `[Auth Autotrade Attempt ${attempt}/${MAX_RETRIES}] Running script...`
      );

      const authResult = await runPythonAuthScript(
        pythonExecutable,
        scriptPath
      );

      // If we get here, we have valid data. Return immediately.
      console.log(`[Auth Autotrade Attempt ${attempt}] Success.`);
      return res.status(200).json(authResult);
    } catch (error) {
      console.warn(
        `[Auth Autotrade Attempt ${attempt}] Failed: ${error.message}`
      );
      lastError = error;

      // If we have retries left, wait before trying again
      if (attempt < MAX_RETRIES) {
        console.log(`Waiting ${RETRY_DELAY_MS}ms before retry...`);
        await wait(RETRY_DELAY_MS);
      }
    }
  }

  // If the loop finishes, all attempts failed
  console.error("All auth attempts failed.");
  return res.status(500).json({
    error: "Failed to retrieve auth data after multiple attempts",
    details: lastError ? lastError.message : "Unknown error",
  });
}
