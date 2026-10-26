import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type LimitResult = { success: boolean };
type Limiter = { limit: (identifier: string) => Promise<LimitResult> };

let limiter: Ratelimit | undefined;
let developmentLimiter: Limiter | undefined;
const developmentWindows = new Map<string, { count: number; resetAt: number }>();

function getDevelopmentLimiter(): Limiter {
  developmentLimiter ??= {
    async limit(identifier) {
      const now = Date.now();
      for (const [key, value] of developmentWindows) if (value.resetAt <= now) developmentWindows.delete(key);
      if (developmentWindows.size > 5_000) developmentWindows.clear();
      const limit = Math.max(1, Math.floor(Number(process.env.RATE_LIMIT_REQUESTS) || 10));
      const current = developmentWindows.get(identifier);
      if (!current || current.resetAt <= now) {
        developmentWindows.set(identifier, { count: 1, resetAt: now + 60_000 });
        return { success: true };
      }
      if (current.count >= limit) return { success: false };
      current.count += 1;
      return { success: true };
    },
  };
  return developmentLimiter;
}

export function getRateLimiter(): Limiter {
  const { UPSTASH_REDIS_REST_URL: url, UPSTASH_REDIS_REST_TOKEN: token } = process.env;
  if (!url || !token) {
    if (process.env.NODE_ENV !== "production") return getDevelopmentLimiter();
    throw new Error("RATE_LIMIT_CONFIGURATION");
  }
  limiter ??= new Ratelimit({ redis: new Redis({ url, token }), limiter: Ratelimit.slidingWindow(Number(process.env.RATE_LIMIT_REQUESTS) || 10, "1 m"), prefix: "agevision:estimate" });
  return limiter;
}
