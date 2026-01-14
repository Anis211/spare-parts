// ---------- helpers ----------
const normalize = (s) =>
  (s ?? "")
    .toString()
    .toLowerCase()
    .replace(/[\\\/|_+.,!<>()[\]{}:;"'`~^%$#@*&?-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const levenshtein = (a, b) => {
  const m = a.length,
    n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
};

const levRatio = (a, b) => {
  const A = normalize(a),
    B = normalize(b);
  if (!A || !B) return 0;
  if (A === B) return 1;
  const dist = levenshtein(A, B);
  return 1 - dist / Math.max(A.length, B.length);
};

const tokenSetRatio = (a, b) => {
  const A = new Set(normalize(a).split(" ").filter(Boolean));
  const B = new Set(normalize(b).split(" ").filter(Boolean));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return (2 * inter) / (A.size + B.size);
};

const nameSimilarity = (a, b) => Math.max(levRatio(a, b), tokenSetRatio(a, b));
const brandEqual = (a, b) => normalize(a) === normalize(b);

// ---------- pick ONE best analog ----------
const getBestAnalog = (
  analogs,
  partData,
  { strict = 0.95, fallback = 0.9 } = {}
) => {
  let best = { product: null, score: 0 };

  for (const product of analogs) {
    if (!brandEqual(product?.brand, partData?.brand)) continue;

    const score = nameSimilarity(product?.name, partData?.partName);

    if (score > best.score) {
      best = { product, score };
    }
  }

  if (best.product && best.score >= strict) return best.product;
  if (best.product && best.score >= fallback) return best.product;
  return null;
};

const findEnrichedParts = (partNumbers, chatDoc) => {
  const enrichedParts = partNumbers.map((requestedPart) => {
    const bestMatch = getBestAnalog(
      chatDoc.chatData.flatMap((item) => item.analogs),
      {
        brand: requestedPart.brand,
        partName: requestedPart.partName,
      },
      {
        strict: 0.95,
        fallback: 0.9,
      }
    );

    if (!bestMatch) {
      console.warn("Ordered part not found in chatData:", requestedPart);
      return {
        ...requestedPart,
        article: null,
        guid: null,
        stocks: [],
      };
    }

    let selectedStock = null;
    if (bestMatch.stocks && bestMatch.stocks.length > 0) {
      const flatStocks = bestMatch.stocks.flat();
      selectedStock =
        flatStocks.find(
          (stock) => stock.partPrice === requestedPart.partPrice
        ) ||
        flatStocks[0] ||
        null;
    }

    return {
      brand: bestMatch.brand,
      partName: bestMatch.name,
      orderQuantity: requestedPart.orderQuantity,
      partPrice: requestedPart.partPrice,
      article: bestMatch.article,
      guid: bestMatch.guid,
      pictures: bestMatch.pictures,
      stockInfo: selectedStock,
      sources: bestMatch.sources,
    };
  });

  return enrichedParts;
};

export { findEnrichedParts };
