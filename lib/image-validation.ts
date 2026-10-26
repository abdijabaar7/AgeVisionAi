export const MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedMime = (typeof MIME_TYPES)[number];

export function maxFileBytes(): number {
  const mb = Number(process.env.AGE_ESTIMATION_MAX_FILE_SIZE_MB ?? "5");
  // DetectFaces accepts PNG/JPEG image bytes up to 5 MB.
  return Number.isFinite(mb) && mb > 0 && mb <= 5 ? Math.floor(mb * 1024 * 1024) : 5 * 1024 * 1024;
}

export function signatureMatches(bytes: Uint8Array, type: string): boolean {
  if (type === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v);
  if (type === "image/webp") return bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return false;
}
