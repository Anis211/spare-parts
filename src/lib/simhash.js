function simpleHash(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function simhash(text) {
  const tokens = text.split(/\s+/).filter(Boolean).slice(0, 64);
  const bits = new Array(64).fill(0);

  for (const tok of tokens) {
    const h = BigInt(simpleHash(tok));
    for (let i = 0; i < 32; i++) {
      const bit = (h >> BigInt(i)) & 1n;
      const delta = bit === 1n ? 1 : -1;
      bits[i] += delta;
      bits[i + 32] += delta;
    }
  }

  let lo = 0 >>> 0;
  let hi = 0 >>> 0;
  for (let i = 0; i < 32; i++) {
    if (bits[i] >= 0) lo |= (1 << i) >>> 0;
    if (bits[i + 32] >= 0) hi |= (1 << i) >>> 0;
  }
  return { hi, lo };
}

export function hammingDistance(a, b) {
  const x1 = a.lo ^ b.lo;
  const x2 = a.hi ^ b.hi;

  const popcount32 = (x) => {
    x = x - ((x >>> 1) & 0x55555555);
    x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
    return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
  };

  return popcount32(x1) + popcount32(x2);
}

export class SimhashIndex {
  constructor({ maxSize = 1000, maxDistance = 3 } = {}) {
    this.maxSize = maxSize;
    this.maxDistance = maxDistance;
    this.entries = [];
  }

  add(prompt, answer) {
    const hash = simhash(prompt);
    this.entries.push({ hash, prompt, answer });
    if (this.entries.length > this.maxSize) {
      this.entries.shift();
    }
  }

  findNear(prompt) {
    const h = simhash(prompt);
    let best = null;
    let bestDist = Infinity;

    for (const e of this.entries) {
      const d = hammingDistance(h, e.hash);
      if (d < bestDist) {
        bestDist = d;
        best = e;
      }
    }

    if (best && bestDist <= this.maxDistance) {
      return { answer: best.answer, distance: bestDist };
    }
    return null;
  }
}
