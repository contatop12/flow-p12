// src/app/api/images/[id]/serve/route.ts
import { cookies } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-session";
import { getCloudflareBindings } from "@/lib/cloudflare";
import { getUserContext } from "@/lib/user-context";

export async function GET(
  _request: Request,
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

  const row = await DB.prepare(
    `SELECT r2_key FROM images WHERE id = ? AND org_id = ?`
  )
    .bind(id, orgId)
    .first<{ r2_key: string }>();

  if (!row) return NextResponse.json({ error: "Imagem não encontrada" }, { status: 404 });

  const obj = await R2.get(row.r2_key);
  if (!obj) return NextResponse.json({ error: "Arquivo não encontrado no R2" }, { status: 404 });

  const buffer = await obj.arrayBuffer();
  return new Response(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=86400",
    },
  });
}
