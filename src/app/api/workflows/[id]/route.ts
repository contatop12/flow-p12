import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCloudflareBindings } from "@/lib/cloudflare";
import { getUserContext } from "@/lib/user-context";
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

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const email = await getAuthEmail();
  if (!email) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const { DB } = getCloudflareBindings();
  const { orgId } = await getUserContext(email, DB);

  const row = await DB
    .prepare("SELECT id, name, graph_json FROM workflows WHERE id = ? AND org_id = ?")
    .bind(id, orgId)
    .first<{ id: string; name: string; graph_json: string }>();

  if (!row) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  return NextResponse.json({ id: row.id, name: row.name, graphJson: row.graph_json });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const email = await getAuthEmail();
  if (!email) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { name?: string; graphJson?: string };

  const { DB } = getCloudflareBindings();
  const { orgId } = await getUserContext(email, DB);

  await DB
    .prepare(
      "UPDATE workflows SET name = COALESCE(?, name), graph_json = COALESCE(?, graph_json), updated_at = unixepoch() WHERE id = ? AND org_id = ?"
    )
    .bind(body.name ?? null, body.graphJson ?? null, id, orgId)
    .run();

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const email = await getAuthEmail();
  if (!email) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const { DB } = getCloudflareBindings();
  const { orgId } = await getUserContext(email, DB);

  await DB
    .prepare("DELETE FROM workflows WHERE id = ? AND org_id = ?")
    .bind(id, orgId)
    .run();

  return NextResponse.json({ ok: true });
}
