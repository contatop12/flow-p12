import type { KVNamespace } from "@cloudflare/workers-types";

export async function getFromKV<T>(
  kv: KVNamespace,
  key: string
): Promise<T | null> {
  const raw = await kv.get(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as unknown as T;
  }
}

export async function setInKV(
  kv: KVNamespace,
  key: string,
  value: unknown,
  ttlSeconds?: number
): Promise<void> {
  const serialized =
    typeof value === "string" ? value : JSON.stringify(value);
  await kv.put(
    key,
    serialized,
    ttlSeconds ? { expirationTtl: ttlSeconds } : undefined
  );
}

export async function getOrSet<T>(
  kv: KVNamespace,
  key: string,
  factory: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  const cached = await getFromKV<T>(kv, key);
  if (cached !== null) return cached;
  const value = await factory();
  await setInKV(kv, key, value, ttlSeconds);
  return value;
}

export function buildStructureCacheKey(
  imageHash: string,
  controlType: string
): string {
  return `structure:${controlType}:${imageHash}`;
}
