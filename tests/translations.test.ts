import { describe, expect, it } from "vitest";
import { translate } from "@/lib/translations";

describe("localized messages", () => {
  it("provides Somali and English upload limit text", () => {
    expect(translate("so", "formats", { size: 5 })).toContain("5 MB");
    expect(translate("en", "formats", { size: 5 })).toContain("JPG, PNG or WebP");
  });
  it("translates provider errors", () => {
    expect(translate("so", "errMultipleFaces")).toContain("wajiyo badan");
    expect(translate("en", "errNoFace")).toContain("No face");
  });
});
