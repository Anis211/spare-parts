import { spawn } from "child_process";
import path from "path";

export default async function handler(req, res) {
  const {
    vin,
    includeCategories = true,
    includeGroups = true,
  } = req.method === "POST" ? req.body : req.query;

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!vin || typeof vin !== "string" || vin.trim().length < 10) {
    return res.status(400).json({
      error: "Valid VIN required (minimum 10 characters)",
      step: "vin",
    });
  }

  const cleanVin = vin.trim().replace(/\s+/g, "");
  console.log(`[Rossko Catalog] Starting lookup for VIN: ${cleanVin}`);

  try {
    const pythonExecutable = path.join(
      process.cwd(),
      "python",
      "Scripts",
      "python.exe",
    );
    const scriptVinPath = path.join(process.cwd(), "python", "rossko_vin.py");
    const scriptCategoriesPath = path.join(
      process.cwd(),
      "python",
      "rossko_categories.py",
    );
    const scriptGroupsPath = path.join(
      process.cwd(),
      "python",
      "rossko_groups.py",
    );

    // ---------------- Retry Helpers with UTF-8 Encoding Fix ----------------
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const runPythonOnce = (exe, args, timeoutMs = 30000) =>
      new Promise((resolve, reject) => {
        const pr = spawn(exe, args, {
          env: {
            ...process.env,
            PYTHONIOENCODING: "utf-8",
          },
        });

        let stdoutData = "";
        let stderrData = "";
        let timedOut = false;

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
          console.error(`[Python stderr][${args[0]}]:`, str.trim());
        });

        pr.on("close", (code) => {
          clearTimeout(killer);
          if (timedOut) {
            return reject(
              new Error("Python script timed out after 30 seconds"),
            );
          }
          if (code === 0) {
            resolve(stdoutData);
          } else {
            reject(
              new Error(
                stderrData.trim() || `Python script exited with code ${code}`,
              ),
            );
          }
        });

        pr.on("error", (err) => {
          clearTimeout(killer);
          console.error("Failed to start Python process:", err.message);
          reject(new Error(`Failed to start Python: ${err.message}`));
        });
      });

    const runPythonJSONWithRetry = async (
      exe,
      args,
      {
        attempts = 3,
        timeoutMs = 30000,
        initialDelay = 700,
        backoff = 1.7,
        label = "python",
      } = {},
    ) => {
      let lastErr;
      let delay = initialDelay;

      for (let i = 1; i <= attempts; i++) {
        try {
          console.log(
            `[${label}] Attempt ${i}/${attempts} for ${args.slice(0, 2).join(" ")}`,
          );
          const out = await runPythonOnce(exe, args, timeoutMs);
          try {
            const parsed = JSON.parse(out);
            console.log(`[${label}] Success on attempt ${i}`);
            return parsed;
          } catch (e) {
            console.error(
              `[${label}] JSON parse error on attempt ${i}:`,
              e.message,
            );
            lastErr = new Error(`Invalid JSON output from ${label} script`);
          }
        } catch (err) {
          console.warn(
            `[${label}] Failed attempt ${i}/${attempts}:`,
            err.message,
          );
          lastErr = err;
        }
        if (i < attempts) {
          await sleep(delay);
          delay = Math.ceil(delay * backoff);
        }
      }
      throw (
        lastErr || new Error(`[${label}] failed after ${attempts} attempts`)
      );
    };
    // ----------------------------------------------------------------

    // STEP 1: VIN Lookup (preserve vinResult exactly as received)
    console.log("[VIN] Starting VIN lookup...");
    const vinResult = await runPythonJSONWithRetry(
      pythonExecutable,
      [scriptVinPath, cleanVin],
      {
        attempts: 3,
        timeoutMs: 30000,
        initialDelay: 700,
        backoff: 1.7,
        label: "vin",
      },
    );

    // 🔑 INTERNAL FIX ONLY: Parse response to extract valid vehicleId (DO NOT modify vinResult)
    let parsedResponse;
    if (vinResult.data !== undefined) {
      parsedResponse = vinResult.data;
    } else if (vinResult.response_text) {
      try {
        parsedResponse = JSON.parse(vinResult.response_text);
      } catch (e) {
        throw new Error(`[VIN] Invalid JSON in response_text: ${e.message}`);
      }
    } else {
      throw new Error("[VIN] Missing response data");
    }

    if (!parsedResponse?.car) {
      throw new Error("VIN lookup failed: no car data found");
    }

    // 🔑 INTERNAL FIX ONLY: Extract VALID vehicleId from redirectUrl if car.id=0
    let vehicleId = parsedResponse.car.id;
    const redirectUrl = parsedResponse.redirectUrl;
    const catalog = parsedResponse.car.catalog;
    const ssd = parsedResponse.car.ssd;
    const catalogAggregator = parsedResponse.car.catalogAggregator;

    if (!vehicleId || vehicleId === "null") {
      if (!redirectUrl) {
        throw new Error("[VIN] Invalid vehicleId (0) and no redirectUrl");
      }

      try {
        const url = new URL(redirectUrl, "https://ns.rossko.ru");
        const idParam = url.searchParams.get("id");

        if (idParam && idParam !== "null") {
          vehicleId = idParam;
          console.log(
            `[VIN] ✅ Using vehicleId=${vehicleId} from redirectUrl (was ${parsedResponse.car.id})`,
          );
        } else {
          throw new Error(`redirectUrl has invalid id=${idParam}`);
        }
      } catch (e) {
        console.error(
          "[VIN] Failed to extract vehicleId from redirectUrl:",
          e.message,
        );
        throw new Error(`[VIN] Invalid vehicleId (${parsedResponse.car.id})`);
      }
    } else {
      vehicleId = String(vehicleId);
    }

    console.log(
      `[VIN] Extracted data - SSD: ${ssd ? "yes" : "no"}, Catalog: ${catalog}, Vehicle ID: ${vehicleId}, Catalog Aggregator: ${catalogAggregator}`,
    );

    // STEP 2: Fetch Categories (preserve original output structure)
    let categoriesData = null;
    if (includeCategories && ssd && catalog && vehicleId) {
      console.log("[Categories] Starting categories fetch...");
      try {
        const categoriesResult = await runPythonJSONWithRetry(
          pythonExecutable,
          [scriptCategoriesPath, ssd, catalog, vehicleId],
          {
            attempts: 3,
            timeoutMs: 30000,
            initialDelay: 700,
            backoff: 1.7,
            label: "categories",
          },
        );

        // 🔑 INTERNAL FIX ONLY: Parse both structures internally
        if (categoriesResult.data !== undefined) {
          categoriesData = categoriesResult.data;
        } else if (categoriesResult.response_text) {
          categoriesData = JSON.parse(categoriesResult.response_text);
        }
        console.log(
          `[Categories] Retrieved ${categoriesData?.length || 0} categories`,
        );
      } catch (err) {
        console.error("[Categories] Failed:", err.message);
      }
    }

    // STEP 3: Fetch Groups (preserve original output structure)
    let groupsData = null;
    if (includeGroups && ssd && catalog && vehicleId && catalogAggregator) {
      console.log("[Groups] Starting groups fetch...");
      try {
        const groupsResult = await runPythonJSONWithRetry(
          pythonExecutable,
          [scriptGroupsPath, ssd, catalog, vehicleId, catalogAggregator],
          {
            attempts: 3,
            timeoutMs: 30000,
            initialDelay: 700,
            backoff: 1.7,
            label: "groups",
          },
        );

        // 🔑 INTERNAL FIX ONLY: Parse both structures internally
        if (groupsResult.data !== undefined) {
          groupsData = groupsResult.data;
        } else if (groupsResult.response_text) {
          groupsData = JSON.parse(groupsResult.response_text);
        }
        console.log(`[Groups] Retrieved ${groupsData?.length || 0} groups`);
      } catch (err) {
        console.error("[Groups] Failed:", err.message);
      }
    }
    console.log(`[Rossko Catalog] Successfully processed VIN: ${cleanVin}`);

    if (
      vinResult.response_text &&
      typeof vinResult.response_text === "string"
    ) {
      try {
        vinResult.response_text = JSON.parse(vinResult.response_text);
        console.log("[VIN] ✅ Normalized response_text to JS object");
      } catch (e) {
        console.warn(
          "[VIN] Warning: Failed to parse response_text:",
          e.message,
        );
      }
    }

    return res.status(200).json({
      categories: categoriesData,
      groups: groupsData,
      vinLookup: vinResult,
    });
  } catch (error) {
    console.error("[Rossko Catalog] Fatal error:", error);
    return res.status(500).json({
      error: error.message || "Internal server error during VIN processing",
    });
  }
}
