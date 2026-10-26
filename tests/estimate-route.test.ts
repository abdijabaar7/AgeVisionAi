import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/rate-limit", () => ({ getRateLimiter: () => ({ limit: async () => ({ success: true }) }) }));
vi.mock("@/lib/age-estimation", () => ({ estimateAge: vi.fn(async () => ({ low: 19, high: 27, midpoint: 23 })), EstimateError: class EstimateError extends Error {} }));

import { NextRequest } from "next/server";
import { POST } from "@/app/api/estimate-age/route";

describe("POST /api/estimate-age", () => {
  it("requires content-length before multipart parsing", async () => {
    const request = new NextRequest("http://localhost/api/estimate-age", { method: "POST", body: new FormData() });
    const response = await POST(request);
    expect(response.status).toBe(411);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("rejects a fake jpeg signature and returns a real provider-shaped response for jpeg", async () => {
    const fake = new FormData(); fake.append("image", new File(["not jpeg"], "fake.jpg", { type: "image/jpeg" }));
    const bad = new NextRequest("http://localhost/api/estimate-age", { method: "POST", headers: { "content-length": "128" }, body: fake });
    expect((await POST(bad)).status).toBe(415);

    const valid = new FormData(); valid.append("image", new File([Uint8Array.from([0xff,0xd8,0xff,0x01])], "face.jpg", { type: "image/jpeg" }));
    const request = new NextRequest("http://localhost/api/estimate-age", { method: "POST", headers: { "content-length": "128", "x-real-ip": "127.0.0.1" }, body: valid });
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, result: { ageRange: { low: 19, high: 27 }, approximateMidpoint: 23 } });
  });
});
