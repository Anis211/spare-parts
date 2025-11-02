import { spawn } from "child_process";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("Started alatrade_auth proxy");

  try {
    // Use the Python executable from your virtual environment directly
    const pythonExecutable = path.join(
      process.cwd(),
      "python",
      "Scripts",
      "python.exe"
    );

    const scriptPath = path.join(process.cwd(), "python", "alatrade_auth.py");

    // First, get the products
    const products = await new Promise((resolve, reject) => {
      const pr1 = spawn(pythonExecutable, [scriptPath]);

      let stdoutData = "";
      let stderrData = "";

      pr1.stdout.on("data", (data) => {
        stdoutData += data.toString("utf8");
      });

      pr1.stderr.on("data", (data) => {
        const str = data.toString();
        stderrData += str;
        console.error("[Python stderr]:", str);
      });

      pr1.on("close", (code) => {
        if (code === 0) {
          try {
            const parsedProducts = JSON.parse(stdoutData);
            resolve(parsedProducts);
          } catch (e) {
            console.error("Failed to parse Python output:", e);
            reject({
              error: "Invalid output from Python script",
              rawOutput: stdoutData,
            });
          }
        } else {
          reject({
            error:
              stderrData.trim() || `Python script exited with code ${code}`,
          });
        }
      });

      pr1.on("error", (err) => {
        console.error("Failed to start Python process:", err.message);
        reject({ error: `Failed to start Python: ${err.message}` });
      });

      // Set timeout to prevent hanging
      setTimeout(() => {
        pr1.kill("SIGTERM");
        reject({ error: "Python script timed out after 30 seconds" });
      }, 30000);
    });

    return res.status(200).json({ auth_data: products });
  } catch (e) {
    console.error("Unexpected error in handler:", e);
    if (e.error) {
      return res
        .status(500)
        .json({ error: e.error || "Internal server error" });
    }
    return res
      .status(500)
      .json({ error: e.message || "Internal server error" });
  }
}
