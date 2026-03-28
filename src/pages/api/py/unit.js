import { spawn } from "child_process";
import path from "path";

export default async function handler(req, res) {
  // Prevent caching
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private",
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  // Extract parameters (POST body or query string)
  const params = req.method === "POST" ? req.body : req.query;

  // Normalize parameters (support underscore/camelCase)
  const ssd = (params.ssd || "").toString().trim();
  const catalogId = (
    params.catalog_id !== undefined ? params.catalog_id : params.catalogId
  )
    .toString()
    .trim();
  const unitId = (params.unit_id !== undefined ? params.unit_id : params.unitId)
    .toString()
    .trim();

  // Validate required parameters
  const errors = [];
  if (!ssd) errors.push("ssd");
  if (!catalogId) errors.push("catalogId");
  if (!unitId) errors.push("unitId");

  if (errors.length > 0) {
    console.error("[Unit] Validation failed:", errors);
    return res.status(400).json({
      error: `Missing required parameters: ${errors.join(", ")}`,
      required: ["ssd", "catalogId", "unitId"],
      provided: { ssd: !!ssd, catalogId: !!catalogId, unitId: !!unitId },
      rawValues: { ssd, catalogId, unitId },
    });
  }

  // Prepare Python execution
  const pythonExecutable = path.join(
    process.cwd(),
    "python",
    "Scripts",
    "python.exe",
  );
  const scriptPath = path.join(process.cwd(), "python", "rossko_unit.py");
  const args = [scriptPath, ssd, catalogId, unitId];

  console.log("[Unit] Executing:", {
    script: scriptPath,
    catalogId,
    unitId,
    ssdPreview: `${ssd.substring(0, 15)}...`,
  });

  try {
    const pr = spawn(pythonExecutable, args, {
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8",
        PYTHONUNBUFFERED: "1",
      },
    });

    let stdoutData = "";
    let stderrData = "";
    let timedOut = false;
    const timeoutMs = 30000;

    // Timeout handler
    const killer = setTimeout(() => {
      timedOut = true;
      pr.kill("SIGTERM");
    }, timeoutMs);

    // Capture output
    pr.stdout.on("data", (data) => (stdoutData += data.toString("utf8")));
    pr.stderr.on("data", (data) => {
      const chunk = data.toString("utf8");
      stderrData += chunk;
      console.error("[Python stderr]:", chunk.trim());
    });

    // Handle process completion
    pr.on("close", (code) => {
      clearTimeout(killer);

      if (timedOut) {
        console.error("[Unit] Timeout after 30s");
        return res.status(504).json({
          error: "Request timeout",
          details: "Python script exceeded 30 seconds",
        });
      }

      if (code !== 0) {
        const errorMsg = stderrData.trim() || `Exited with code ${code}`;
        console.error("[Unit] Script failed:", errorMsg);
        return res.status(502).json({
          error: "Unit fetch failed",
          pythonError: errorMsg,
          exitCode: code,
        });
      }

      // Parse Python's JSON output
      let pythonResult;
      try {
        pythonResult = JSON.parse(stdoutData);
      } catch (e) {
        console.error("[Unit] JSON parse failed:", e.message);
        return res.status(500).json({
          error: "Invalid Python response format",
          details: e.message,
        });
      }

      // Convert response_text string → JS object
      let parsedUnit = null;
      if (pythonResult.response_text) {
        try {
          parsedUnit = JSON.parse(pythonResult.response_text);
        } catch (e) {
          console.error("[Unit] response_text parse failed:", e.message);
          // Return raw data with error flag
          return res.status(200).json({
            ...pythonResult,
            parsingError: `Failed to parse response_text: ${e.message}`,
            meta: {
              catalogId,
              unitId,
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      // Success response with normalized data
      console.log(`[Unit] Success: ${parsedUnit?.parts?.length || 0} parts`);
      return res.status(200).json({
        ...pythonResult,
        parsed: parsedUnit, // Fully normalized JS object
        meta: {
          catalogId,
          unitId,
          timestamp: new Date().toISOString(),
        },
      });
    });

    // Handle spawn errors
    pr.on("error", (err) => {
      clearTimeout(killer);
      console.error("[Unit] Process error:", err.message);
      res.status(500).json({
        error: "Failed to start Python script",
        details: err.message,
      });
    });
  } catch (error) {
    console.error("[Unit] Handler error:", error.message);
    res.status(500).json({
      error: "Internal server error",
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
