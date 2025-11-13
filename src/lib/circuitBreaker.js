class CircuitBreaker {
  constructor({
    failureThreshold = 0.5, // 50% failures
    minSamples = 20, // at least 20 calls observed
    cooldownMs = 30_000, // stay OPEN at least 30s
    windowMs = 60_000, // stats window = 60s
    halfOpenMaxProbes = 2, // how many test calls in HALF_OPEN
    halfOpenSuccessesToClose = 2,
  } = {}) {
    this.failureThreshold = failureThreshold;
    this.minSamples = minSamples;
    this.cooldownMs = cooldownMs;
    this.windowMs = windowMs;
    this.halfOpenMaxProbes = halfOpenMaxProbes;
    this.halfOpenSuccessesToClose = halfOpenSuccessesToClose;

    this.state = "CLOSED"; // "CLOSED" | "OPEN" | "HALF_OPEN"
    this.openedAt = 0;

    this.buckets = []; // { t: timestamp, success: number, fail: number }
    this.halfOpenProbes = 0;
    this.halfOpenSuccesses = 0;
  }

  _now() {
    return Date.now();
  }

  _pruneBuckets(now) {
    const cutoff = now - this.windowMs;
    this.buckets = this.buckets.filter((b) => b.t >= cutoff);
  }

  _getBucket(now) {
    const bucketSize = 5000; // 5s buckets
    const t = Math.floor(now / bucketSize) * bucketSize;
    let bucket = this.buckets.find((b) => b.t === t);
    if (!bucket) {
      bucket = { t, success: 0, fail: 0 };
      this.buckets.push(bucket);
    }
    return bucket;
  }

  _record(success) {
    const now = this._now();
    this._pruneBuckets(now);
    const bucket = this._getBucket(now);
    if (success) bucket.success += 1;
    else bucket.fail += 1;
  }

  _stats() {
    const now = this._now();
    this._pruneBuckets(now);
    let success = 0;
    let fail = 0;
    for (const b of this.buckets) {
      success += b.success;
      fail += b.fail;
    }
    const total = success + fail;
    const failureRate = total > 0 ? fail / total : 0;
    return { success, fail, total, failureRate };
  }

  _shouldOpen() {
    const { total, failureRate } = this._stats();
    return total >= this.minSamples && failureRate >= this.failureThreshold;
  }

  async exec(fn) {
    const now = this._now();

    if (this.state === "OPEN") {
      if (now - this.openedAt < this.cooldownMs) {
        const err = new Error("CircuitOpen");
        err.circuitState = "OPEN";
        throw err;
      } else {
        // move to HALF_OPEN
        this.state = "HALF_OPEN";
        this.halfOpenProbes = 0;
        this.halfOpenSuccesses = 0;
      }
    }

    if (this.state === "HALF_OPEN") {
      if (this.halfOpenProbes >= this.halfOpenMaxProbes) {
        const err = new Error("CircuitHalfOpenBusy");
        err.circuitState = "HALF_OPEN";
        throw err;
      }
    }

    try {
      if (this.state === "HALF_OPEN") this.halfOpenProbes += 1;

      const result = await fn();
      this._record(true);

      if (this.state === "HALF_OPEN") {
        this.halfOpenSuccesses += 1;
        if (this.halfOpenSuccesses >= this.halfOpenSuccessesToClose) {
          // Recover to CLOSED
          this.state = "CLOSED";
          this.buckets = [];
        }
      } else if (this.state === "CLOSED" && this._shouldOpen()) {
        this.state = "OPEN";
        this.openedAt = this._now();
      }

      return result;
    } catch (err) {
      this._record(false);

      if (this.state === "CLOSED" && this._shouldOpen()) {
        this.state = "OPEN";
        this.openedAt = this._now();
      } else if (this.state === "HALF_OPEN") {
        // One failure in HALF_OPEN is enough to go back to OPEN
        this.state = "OPEN";
        this.openedAt = this._now();
      }

      throw err;
    }
  }
}

export default CircuitBreaker;
