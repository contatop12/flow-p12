import type { D1Database, KVNamespace, R2Bucket } from "@cloudflare/workers-types";

export interface CloudflareEnv {
  DB: D1Database;
  R2: R2Bucket;
  KV: KVNamespace;
}

export function getCloudflareBindings(): CloudflareEnv {
  const ctx = (globalThis as unknown as { __ENV__?: CloudflareEnv }).__ENV__;
  if (!ctx) {
    throw new Error(
      "Cloudflare bindings not available — ensure running in Workers context"
    );
  }
  return ctx;
}
