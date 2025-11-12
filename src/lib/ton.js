const isPrim = (v) =>
  v === null || ["string", "number", "boolean"].includes(typeof v);
const keyOf = (v) => JSON.stringify(v);
function sha1(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16).padStart(8, "0");
}
function buildDict(obj) {
  const d = [],
    idx = new Map();
  const add = (v) => {
    const k = keyOf(v);
    if (!idx.has(k)) {
      idx.set(k, d.length);
      d.push(v);
    }
  };
  const walk = (v) => {
    if (isPrim(v)) {
      add(v);
      return;
    }
    if (Array.isArray(v)) {
      for (const x of v) walk(x);
      return;
    }
    if (v && typeof v === "object") {
      for (const k of Object.keys(v)) walk(v[k]);
    }
  };
  walk(obj);
  return { d, idx };
}
function encBody(v, idx) {
  if (isPrim(v)) return { $: idx.get(keyOf(v)) };
  if (Array.isArray(v)) return v.map((x) => encBody(x, idx));
  if (v && typeof v === "object") {
    const o = {};
    for (const k of Object.keys(v)) o[k] = encBody(v[k], idx);
    return o;
  }
  return v;
}
export function tonEncode(input) {
  const { d, idx } = buildDict(input);
  const b = encBody(input, idx);
  const dictHash = sha1(JSON.stringify(d));
  return { h: { v: 1, dictHash }, d, b };
}
