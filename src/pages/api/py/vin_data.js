import { spawn } from "child_process";
import path from "path";

export default async function handler(req, res) {
  const params = req.method === "POST" ? req.body : req.query;
  const vin = params.vin?.toString().trim();

  if (!vin || vin.length < 10) {
    return res.status(400).json({
      error: "Valid VIN required (minimum 10 characters)",
      received: vin?.substring(0, 20) + (vin?.length > 20 ? "..." : ""),
    });
  }

  console.log(`[VIN Lookup] Starting for VIN: ${vin}`);

  try {
    const pythonExecutable = path.join(
      process.cwd(),
      "python",
      "Scripts",
      "python.exe",
    );
    const scriptVinPath = path.join(process.cwd(), "python", "rossko_vin.py");

    const pr = spawn(pythonExecutable, [scriptVinPath, vin], {
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8",
        PYTHONUNBUFFERED: "1",
      },
      windowsHide: true,
    });

    let stdoutData = "";
    let stderrData = "";
    let timedOut = false;

    const timeoutMs = 30000;
    const killer = setTimeout(() => {
      timedOut = true;
      pr.kill("SIGTERM");
    }, timeoutMs);

    pr.stdout.on("data", (data) => (stdoutData += data.toString("utf8")));
    pr.stderr.on("data", (data) => {
      const chunk = data.toString("utf8");
      stderrData += chunk;
      console.error("[Python stderr]:", chunk.trim());
    });

    pr.on("close", async (code) => {
      clearTimeout(killer);

      if (timedOut) {
        console.error("[VIN] Python script timed out after 30 seconds");
        return res.status(504).json({
          error: "Request timeout",
          details: "VIN lookup exceeded 30-second limit",
        });
      }

      if (code !== 0) {
        const errorMsg =
          stderrData.trim() || `Python script exited with code ${code}`;
        console.error("[VIN] Script failed:", errorMsg);
        return res.status(502).json({
          error: "VIN lookup failed",
          pythonError: errorMsg,
          exitCode: code,
        });
      }

      // Parse raw Python output (validation only - DO NOT transform)
      try {
        const rawResult = JSON.parse(stdoutData);

        // CRITICAL VALIDATION (internal only - does NOT modify rawResult)
        let parsedResponse;
        if (rawResult.data !== undefined) {
          parsedResponse = rawResult.data;
        } else if (rawResult.response_text) {
          try {
            parsedResponse = JSON.parse(rawResult.response_text);
          } catch (e) {
            throw new Error(
              `[VIN] Invalid JSON in response_text: ${e.message}`,
            );
          }
        } else {
          throw new Error("[VIN] Missing response data");
        }

        if (!parsedResponse?.car) {
          throw new Error("VIN lookup failed: no car data found");
        }

        if (!parsedResponse.car.ssd || !parsedResponse.car.catalog) {
          throw new Error(
            "VIN lookup failed: missing critical car fields (ssd/catalog)",
          );
        }
        const parsedVinResult = parseVinResponse(rawResult);

        console.log(
          `[VIN] Success - Vehicle: ${parsedResponse.car.brand} ${parsedResponse.car.name} (VIN: ${vin})`,
        );
        return res.status(200).json({
          success: true,
          data: parsedVinResult,
        });
      } catch (validationErr) {
        console.error("[VIN] Validation failed:", validationErr.message);
        return res.status(500).json({
          error: "Invalid VIN response format",
          details: validationErr.message,
          rawOutput: stdoutData.substring(0, 500),
        });
      }
    });

    pr.on("error", (err) => {
      clearTimeout(killer);
      console.error("[VIN] Failed to start Python process:", err.message);
      res.status(500).json({
        error: "Failed to start VIN lookup script",
        details: err.message,
      });
    });
  } catch (error) {
    console.error("[VIN] Unexpected error:", error);
    res.status(500).json({
      error: "Internal server error during VIN lookup",
      details: error.message,
    });
  }
}

export const config = {
  api: {
    externalResolver: true,
    responseLimit: false,
  },
};
