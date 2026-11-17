// Distributed rate limiter using Upstash Redis (sliding window). Falls back
// to an in-memory bucket when UPSTASH_REDIS_REST_URL is not set (local dev).
// shortcut: in-memory fallback doesn't share state across processes; fine for
// dev, but deploy MUST have Upstash provisioned via Vercel Marketplace.

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Lazy singletons — constructed on first call, not at module load time (safe
// for Next.js build which evaluates top-level module code).
let _ratelimit: Ratelimit | null = null;
let _memBuckets: Map<string, { count: number; resetAt: number }> | null = null;

function getDistributed(): Ratelimit {
  if (!_ratelimit) {
    _ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      // sliding window: each key gets `max` hits per `windowMs`ms
      limiter: Ratelimit.slidingWindow(1, "1 s"), // overridden per call via dynamic keys
      analytics: false,
      prefix: "sp_rl",
    });
  }
  return _ratelimit;
}

function memBucket(key: string, max: number, windowMs: number): boolean {
  if (!_memBuckets) _memBuckets = new Map();
  const now = Date.now();
  const b = _memBuckets.get(key);
  if (!b || b.resetAt < now) {
    _memBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= max) return false;
  b.count += 1;
  return true;
}

// Pre-configured limiters for each use case. Keys are namespaced so the same
// Upstash database can be shared by all rate-limit points.
function makeLimiter(max: number, windowSeconds: number) {
  if (!process.env.UPSTASH_REDIS_REST_URL) return null;
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(max, `${windowSeconds} s`),
    analytics: false,
    prefix: "sp_rl",
  });
}

// Lazily created per-bucket limiters (avoid building at module load).
const limiters = new Map<string, Ratelimit | null>();

function getLimiter(cacheKey: string, max: number, windowSeconds: number): Ratelimit | null {
  if (!limiters.has(cacheKey)) {
    limiters.set(cacheKey, makeLimiter(max, windowSeconds));
  }
  return limiters.get(cacheKey)!;
}

/**
 * Returns true if the request is allowed, false if rate-limited.
 * max: max requests per window
 * windowMs: window in milliseconds (converted to seconds for Upstash)
 */
export async function rateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
  const windowSeconds = Math.ceil(windowMs / 1000);
  const cacheKey = `${max}:${windowSeconds}`;
  const limiter = getLimiter(cacheKey, max, windowSeconds);

  if (!limiter) {
    // No Redis: fall back to in-memory (dev only)
    return memBucket(key, max, windowMs);
  }

  const { success } = await limiter.limit(key);
  return success;
}
