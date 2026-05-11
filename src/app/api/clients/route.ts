// src/app/api/clients/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-session";
import { getCloudflareBindings } from "@/lib/cloudflare";
import { getUserContext } from "@/lib/user-context";
import { generateId } from "@/lib/db";

const createClientSchema = z.object({
  name: z.string().min(1).max(120),
  palette: z.array(z.string()).optional(),
  typography: z.object({ primary: z.string(), secondary: z.string() }).optional(),
  brandTone: z.string().max(500).optional(),
});

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return token ?? null;
}

export async function GET() {
  const token = await getSession();
  if (!token) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { env } = getCloudflareContext();
  const session = await verifySessionToken(token, (env as Record<string, string>).AUTH_SECRET ?? "");
  if (!session) return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });

  const { DB } = getCloudflareBindings();
  const { orgId } = await getUserContext(session.email, DB);

  const result = await DB.prepare(
    `SELECT id, name, logo_r2_key, palette_json, typography_json, brand_tone, art_refs_json, created_at, updated_at
     FROM clients
     WHERE org_id = ?
     ORDER BY name ASC`
  )
    .bind(orgId)
    .all<{
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

  const clients = result.results.map((row) => ({
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
  }));

  return NextResponse.json({ clients });
}

export async function POST(request: Request) {
  const token = await getSession();
  if (!token) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { env } = getCloudflareContext();
  const session = await verifySessionToken(token, (env as Record<string, string>).AUTH_SECRET ?? "");
  if (!session) return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = createClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.issues }, { status: 400 });
  }

  const { DB } = getCloudflareBindings();
  const { userId, orgId } = await getUserContext(session.email, DB);

  const id = generateId();
  const now = Math.floor(Date.now() / 1000);
  const { name, palette, typography, brandTone } = parsed.data;

  await DB.prepare(
    `INSERT INTO clients (id, org_id, name, palette_json, typography_json, brand_tone, created_at, updated_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      orgId,
      name,
      palette ? JSON.stringify(palette) : null,
      typography ? JSON.stringify(typography) : null,
      brandTone ?? null,
      now,
      now,
      userId
    )
    .run();

  return NextResponse.json({ id, name, orgId, createdAt: now, updatedAt: now }, { status: 201 });
}
