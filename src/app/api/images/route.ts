// src/app/api/images/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-session";
import { getCloudflareBindings } from "@/lib/cloudflare";
import { getUserContext } from "@/lib/user-context";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { env } = getCloudflareContext();
  const session = await verifySessionToken(token, (env as Record<string, string>).AUTH_SECRET ?? "");
  if (!session) return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });

  const { DB } = getCloudflareBindings();
  const { orgId } = await getUserContext(session.email, DB);

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "24"), 100);
  const cursor = url.searchParams.get("cursor"); // last created_at value from previous page

  let rows: unknown;
  if (cursor) {
    const result = await DB.prepare(
      `SELECT id, workflow_id, r2_key, pipeline, text_payload_json, created_at
       FROM images
       WHERE org_id = ? AND created_at < ?
       ORDER BY created_at DESC
       LIMIT ?`
    )
      .bind(orgId, Number(cursor), limit)
      .all();
    rows = result.results;
  } else {
    const result = await DB.prepare(
      `SELECT id, workflow_id, r2_key, pipeline, text_payload_json, created_at
       FROM images
       WHERE org_id = ?
       ORDER BY created_at DESC
       LIMIT ?`
    )
      .bind(orgId, limit)
      .all();
    rows = result.results;
  }

  const images = rows as Array<{
    id: string;
    workflow_id: string | null;
    r2_key: string;
    pipeline: string | null;
    text_payload_json: string | null;
    created_at: number;
  }>;

  const nextCursor = images.length === limit ? String(images[images.length - 1]!.created_at) : null;

  return NextResponse.json({ images, nextCursor });
}
