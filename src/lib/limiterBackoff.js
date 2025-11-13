// --- Token Bucket (requests/sec with burst capacity) ---
export class TokenBucket {
  constructor({ ratePerSec, capacity }) {
    this.ratePerSec = Math.max(ratePerSec, 0.0001);
    this.capacity = Math.max(capacity, 1);
    this.tokens = capacity; // start full
    this.lastRefill = Date.now(); // ms
  }
  _refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.lastRefill = now;
    this.tokens = Math.min(
      this.capacity,
      this.tokens + elapsed * this.ratePerSec
    );
  }
  // returns ms to wait before we can spend `cost` tokens
  waitTimeMs(cost = 1) {
    this._refill();
    if (this.tokens >= cost) return 0;
    const need = cost - this.tokens;
    return Math.ceil((need / this.ratePerSec) * 1000);
  }
  spend(cost = 1) {
    this.tokens = Math.max(0, this.tokens - cost);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- Parse Retry-After (seconds or HTTP-date). Returns ms or null. ---
function parseRetryAfter(retryAfter) {
  if (!retryAfter) return null;
  const asInt = parseInt(retryAfter, 10);
  if (!isNaN(asInt)) return Math.max(asInt, 0) * 1000;
  const t = Date.parse(retryAfter);
  if (!isNaN(t)) return Math.max(t - Date.now(), 0);
  return null;
}

// --- Exponential backoff with jitter ---
export async function withBackoff(
  fn,
  {
    maxRetries = 5,
    baseMs = 200,
    factor = 2,
    jitter = [0.8, 1.2],
    onShouldRetry = (err) => {
      const s = err?.status ?? err?.response?.status;
      return s === 429 || (s >= 500 && s <= 599);
    },
    onRetryAfter = (err) => {
      const h = err?.response?.headers;
      const ra = h?.get?.("retry-after") ?? h?.["retry-after"];
      return parseRetryAfter(ra);
    },
  } = {}
) {
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= maxRetries || !onShouldRetry(err)) throw err;

      const raMs = onRetryAfter(err);
      let delay =
        raMs != null
          ? raMs
          : Math.pow(factor, attempt) *
            baseMs *
            (jitter[0] + Math.random() * (jitter[1] - jitter[0]));

      await sleep(delay);
      attempt += 1;
    }
  }
}

// --- Combined wrapper: rate-limit + backoff ---
export function createLimitedCaller({ ratePerSec, burstCapacity }) {
  const bucket = new TokenBucket({ ratePerSec, capacity: burstCapacity });
  return async function limitedCall(fn, { cost = 1, backoffOpts } = {}) {
    const waitMs = bucket.waitTimeMs(cost);
    if (waitMs > 0) await sleep(waitMs);
    bucket.spend(cost);
    return withBackoff(fn, backoffOpts);
  };
}
