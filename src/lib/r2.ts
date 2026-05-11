import type { R2Bucket } from "@cloudflare/workers-types";

export function buildR2Key(
  orgId: string,
  type: "image" | "logo" | "art-ref" | "structure",
  filename: string
): string {
  return `${orgId}/${type}/${filename}`;
}

export async function uploadToR2(
  r2: R2Bucket,
  key: string,
  data: ArrayBuffer,
  contentType: string = "image/png"
): Promise<string> {
  await r2.put(key, data, { httpMetadata: { contentType } });
  return key;
}

export async function getFromR2(
  r2: R2Bucket,
  key: string
): Promise<ArrayBuffer | null> {
  const obj = await r2.get(key);
  if (!obj) return null;
  return obj.arrayBuffer();
}
