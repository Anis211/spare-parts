function uuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class MicroBatcher {
  constructor(opts) {
    this.q = [];
    this.timer = null;
    this.opts = {
      maxBatchSize: 16,
      maxWaitMs: 50,
      baseDelayMs: 150,
      maxRetries: 4,
      ...opts,
    };
  }

  enqueue(payload) {
    return new Promise((resolve, reject) => {
      const id = uuid();
      this.q.push({ id, payload, resolve, reject });
      if (this.q.length >= this.opts.maxBatchSize) this._flushSoon(0);
      else this._flushSoon(this.opts.maxWaitMs);
    });
  }

  _flushSoon(ms) {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      this._flush();
    }, ms);
  }

  async _flush() {
    if (this.q.length === 0) return;

    const batch = this.q.splice(0, this.opts.maxBatchSize);
    const items = batch.map(({ id, payload }) => ({ id, ...payload }));

    for (let attempt = 0; attempt <= this.opts.maxRetries; attempt++) {
      try {
        const results = await this.opts.transport(items);
        const byId = new Map(results.map((r) => [r.id, r]));
        for (const item of batch) {
          const r = byId.get(item.id);
          if (!r) item.reject(new Error("Missing result for " + item.id));
          else item.resolve(r.output !== undefined ? r.output : r);
        }
        return;
      } catch (err) {
        if (attempt === this.opts.maxRetries) {
          batch.forEach((it) => it.reject(err));
          return;
        }
        const jitter = 0.8 + Math.random() * 0.4;
        const delay = Math.pow(2, attempt) * this.opts.baseDelayMs * jitter;
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }
}

export function openaiMessagesTransportFactory({ openai }) {
  if (!openai) throw new Error("openai client is required");

  return async (items) => {
    const outputs = [];
    for (const it of items) {
      const { messages, options = {} } = it;
      const resp = await openai.chat.completions.create({
        ...options,
        messages,
      });
      outputs.push({ id: it.id, output: resp });
    }
    return outputs;
  };
}
