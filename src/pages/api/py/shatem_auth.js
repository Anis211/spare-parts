import { spawn } from "child_process";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("Started shatem_auth proxy");

  try {
    // Prefer venv python if present; else fallback to "python"
    const venvPython = path.join(
      process.cwd(),
      "python",
      "Scripts",
      "python.exe"
    );
    const pythonExecutable =
      process.platform === "win32" ? venvPython : "python";

    const scriptPath = path.join(process.cwd(), "python", "shatem_auth.py");

    const products = await new Promise((resolve, reject) => {
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
          return reject({
            error:
              stderrData.trim() || `Python script exited with code ${code}`,
          });
        }

        if (!out) {
          return reject({
            error: "Python returned empty output",
            stderr: stderrData.trim(),
          });
        }

        try {
          const parsed = JSON.parse(out);
          return resolve(parsed);
        } catch (e) {
          return reject({
            error: "Invalid output from Python script (JSON parse failed)",
            rawOutput: out.slice(0, 5000), // cap to avoid flooding logs
            stderr: stderrData.trim(),
          });
        }
      });

      pr1.on("error", (err) => {
        console.error("Failed to start Python process:", err.message);
        reject({ error: `Failed to start Python: ${err.message}` });
      });

      // Watchdog: kill if hanging
      const timeoutMs = 30000;
      const timer = setTimeout(() => {
        try {
          pr1.kill("SIGTERM");
        } catch {}
        reject({
          error: `Python script timed out after ${timeoutMs / 1000} seconds`,
        });
      }, timeoutMs);

      pr1.on("exit", () => clearTimeout(timer));
    });

    return res.status(200).json({ auth_data: products });
  } catch (e) {
    console.error("Unexpected error in handler:", e);
    return res
      .status(500)
      .json(e?.error ? e : { error: e?.message || "Internal server error" });
  }
}
