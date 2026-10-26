import { beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.fn();
vi.mock("server-only", () => ({}));
vi.mock("@aws-sdk/client-rekognition", () => ({
  RekognitionClient: class { send = send; destroy = vi.fn(); },
  DetectFacesCommand: class { constructor(public input: unknown) {} },
}));

import { estimateAge, EstimateError, validateAgeRange } from "@/lib/age-estimation";

describe("age estimate validation", () => {
  beforeEach(() => { send.mockReset(); process.env.AWS_REGION = "us-east-1"; });

  it("calculates a rounded midpoint from an ordered integer range", () => {
    expect(validateAgeRange(20, 27)).toEqual({ low: 20, high: 27, midpoint: 24 });
  });
  it("rejects invalid ranges", () => {
    expect(() => validateAgeRange(-1, 20)).toThrow(EstimateError);
    expect(() => validateAgeRange(30, 20)).toThrow(EstimateError);
    expect(() => validateAgeRange(20.5, 30)).toThrow(EstimateError);
  });
  it("requires an AWS region before requesting an estimate", async () => {
    delete process.env.AWS_REGION;
    await expect(estimateAge(new Uint8Array([1]))).rejects.toMatchObject({ code: "CONFIGURATION" });
  });
  it("returns the one face age range and asks AWS for AGE_RANGE only", async () => {
    send.mockResolvedValue({ FaceDetails: [{ AgeRange: { Low: 21, High: 29 } }] });
    await expect(estimateAge(new Uint8Array([1]))).resolves.toEqual({ low: 21, high: 29, midpoint: 25 });
    expect(send.mock.calls[0]?.[0].input.Attributes).toEqual(["AGE_RANGE"]);
  });
  it("rejects zero or multiple faces instead of inventing a result", async () => {
    send.mockResolvedValueOnce({ FaceDetails: [] }).mockResolvedValueOnce({ FaceDetails: [{}, {}] });
    await expect(estimateAge(new Uint8Array([1]))).rejects.toMatchObject({ code: "NO_FACE" });
    await expect(estimateAge(new Uint8Array([1]))).rejects.toMatchObject({ code: "MULTIPLE_FACES" });
  });
  it("maps provider timeouts separately", async () => {
    const timeout = new Error("timeout"); timeout.name = "TimeoutError";
    send.mockRejectedValue(timeout);
    await expect(estimateAge(new Uint8Array([1]))).rejects.toMatchObject({ code: "TIMEOUT" });
  });
});
