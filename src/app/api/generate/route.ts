import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-session";
import { getCloudflareBindings } from "@/lib/cloudflare";
import { getUserContext } from "@/lib/user-context";
import { composePrompt } from "@/lib/text-composer";
import { routeRequest } from "@/lib/image-router";
import { callFal, downloadImage } from "@/lib/fal";
import { buildR2Key, uploadToR2 } from "@/lib/r2";
import { generateId } from "@/lib/db";

const textPayloadSchema = z.object({
  mainPrompt: z.string().min(1),
  headline: z.string().optional(),
  subhead: z.string().optional(),
  cta: z.string().optional(),
  disclaimer: z.string().optional(),
  composedPrompt: z.string().optional(),
});

const brandPayloadSchema = z
  .object({
    clientId: z.string(),
    clientName: z.string(),
    toggles: z.object({
      applyPalette: z.boolean(),
      applyTypography: z.boolean(),
      applyBrandTone: z.boolean(),
      applyArtRefs: z.boolean(),
    }),
    palette: z.array(z.string()).optional(),
    typography: z.object({ primary: z.string(), secondary: z.string() }).optional(),
    brandTone: z.string().optional(),
    artRefs: z.array(z.string()).optional(),
  })
  .optional();

const layoutPayloadSchema = z
  .object({
    image: z.string(),
    fidelity: z.number().min(0).max(100),
    techMode: z.enum(["auto", "force_inspiration", "force_strict"]),
    controlType: z.enum(["canny", "depth", "mlsd", "openpose"]),
  })
  .optional();

const generateSchema = z.object({
  nodeId: z.string(),
  nodeType: z.enum(["Generate", "Edit", "StyleTransfer", "ConsistencyPack", "Upscale"]),
  textPayload: textPayloadSchema,
  brandPayload: brandPayloadSchema,
  layoutPayload: layoutPayloadSchema,
  preferredProvider: z.enum(["gpt-image-2", "nano-banana-2", "luma"]).optional(),
  workflowId: z.string().optional(),
});

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
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
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.issues }, { status: 400 });
  }

  const falKey = (env as Record<string, string>).FAL_KEY ?? "";
  if (!falKey) return NextResponse.json({ error: "FAL_KEY não configurada" }, { status: 500 });

  const { DB, R2 } = getCloudflareBindings();
  const { userId, orgId } = await getUserContext(session.email, DB);

  const req = parsed.data;
  const prompt = composePrompt(req.textPayload, req.brandPayload);
  const routing = routeRequest(req);

  let imageUrl: string;
  try {
    ({ imageUrl } = await callFal({ prompt, model: routing.model, params: routing.params, falKey }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Geração falhou: ${msg}` }, { status: 502 });
  }

  let imageBuffer: ArrayBuffer;
  try {
    imageBuffer = await downloadImage(imageUrl);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Download da imagem falhou: ${msg}` }, { status: 502 });
  }

  const id = generateId();
  const r2Key = buildR2Key(orgId, "image", `${id}.png`);
  await uploadToR2(R2, r2Key, imageBuffer, "image/png");

  const now = Math.floor(Date.now() / 1000);
  await DB.prepare(
    `INSERT INTO images (id, org_id, workflow_id, node_id, r2_key, pipeline, text_payload_json, created_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      orgId,
      req.workflowId ?? null,
      req.nodeId,
      r2Key,
      routing.pipeline,
      JSON.stringify(req.textPayload),
      now,
      userId
    )
    .run();

  return NextResponse.json({
    id,
    orgId,
    workflowId: req.workflowId ?? null,
    r2Key,
    pipeline: routing.pipeline,
    textPayloadJson: JSON.stringify(req.textPayload),
    createdAt: now,
    createdBy: userId,
  });
}
