import type { D1Database } from "@cloudflare/workers-types";
import type { ControlType, Pipeline } from "@/types";

export function generateId(): string {
  return crypto.randomUUID();
}

export function buildPipelineKey(controlType?: ControlType): Pipeline {
  if (!controlType) return "standard";
  return `controlnet-${controlType}`;
}

export async function findOrCreateOrg(
  db: D1Database,
  orgId: string,
  name: string
): Promise<void> {
  await db
    .prepare("INSERT OR IGNORE INTO organizations (id, name) VALUES (?, ?)")
    .bind(orgId, name)
    .run();
}

export async function findOrCreateUser(
  db: D1Database,
  userId: string,
  email: string,
  orgId: string,
  role: "super_admin" | "admin" | "member" = "member"
): Promise<void> {
  await db
    .prepare(
      "INSERT OR REPLACE INTO users (id, email, org_id, role, updated_at) VALUES (?, ?, ?, ?, unixepoch())"
    )
    .bind(userId, email, orgId, role)
    .run();
}
