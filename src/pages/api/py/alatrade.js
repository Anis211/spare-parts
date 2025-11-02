// pages/api/py/alatrade.js
import { spawn } from "child_process";
import path from "path";

const MAX_ATTEMPTS = 3; // how many times to try if output is empty
const RETRY_DELAY_MS = 500; // wait between attempts

export default async function handler(req, res) {
  const { partNumber, partName, ci_session, rem_id } =
    req.method === "POST" ? req.body : req.query;

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("Started alatrade proxy for partNumber:", partNumber);
  console.log("Received partNumber:", partNumber);
  console.log("Received partName:", partName);
  console.log("Received ci_session:", ci_session);
  console.log("Received rem_id:", rem_id);

  try {
    const pythonExecutable = path.join(
      process.cwd(),
      "python",
      "Scripts",
      "python.exe"
    );
    const scriptPath = path.join(
      process.cwd(),
      "python",
      "alatrade_analogs.py"
    );

    const runPythonOnce = () =>
      new Promise((resolve, reject) => {
        const pr = spawn(pythonExecutable, [
          scriptPath,
          partNumber || "",
          ci_session || "",
          rem_id || "",
        ]);

        let stdoutData = "";
        let stderrData = "";

        pr.stdout.on("data", (data) => {
          stdoutData += data.toString("utf8");
          console.log("Python stdout data chunk:", data.toString("utf8"));
        });

        pr.stderr.on("data", (data) => {
          const str = data.toString();
          stderrData += str;
          console.error("[Python stderr]:", str);
        });

        pr.on("close", (code) => {
          const out = (stdoutData || "").trim();
          if (code === 0) {
            // If Python printed nothing, resolve with empty array (so caller can decide to retry)
            if (!out) return resolve([]);
            try {
              const parsed = JSON.parse(out);
              // Ensure array; if not, still return what we got
              return resolve(Array.isArray(parsed) ? parsed : parsed ?? []);
            } catch (e) {
              console.error("Failed to parse Python output:", e);
              console.error("The Failed Output:", out);
              // treat as empty so the retry loop can try again
              return resolve([]);
            }
          } else {
            return reject({
              error:
                stderrData.trim() || `Python script exited with code ${code}`,
            });
          }
        });

        pr.on("error", (err) => {
          console.error("Failed to start Python process:", err.message);
          reject({ error: `Failed to start Python: ${err.message}` });
        });

        // Timeout guard per attempt
        const t = setTimeout(() => {
          try {
            pr.kill("SIGTERM");
          } catch {}
          resolve([]); // treat as empty so we can retry
        }, 30000);

        pr.on("close", () => clearTimeout(t));
      });

    // Retry loop
    let products = [];
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      products = await runPythonOnce();
      console.log(
        `Attempt ${attempt}/${MAX_ATTEMPTS} — Python returned ${
          Array.isArray(products) ? products.length : 0
        } items`
      );
      if (Array.isArray(products) && products.length > 0) break;
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }

    // Filter by name/city (kept your logic)
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
          // your Python returns upper-case "NAME"; keep fallback to part.name
          const partNameNormalized = normalize(part.NAME || part.name || "");
          const partTokens = partNameNormalized.split(" ").filter(Boolean);

          if (partNameNormalized === target) return { ...part, __score: 100 };
          if (
            partNameNormalized.includes(target) ||
            target.includes(partNameNormalized)
          )
            return { ...part, __score: 80 };

          const commonTokens = partTokens.filter((token) =>
            targetTokens.includes(token)
          );
          const tokenOverlap =
            commonTokens.length /
            Math.max(targetTokens.length, partTokens.length || 1);
          const firstTokenMatch =
            targetTokens[0] &&
            partTokens[0] &&
            targetTokens[0] === partTokens[0]
              ? 0.2
              : 0;
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

    const filteredProducts = filterPartsFunc(products, partName).filter(
      (product) => (product.SNAME || "").trim() === "Астана"
    );

    console.log("filtered: ", filteredProducts?.length ?? 0);
    return res.status(200).json({
      analogs: filteredProducts,
      attempts: MAX_ATTEMPTS,
      returned: products?.length ?? 0,
    });
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
