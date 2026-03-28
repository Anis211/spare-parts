import { spawn } from "child_process";
import path from "path";

export default async function handler(req, res) {
  // Prevent all caching
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private",
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  // Extract parameters
  const params = req.method === "POST" ? req.body : req.query;

  console.log("[Details] Received params:", JSON.stringify(params, null, 2));
  console.log("[Details] Types:", {
    ssd: typeof params.ssd,
    vehicleId: typeof params.vehicleId,
    vehicle_id: typeof params.vehicle_id,
    catalogId: typeof params.catalogId,
    groupId: typeof params.groupId,
  });

  // Get parameters (support both underscore and camelCase)
  const ssd = params.ssd || "";
  const vehicleId =
    params.vehicle_id !== undefined ? params.vehicle_id : params.vehicleId;
  const catalogId =
    params.catalog_id !== undefined ? params.catalog_id : params.catalogId;
  const groupId =
    params.group_id !== undefined ? params.group_id : params.groupId;
  const parentGroupId =
    params.parent_group_id !== undefined
      ? params.parent_group_id
      : params.parentGroupId;

  console.log("[Details] Extracted values:", {
    ssd,
    vehicleId,
    catalogId,
    groupId,
    parentGroupId,
  });

  // Validate required parameters - accept strings, numbers, reject empty/null/undefined
  const errors = [];

  if (!ssd || (typeof ssd === "string" && ssd.trim() === "")) {
    errors.push("ssd");
  }

  if (
    vehicleId === null ||
    vehicleId === undefined ||
    vehicleId === "" ||
    (typeof vehicleId === "string" && vehicleId.trim() === "")
  ) {
    errors.push("vehicleId");
  }

  if (
    !catalogId ||
    (typeof catalogId === "string" && catalogId.trim() === "")
  ) {
    errors.push("catalogId");
  }

  if (!groupId || (typeof groupId === "string" && groupId.trim() === "")) {
    errors.push("groupId");
  }

  if (errors.length > 0) {
    console.error("[Details] Validation failed for:", errors);
    console.error("[Details] Values:", { ssd, vehicleId, catalogId, groupId });
    return res.status(400).json({
      error: `Missing required parameters: ${errors.join(", ")}`,
      required: ["ssd", "vehicleId", "catalogId", "groupId"],
      provided: {
        ssd: !!ssd,
        vehicleId:
          vehicleId !== null && vehicleId !== undefined && vehicleId !== "",
        catalogId: !!catalogId,
        groupId: !!groupId,
      },
      rawValues: { ssd, vehicleId, catalogId, groupId, parentGroupId },
    });
  }

  // Convert all to strings
  const cleanParams = {
    ssd: String(ssd).trim(),
    vehicleId: String(vehicleId).trim(),
    catalogId: String(catalogId).trim(),
    groupId: String(groupId).trim(),
    parentGroupId: parentGroupId ? String(parentGroupId).trim() : null,
  };

  console.log("[Details] Cleaned params:", cleanParams);

  try {
    const pythonExecutable = path.join(
      process.cwd(),
      "python",
      "Scripts",
      "python.exe",
    );
    const scriptDetailsPath = path.join(
      process.cwd(),
      "python",
      "rossko_details.py",
    );

    const args = [
      scriptDetailsPath,
      cleanParams.ssd,
      cleanParams.vehicleId,
      cleanParams.catalogId,
      cleanParams.groupId,
    ];

    if (cleanParams.parentGroupId) {
      args.push(cleanParams.parentGroupId);
    }

    console.log(
      "[Details] Executing Python with args:",
      args
        .map((arg, i) => (i === 0 ? arg : arg.substring(0, 30) + "..."))
        .join(", "),
    );

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
    const killer = setTimeout(() => {
      timedOut = true;
      pr.kill("SIGTERM");
    }, timeoutMs);

    pr.stdout.on("data", (data) => {
      stdoutData += data.toString("utf8");
    });

    pr.stderr.on("data", (data) => {
      const str = data.toString("utf8");
      stderrData += str;
      console.error("[Python stderr]:", str.trim());
    });

    pr.on("close", async (code) => {
      clearTimeout(killer);

      if (timedOut) {
        console.error("[Details] Python script timed out after 30 seconds");
        return res.status(504).json({
          error: "Request timeout",
          details: "Python script execution exceeded 30 seconds",
        });
      }

      if (code !== 0) {
        const errorMsg =
          stderrData.trim() || `Python script exited with code ${code}`;
        console.error("[Details] Script failed:", errorMsg);
        return res.status(502).json({
          error: "Details fetch failed",
          pythonError: errorMsg,
          statusCode: code,
        });
      }

      let pythonResult;
      try {
        pythonResult = JSON.parse(stdoutData);
      } catch (parseErr) {
        console.error(
          "[Details] Failed to parse Python output:",
          parseErr.message,
        );
        return res.status(500).json({
          error: "Invalid response format from details script",
          details: parseErr.message,
        });
      }

      let parsedDetails = null;
      try {
        parsedDetails = JSON.parse(pythonResult.response_text);
      } catch (innerParseErr) {
        console.error(
          "[Details] Failed to parse response_text:",
          innerParseErr.message,
        );
        return res.status(200).json({
          ...pythonResult,
          parsingError: `Failed to parse response_text: ${innerParseErr.message}`,
        });
      }

      console.log(
        `[Details] Success: ${parsedDetails.units?.length || 0} units`,
      );

      return res.status(200).json({
        ...pythonResult,
        parsed: parsedDetails,
        meta: {
          requestedGroupId: cleanParams.groupId,
          requestedParentGroupId: cleanParams.parentGroupId,
          vehicleId: cleanParams.vehicleId,
          catalogId: cleanParams.catalogId,
          timestamp: new Date().toISOString(),
        },
      });
    });

    pr.on("error", (err) => {
      clearTimeout(killer);
      console.error("[Details] Failed to start Python process:", err.message);
      res.status(500).json({
        error: "Failed to start details script",
        details: err.message,
      });
    });
  } catch (error) {
    console.error("[Details] Unexpected error:", error);
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
