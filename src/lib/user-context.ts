import type { D1Database } from "@cloudflare/workers-types";
import { findOrCreateOrg, findOrCreateUser } from "./db";

export function emailToUserId(email: string): string {
  return "user_" + email.toLowerCase().replace(/[^a-z0-9]/g, "_");
}

export function emailToOrgId(email: string): string {
  const domain = email.includes("@") ? email.split("@")[1] : email;
  return "org_" + domain.toLowerCase().replace(/[^a-z0-9]/g, "_");
}

export function emailToOrgName(email: string): string {
  return email.includes("@") ? email.split("@")[1] : email;
}

export async function getUserContext(
  email: string,
  db: D1Database
): Promise<{ userId: string; orgId: string }> {
  const userId = emailToUserId(email);
  const orgId = emailToOrgId(email);
  const orgName = emailToOrgName(email);

  await findOrCreateOrg(db, orgId, orgName);
  await findOrCreateUser(db, userId, email, orgId, "super_admin");

  return { userId, orgId };
}
