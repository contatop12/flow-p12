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
    console.warn(`[kv] Failed to parse value for key "${key}" — returning null`);
    return null;
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
  const raw = await kv.get(key);
  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw) as { v: T };
      return parsed.v;
    } catch {
      // malformed cache entry — recompute
    }
  }
  const value = await factory();
  await kv.put(key, JSON.stringify({ v: value }), { expirationTtl: ttlSeconds });
  return value;
}

export function buildStructureCacheKey(
  imageHash: string,
  controlType: string
): string {
  return `structure:${controlType}:${imageHash}`;
}
