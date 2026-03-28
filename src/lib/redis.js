import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const REDIS_PREFIX = process.env.REDIS_PREFIX || "carmax:webhook";

// Create a single Redis instance (singleton pattern)
const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on("error", (err) => {
  console.error("❌ Redis connection error:", err);
});

redis.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

// Helper to generate prefixed keys
export function redisKey(suffix) {
  return `${REDIS_PREFIX}:${suffix}`;
}

// Check if message was already processed
export async function isMessageProcessed(chatId, messageId) {
  const key = redisKey(`processed:${chatId}:${messageId}`);
  const exists = await redis.exists(key);
  return exists === 1;
}

// Mark message as processed (with TTL)
export async function markMessageProcessed(
  chatId,
  messageId,
  ttlSeconds = parseInt(process.env.REDIS_TTL_SECONDS || "86400"),
) {
  const key = redisKey(`processed:${chatId}:${messageId}`);
  await redis.setex(key, ttlSeconds, "1");
}

// Optional: Clean up old keys manually (Redis TTL handles this automatically)
export async function cleanupProcessedMessages(chatId) {
  const pattern = redisKey(`processed:${chatId}:*`);
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

export default redis;
