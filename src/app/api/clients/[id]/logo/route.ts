// src/app/api/clients/[id]/logo/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-session";
import { getCloudflareBindings } from "@/lib/cloudflare";
import { getUserContext } from "@/lib/user-context";
import { buildR2Key, uploadToR2 } from "@/lib/r2";
import { generateId } from "@/lib/db";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { env } = getCloudflareContext();
  const session = await verifySessionToken(token, (env as Record<string, string>).AUTH_SECRET ?? "");
  if (!session) return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });

  const { id } = await params;
  const { DB, R2 } = getCloudflareBindings();
  const { orgId } = await getUserContext(session.email, DB);

  const existing = await DB.prepare("SELECT id FROM clients WHERE id = ? AND org_id = ?")
    .bind(id, orgId)
    .first<{ id: string }>();
  if (!existing) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  const contentType = request.headers.get("Content-Type") ?? "application/octet-stream";
  if (!ALLOWED_TYPES.has(contentType)) {
    return NextResponse.json({ error: "Tipo de arquivo não suportado. Use PNG, JPG, WebP ou SVG." }, { status: 415 });
  }

  const buffer = await request.arrayBuffer();
  if (buffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "Arquivo muito grande (máximo 5 MB)" }, { status: 413 });
  }

  const ext = contentType.split("/")[1]!.replace("svg+xml", "svg").replace("jpeg", "jpg");
  const filename = `${generateId()}.${ext}`;
  const r2Key = buildR2Key(orgId, "logo", filename);

  await uploadToR2(R2, r2Key, buffer, contentType);

  await DB.prepare("UPDATE clients SET logo_r2_key = ?, updated_at = ? WHERE id = ? AND org_id = ?")
    .bind(r2Key, Math.floor(Date.now() / 1000), id, orgId)
    .run();

  return NextResponse.json({ r2Key });
}
