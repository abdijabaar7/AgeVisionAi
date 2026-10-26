import { NextRequest, NextResponse } from "next/server";
import { estimateAge, EstimateError } from "@/lib/age-estimation";
import { maxFileBytes, MIME_TYPES, signatureMatches } from "@/lib/image-validation";
import { getRateLimiter } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (body: object, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store, private", Pragma: "no-cache" } });

export async function POST(request: NextRequest) {
  const maxBytes = maxFileBytes();
  const rawLength = request.headers.get("content-length");
  const declaredLength = rawLength ? Number(rawLength) : Number.NaN;
  // Multipart framing adds overhead; reject clearly excessive bodies before parsing them into memory.
  if (!Number.isFinite(declaredLength) || declaredLength <= 0) return json({ success: false, error: { code: "INVALID_REQUEST" } }, 411);
  if (declaredLength > maxBytes + 64 * 1024) return json({ success: false, error: { code: "FILE_TOO_LARGE" } }, 413);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data;")) return json({ success: false, error: { code: "INVALID_REQUEST" } }, 415);

  // Limit requests before multipart parsing so invalid payloads cannot bypass the per-IP budget.
  let rateLimiter;
  try { rateLimiter = getRateLimiter(); }
  catch { return json({ success: false, error: { code: "CONFIGURATION" } }, 503); }
  const ip = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  try {
    const rate = await rateLimiter.limit(ip);
    if (!rate.success) return json({ success: false, error: { code: "RATE_LIMIT" } }, 429);
  } catch {
    // Fail closed if the distributed limiter cannot be reached.
    return json({ success: false, error: { code: "CONFIGURATION" } }, 503);
  }

  let form: FormData;
  try { form = await request.formData(); }
  catch { return json({ success: false, error: { code: "INVALID_REQUEST" } }, 400); }
  const entries = [...form.entries()];
  if (entries.length !== 1 || entries[0]?.[0] !== "image" || !(entries[0][1] instanceof File)) return json({ success: false, error: { code: "INVALID_REQUEST" } }, 400);
  const file = entries[0][1];
  if (file.size === 0) return json({ success: false, error: { code: "INVALID_IMAGE" } }, 400);
  if (file.size > maxBytes) return json({ success: false, error: { code: "FILE_TOO_LARGE" } }, 413);
  if (!(MIME_TYPES as readonly string[]).includes(file.type)) return json({ success: false, error: { code: "INVALID_IMAGE" } }, 415);

  let bytes: Uint8Array | undefined;
  try {
    bytes = new Uint8Array(await file.arrayBuffer());
    if (!signatureMatches(bytes, file.type)) return json({ success: false, error: { code: "INVALID_IMAGE" } }, 415);
    const result = await estimateAge(bytes);
    return json({ success: true, result: { ageRange: { low: result.low, high: result.high }, approximateMidpoint: result.midpoint } }, 200);
  } catch (error) {
    if (error instanceof EstimateError) {
      const map = { NO_FACE: [422, "NO_FACE"], MULTIPLE_FACES: [422, "MULTIPLE_FACES"], INVALID_IMAGE: [422, "INVALID_IMAGE"], CONFIGURATION: [503, "CONFIGURATION"], PROVIDER: [502, "PROVIDER_UNAVAILABLE"], TIMEOUT: [504, "REQUEST_TIMEOUT"] } as const;
      const [status, code] = map[error.code];
      return json({ success: false, error: { code } }, status);
    }
    return json({ success: false, error: { code: "UNKNOWN" } }, 500);
  } finally {
    bytes?.fill(0);
  }
}
