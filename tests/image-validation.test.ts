import { describe, expect, it } from "vitest";
import { signatureMatches } from "@/lib/image-validation";

describe("image signature checks", () => {
  it("accepts matching JPEG, PNG, and WebP headers", () => {
    expect(signatureMatches(Uint8Array.from([0xff, 0xd8, 0xff, 0]), "image/jpeg")).toBe(true);
    expect(signatureMatches(Uint8Array.from([137,80,78,71,13,10,26,10]), "image/png")).toBe(true);
    expect(signatureMatches(Uint8Array.from([82,73,70,70,0,0,0,0,87,69,66,80]), "image/webp")).toBe(true);
  });
  it("rejects mismatched, unsupported, and short signatures", () => {
    expect(signatureMatches(Uint8Array.from([0,0,0,0]), "image/jpeg")).toBe(false);
    expect(signatureMatches(Uint8Array.from([0xff,0xd8,0xff]), "image/png")).toBe(false);
    expect(signatureMatches(new Uint8Array(), "image/gif")).toBe(false);
  });
});
