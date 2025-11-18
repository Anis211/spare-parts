function hash1(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function hash2(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 131 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

export class BloomFilter {
  constructor({ m = 8192, k = 3 } = {}) {
    this.m = m;
    this.k = k;
    this.bits = new Uint8Array(m);
  }

  _positions(str) {
    const h1v = hash1(str);
    const h2v = hash2(str);
    const pos = [];
    for (let i = 0; i < this.k; i++) {
      const h = (h1v + i * h2v) >>> 0;
      pos.push(h % this.m);
    }
    return pos;
  }

  add(str) {
    for (const p of this._positions(str)) {
      this.bits[p] = 1;
    }
  }

  mightContain(str) {
    for (const p of this._positions(str)) {
      if (this.bits[p] === 0) return false;
    }
    return true;
  }
}
