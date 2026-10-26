import "server-only";
import { DetectFacesCommand, RekognitionClient } from "@aws-sdk/client-rekognition";

export class EstimateError extends Error {
  constructor(public code: "NO_FACE" | "MULTIPLE_FACES" | "INVALID_IMAGE" | "CONFIGURATION" | "PROVIDER" | "TIMEOUT") { super(code); }
}

export type AgeRange = { low: number; high: number; midpoint: number };

export function validateAgeRange(low: unknown, high: unknown): AgeRange {
  if (!Number.isInteger(low) || !Number.isInteger(high) || (low as number) < 0 || (high as number) < (low as number) || (high as number) > 120) {
    throw new EstimateError("PROVIDER");
  }
  return { low: low as number, high: high as number, midpoint: Math.round(((low as number) + (high as number)) / 2) };
}

export async function estimateAge(bytes: Uint8Array): Promise<AgeRange> {
  if (!process.env.AWS_REGION) throw new EstimateError("CONFIGURATION");
  const client = new RekognitionClient({ region: process.env.AWS_REGION, requestHandler: undefined });
  try {
    const response = await client.send(new DetectFacesCommand({ Image: { Bytes: bytes }, Attributes: ["AGE_RANGE"] }), { abortSignal: AbortSignal.timeout(15_000) });
    const faces = response.FaceDetails ?? [];
    if (faces.length === 0) throw new EstimateError("NO_FACE");
    if (faces.length !== 1) throw new EstimateError("MULTIPLE_FACES");
    const range = faces[0]?.AgeRange;
    if (!range) throw new EstimateError("PROVIDER");
    return validateAgeRange(range.Low, range.High);
  } catch (error) {
    if (error instanceof EstimateError) throw error;
    const name = error instanceof Error ? error.name : "unknown";
    // Safe diagnostic metadata only; never log image bytes, credentials, or provider messages.
    console.error("Age estimation provider failure:", error);
    const code = name === "TimeoutError" || name === "AbortError"
      ? "TIMEOUT"
      : name === "CredentialsProviderError" || name === "ConfigError"
        ? "CONFIGURATION"
        : "PROVIDER";
    throw new EstimateError(code);
  } finally {
    client.destroy();
  }
}
