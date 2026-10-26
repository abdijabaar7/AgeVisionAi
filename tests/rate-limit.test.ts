import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

import { getRateLimiter } from "@/lib/rate-limit";

describe("rate-limit configuration", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("allows a bounded local development fallback", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    vi.stubEnv("RATE_LIMIT_REQUESTS", "2");
    const limiter = getRateLimiter();
    expect(await limiter.limit("local-dev-a")).toEqual({ success: true });
    expect(await limiter.limit("local-dev-a")).toEqual({ success: true });
    expect(await limiter.limit("local-dev-a")).toEqual({ success: false });
    expect(await limiter.limit("local-dev-b")).toEqual({ success: true });
  });

  it("allows fallback even when Upstash is missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    expect(() => getRateLimiter()).not.toThrow();
  });
});
