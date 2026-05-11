import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCloudflareBindings } from "@/lib/cloudflare";
import { getUserContext } from "@/lib/user-context";
import { generateId } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth-session";
import { getCloudflareContext } from "@opennextjs/cloudflare";

async function getAuthEmail(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const { env } = getCloudflareContext();
  const secret = (env as Record<string, string | undefined>).AUTH_SECRET ?? "";
  if (!secret) return null;
  const session = await verifySessionToken(token, secret);
  return session?.email ?? null;
}

export async function GET() {
  const email = await getAuthEmail();
  if (!email) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { DB } = getCloudflareBindings();
  const { orgId } = await getUserContext(email, DB);

  const rows = await DB
    .prepare("SELECT id, name, graph_json, created_at, updated_at FROM workflows WHERE org_id = ? ORDER BY updated_at DESC LIMIT 20")
    .bind(orgId)
    .all<{ id: string; name: string; graph_json: string; created_at: number; updated_at: number }>();

  const workflows = (rows.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    graphJson: r.graph_json,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  return NextResponse.json({ workflows });
}

export async function POST(request: Request) {
  const email = await getAuthEmail();
  if (!email) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { name?: string; graphJson?: string };
  const name = body.name?.trim() || "Workflow sem nome";
  const graphJson = body.graphJson ?? "{}";

  const { DB } = getCloudflareBindings();
  const { userId, orgId } = await getUserContext(email, DB);
  const id = generateId();

  await DB
    .prepare("INSERT INTO workflows (id, org_id, name, graph_json, created_by) VALUES (?, ?, ?, ?, ?)")
    .bind(id, orgId, name, graphJson, userId)
    .run();

  return NextResponse.json({ id }, { status: 201 });
}
