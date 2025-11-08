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
    function filterPartsFunc(parts, partName) {
      if (!Array.isArray(parts) || !partName || typeof partName !== "string") {
        return [];
      }

      const normalize = (s) =>
        (s || "")
          .toLowerCase()
          .replace(/ё/g, "е")
          .replace(/[^a-z0-9\u0430-\u044f\s-]/g, " ")
          .replace(/\s+/g, " ")
          .trim();

      const canonicalize = (s) => {
        let t = " " + s + " ";
        if (
          /\bрадиатор\b/.test(t) &&
          (/\bосновн/.test(t) ||
            /\bохлажд/.test(t) ||
            /\bсистем[аы]\s+охлажден/.test(t))
        ) {
          t = t.replace(
            /\bрадиатор\b[^\S\r\n]*(?:двигателя|охлаждения|охлаждающей|основной)?/g,
            " радиатор системы охлаждения "
          );
        }
        return normalize(t);
      };

      const ngrams = (s, n = 3) => {
        s = " " + canonicalize(s) + " ";
        if (s.length < n) return new Set([s]);
        const set = new Set();
        for (let i = 0; i <= s.length - n; i++) set.add(s.slice(i, i + n));
        return set;
      };

      const jaccard = (aSet, bSet) => {
        if (!aSet.size && !bSet.size) return 0;
        let inter = 0;
        for (const x of aSet) if (bSet.has(x)) inter++;
        return inter / (aSet.size + bSet.size - inter || 1);
      };

      const levenshtein = (a, b, cap = 100) => {
        a = canonicalize(a);
        b = canonicalize(b);
        if (a === b) return 0;
        const m = a.length,
          n = b.length;
        if (Math.max(m, n) === 0) return 0;
        if (Math.abs(m - n) > cap) return cap;

        const dp = Array(n + 1)
          .fill(0)
          .map((_, j) => j);
        for (let i = 1; i <= m; i++) {
          let prev = dp[0];
          dp[0] = i;
          for (let j = 1; j <= n; j++) {
            const temp = dp[j];
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
            prev = temp;
          }
        }
        return Math.min(dp[n], cap);
      };

      const TARGET = canonicalize(partName);
      const targetTokens = TARGET.split(" ").filter(Boolean);
      const targetNgrams = ngrams(TARGET, 3);

      const STOP = new Set([
        "для",
        "в",
        "и",
        "на",
        "с",
        "стд",
        "комплект",
        "оригинал",
        "качество",
        "левый",
        "правый",
        "передний",
        "задний",
      ]);

      const simplifyTokens = (arr) => arr.filter((t) => !STOP.has(t));

      const scorePair = (candidateName) => {
        const C = canonicalize(candidateName);
        if (!C) return 0;
        if (C === TARGET) return 100;
        if (C.includes(TARGET) || TARGET.includes(C)) return 92;

        const ngSim = jaccard(targetNgrams, ngrams(C, 3));
        const candTokens = simplifyTokens(C.split(" ").filter(Boolean));
        const tt = new Set(simplifyTokens(targetTokens));
        let common = 0;
        for (const t of candTokens) if (tt.has(t)) common++;
        const tokenOverlap =
          common / Math.max(1, Math.max(tt.size, candTokens.length));
        const firstBoost =
          targetTokens[0] && candTokens[0] && targetTokens[0] === candTokens[0]
            ? 0.08
            : 0;
        const lv = levenshtein(TARGET, C, 60);
        const lvSim = Math.max(0, 1 - lv / Math.max(6, TARGET.length));

        let score =
          70 * ngSim + 18 * tokenOverlap + 7 * lvSim + 100 * firstBoost;
        score = Math.max(0, Math.min(99, Math.round(score)));
        return score;
      };

      return parts
        .map((part) => {
          const name = part.NAME || part.name || "";
          const s = scorePair(name);
          const article = normalize(part.article || part.ARTICLE || "");
          let bonus = 0;
          if (!name && article) {
            const comp = article.replace(/[^a-z0-9]/g, "");
            const inTarget = normalize(partName).replace(/[^a-z0-9]/g, "");
            const shared =
              comp && inTarget
                ? inTarget.includes(comp) || comp.includes(inTarget)
                : false;
            if (shared) bonus = 10;
          }
          return { ...part, __score: s + bonus };
        })
        .filter((x) => x.__score > 0)
        .sort((a, b) => b.__score - a.__score)
        .map(({ __score, ...rest }) => rest);
    }

    const filteredProducts = filterPartsFunc(products, partName);

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
