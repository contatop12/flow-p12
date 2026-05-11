// src/app/api/clients/[id]/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-session";
import { getCloudflareBindings } from "@/lib/cloudflare";
import { getUserContext } from "@/lib/user-context";

const updateClientSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  palette: z.array(z.string()).optional(),
  typography: z.object({ primary: z.string(), secondary: z.string() }).optional(),
  brandTone: z.string().max(500).optional(),
});

async function authenticate() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const { env } = getCloudflareContext();
  return verifySessionToken(token, (env as Record<string, string>).AUTH_SECRET ?? "");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await authenticate();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const { DB } = getCloudflareBindings();
  const { orgId } = await getUserContext(session.email, DB);

  const row = await DB.prepare(
    `SELECT id, name, logo_r2_key, palette_json, typography_json, brand_tone, art_refs_json, created_at, updated_at
     FROM clients WHERE id = ? AND org_id = ?`
  )
    .bind(id, orgId)
    .first<{
      id: string;
      name: string;
      logo_r2_key: string | null;
      palette_json: string | null;
      typography_json: string | null;
      brand_tone: string | null;
      art_refs_json: string | null;
      created_at: number;
      updated_at: number;
    }>();

  if (!row) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  return NextResponse.json({
    id: row.id,
    name: row.name,
    logoR2Key: row.logo_r2_key ?? undefined,
    palette: row.palette_json ? (JSON.parse(row.palette_json) as string[]) : undefined,
    typography: row.typography_json
      ? (JSON.parse(row.typography_json) as { primary: string; secondary: string })
      : undefined,
    brandTone: row.brand_tone ?? undefined,
    artRefs: row.art_refs_json ? (JSON.parse(row.art_refs_json) as string[]) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await authenticate();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = updateClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.issues }, { status: 400 });
  }

  const { id } = await params;
  const { DB } = getCloudflareBindings();
  const { orgId } = await getUserContext(session.email, DB);

  const existing = await DB.prepare("SELECT id FROM clients WHERE id = ? AND org_id = ?")
    .bind(id, orgId)
    .first<{ id: string }>();
  if (!existing) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  const now = Math.floor(Date.now() / 1000);
  const { name, palette, typography, brandTone } = parsed.data;

  const fields: string[] = ["updated_at = ?"];
  const values: unknown[] = [now];

  if (name !== undefined) { fields.push("name = ?"); values.push(name); }
  if (palette !== undefined) { fields.push("palette_json = ?"); values.push(JSON.stringify(palette)); }
  if (typography !== undefined) { fields.push("typography_json = ?"); values.push(JSON.stringify(typography)); }
  if (brandTone !== undefined) { fields.push("brand_tone = ?"); values.push(brandTone); }

  values.push(id, orgId);

  await DB.prepare(`UPDATE clients SET ${fields.join(", ")} WHERE id = ? AND org_id = ?`)
    .bind(...values)
    .run();

  return NextResponse.json({ ok: true, updatedAt: now });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await authenticate();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const { DB } = getCloudflareBindings();
  const { orgId } = await getUserContext(session.email, DB);

  const existing = await DB.prepare("SELECT id FROM clients WHERE id = ? AND org_id = ?")
    .bind(id, orgId)
    .first<{ id: string }>();
  if (!existing) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  await DB.prepare("DELETE FROM clients WHERE id = ? AND org_id = ?").bind(id, orgId).run();

  return NextResponse.json({ ok: true });
}
