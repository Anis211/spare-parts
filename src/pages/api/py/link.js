import { spawn } from "child_process";
import path from "path";

export default async function handler(req, res) {
  const { partNumber, partName } = req.method === "POST" ? req.body : req.query;

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("Started proxy for partNumber:", partNumber);

  try {
    const pythonExecutable = path.join(
      process.cwd(),
      "python",
      "Scripts",
      "python.exe"
    );
    const scriptPath = path.join(process.cwd(), "python", "link.py");
    const scriptAnalogsPath = path.join(process.cwd(), "python", "analogs.py");

    // ---------------- retry helpers (non-invasive) ----------------
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const runPythonOnce = (exe, args, timeoutMs = 30000) =>
      new Promise((resolve, reject) => {
        const pr = spawn(exe, args);

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
          const str = data.toString();
          stderrData += str;
          console.error("[Python stderr]:", str);
        });

        pr.on("close", (code) => {
          clearTimeout(killer);
          if (timedOut) {
            return reject(
              new Error("Python script timed out after 30 seconds")
            );
          }
          if (code === 0) {
            resolve(stdoutData);
          } else {
            reject(
              new Error(
                stderrData.trim() || `Python script exited with code ${code}`
              )
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
        initialDelay = 600,
        backoff = 1.8,
        label = "python",
      } = {}
    ) => {
      let lastErr;
      let delay = initialDelay;

      for (let i = 1; i <= attempts; i++) {
        try {
          console.log(`[${label}] attempt ${i}/${attempts}`);
          const out = await runPythonOnce(exe, args, timeoutMs);
          try {
            const parsed = JSON.parse(out);
            return parsed;
          } catch (e) {
            console.error(`[${label}] JSON parse error:`, e.message);
            lastErr = new Error("Invalid output from Python script");
          }
        } catch (err) {
          console.warn(`[${label}] failed attempt ${i}: ${err.message}`);
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

    // First, get the products (RETRY)
    const products = await runPythonJSONWithRetry(
      pythonExecutable,
      [scriptPath, partNumber],
      {
        attempts: 3,
        timeoutMs: 30000,
        initialDelay: 700,
        backoff: 1.7,
        label: "products",
      }
    );

    // Filter (unchanged)
    const filterPartsFunc = (parts, partName) => {
      if (!Array.isArray(parts) || !partName || typeof partName !== "string") {
        return [];
      }

      const normalize = (str) =>
        str?.toLowerCase().trim().replace(/\s+/g, " ") || "";

      const target = normalize(partName);
      const targetTokens = target.split(" ").filter(Boolean);

      return parts
        .map((part) => {
          const partNameNormalized = normalize(part.name);
          const partTokens = partNameNormalized.split(" ").filter(Boolean);

          if (partNameNormalized === target) {
            return { ...part, __score: 100 };
          }

          if (
            partNameNormalized.includes(target) ||
            target.includes(partNameNormalized)
          ) {
            return { ...part, __score: 80 };
          }

          const commonTokens = partTokens.filter((token) =>
            targetTokens.includes(token)
          );
          const tokenOverlap =
            commonTokens.length /
            Math.max(targetTokens.length, partTokens.length);

          const firstTokenMatch = targetTokens[0] === partTokens[0] ? 0.2 : 0;

          const score = Math.min(
            79,
            Math.floor((tokenOverlap + firstTokenMatch) * 70)
          );

          return { ...part, __score: score };
        })
        .filter((item) => item.__score > 0)
        .sort((a, b) => b.__score - a.__score)
        .map(({ __score, ...part }) => part);
    };

    const filteredProducts = filterPartsFunc(products, partName);

    console.log("filtered: ", filteredProducts);
    console.log("products: ", products);
    console.log("partName: ", partName);

    // Then, get analogs for the first product if available (RETRY)
    let analogs = [];
    if (products.length > 0 && products[0].id != null) {
      analogs = await runPythonJSONWithRetry(
        pythonExecutable,
        [scriptAnalogsPath, filteredProducts[0].id],
        {
          attempts: 3,
          timeoutMs: 30000,
          initialDelay: 700,
          backoff: 1.7,
          label: "analogs",
        }
      ).catch((e) => {
        console.error("Analogs script failed after retries:", e.message);
        // Keep behavior: still return products even if analogs fail
        return [];
      });
    }

    const analogsRes = analogs.filter((product) =>
      product.stocks[0].name?.includes("Астана")
    );

    // ---------- RETURN SHAPE UNCHANGED ----------
    return res
      .status(200)
      .json({ products: [filteredProducts[0]], analogs: analogsRes });
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
