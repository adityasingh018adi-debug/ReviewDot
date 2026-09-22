/**
 * Simple in-memory rate limiter.
 * Works per-instance (sufficient for Vercel edge/serverless where each function
 * handles a limited burst). For multi-region production consider Redis/Upstash.
 *
 * Usage:
 *   const { ok, remaining } = rateLimit(ip, 20, 60_000);  // 20 req / 60 s
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; remaining: number } {
  const now = Date.now();
  let bucket = store.get(key);

  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    store.set(key, bucket);
  }

  bucket.count += 1;

  // Prune old entries every 5000 entries to prevent memory leak
  if (store.size > 5000) {
    store.forEach((v, k) => {
      if (now > v.resetAt) store.delete(k);
    });
  }

  const remaining = Math.max(0, limit - bucket.count);
  return { ok: bucket.count <= limit, remaining };
}
