import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database, KVNamespace, R2Bucket } from "@cloudflare/workers-types";

export interface AppBindings {
  DB: D1Database;
  R2: R2Bucket;
  KV: KVNamespace;
}

export function getCloudflareBindings(): AppBindings {
  const { env } = getCloudflareContext();
  return env as unknown as AppBindings;
}
