# Plan 3: Gallery + AI Generation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the AI image generation pipeline (text-composer → image-router → Fal.ai) and the gallery page that shows generated images, plus a "Gerar" button on the GenerateNode canvas node.

**Architecture:** Three pure logic libs (`text-composer`, `image-router`, `fal`) keep all side-effect-free logic testable. The `/api/generate` route orchestrates them: compose prompt → route to provider → call Fal.ai → download result → upload to R2 → insert into D1 `images` table. The `/api/images` route paginates that table by `created_at DESC`. Images are private in R2 so `/api/images/[id]/serve` acts as a signed proxy. The gallery page is a client component polling `/api/images` with `SWR`-style fetch on mount. The GenerateNode gets a "Gerar" button that calls `/api/generate` and stores the returned image ID in node data.

**Tech Stack:** @xyflow/react v12, Fal.ai REST API, Cloudflare R2 + D1, Next.js 15 App Router, Vitest, TypeScript, React 19

---

## File Map

**New files:**
- `src/lib/text-composer.ts` — `composePrompt(text, brand?) → string`
- `src/lib/__tests__/text-composer.test.ts`
- `src/lib/image-router.ts` — `routeRequest(req) → RoutingDecision`
- `src/lib/__tests__/image-router.test.ts`
- `src/lib/fal.ts` — `callFal(input) → FalResult`, `downloadImage(url) → ArrayBuffer`
- `src/app/api/generate/route.ts` — POST: receives GenerationRequest, runs pipeline, persists
- `src/app/api/images/route.ts` — GET: paginated list of images for org
- `src/app/api/images/[id]/serve/route.ts` — GET: proxy image from R2
- `src/app/(app)/gallery/GalleryClient.tsx` — client component: image grid

**Modified files:**
- `src/app/(app)/gallery/page.tsx` — replace placeholder with GalleryClient
- `src/components/canvas/nodes/GenerateNode.tsx` — add "Gerar" button (this file is created in Plan 2 Task 4; Plan 3 Task 7 adds the button to it)

---

### Task 1: Text composer

Composes a Fal.ai-ready prompt string from a `TextPayload` and optional `BrandPayload`. Pure function — no I/O.

**Files:**
- Create: `src/lib/text-composer.ts`
- Create: `src/lib/__tests__/text-composer.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/lib/__tests__/text-composer.test.ts
import { describe, it, expect } from "vitest";
import { composePrompt } from "../text-composer";
import type { TextPayload, BrandPayload } from "@/types";

const baseText: TextPayload = { mainPrompt: "product on white background" };

describe("composePrompt — text only", () => {
  it("returns mainPrompt when no brand or extras", () => {
    expect(composePrompt(baseText)).toBe("product on white background");
  });

  it("appends headline when provided", () => {
    const result = composePrompt({ ...baseText, headline: "Summer Sale" });
    expect(result).toContain("Summer Sale");
    expect(result).toContain("product on white background");
  });

  it("appends subhead when provided", () => {
    const result = composePrompt({ ...baseText, subhead: "50% off" });
    expect(result).toContain("50% off");
  });

  it("appends CTA when provided", () => {
    const result = composePrompt({ ...baseText, cta: "Buy Now" });
    expect(result).toContain("Buy Now");
  });
});

describe("composePrompt — with brand", () => {
  const brand: BrandPayload = {
    clientId: "c1",
    clientName: "Acme",
    toggles: { applyPalette: true, applyTypography: true, applyBrandTone: true, applyArtRefs: false },
    palette: ["#FF0000", "#00FF00"],
    typography: { primary: "Helvetica", secondary: "Georgia" },
    brandTone: "Bold and confident",
  };

  it("includes brand tone when toggle is on", () => {
    const result = composePrompt(baseText, brand);
    expect(result).toContain("Bold and confident");
  });

  it("includes palette when toggle is on", () => {
    const result = composePrompt(baseText, brand);
    expect(result).toContain("#FF0000");
    expect(result).toContain("#00FF00");
  });

  it("includes typography when toggle is on", () => {
    const result = composePrompt(baseText, brand);
    expect(result).toContain("Helvetica");
  });

  it("skips brand tone when toggle is off", () => {
    const result = composePrompt(baseText, {
      ...brand,
      toggles: { ...brand.toggles, applyBrandTone: false },
    });
    expect(result).not.toContain("Bold and confident");
  });

  it("skips palette when toggle is off", () => {
    const result = composePrompt(baseText, {
      ...brand,
      toggles: { ...brand.toggles, applyPalette: false },
    });
    expect(result).not.toContain("#FF0000");
  });

  it("skips typography when toggle is off", () => {
    const result = composePrompt(baseText, {
      ...brand,
      toggles: { ...brand.toggles, applyTypography: false },
    });
    expect(result).not.toContain("Helvetica");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --reporter=verbose src/lib/__tests__/text-composer.test.ts
```

Expected: FAIL — "Cannot find module '../text-composer'"

- [ ] **Step 3: Implement text-composer.ts**

```typescript
// src/lib/text-composer.ts
import type { TextPayload, BrandPayload } from "@/types";

export function composePrompt(text: TextPayload, brand?: BrandPayload): string {
  const parts: string[] = [text.mainPrompt];

  if (brand?.toggles.applyBrandTone && brand.brandTone) {
    parts.push(`Style: ${brand.brandTone}`);
  }
  if (brand?.toggles.applyPalette && brand.palette?.length) {
    parts.push(`Color palette: ${brand.palette.join(", ")}`);
  }
  if (brand?.toggles.applyTypography && brand.typography) {
    parts.push(`Typography: ${brand.typography.primary} (primary), ${brand.typography.secondary} (secondary)`);
  }
  if (text.headline) parts.push(`Headline: "${text.headline}"`);
  if (text.subhead) parts.push(`Subheadline: "${text.subhead}"`);
  if (text.cta) parts.push(`CTA: "${text.cta}"`);

  return parts.join(". ");
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --reporter=verbose src/lib/__tests__/text-composer.test.ts
```

Expected: 10 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/text-composer.ts src/lib/__tests__/text-composer.test.ts
git commit -m "feat: text-composer builds Fal.ai prompt from TextPayload + BrandPayload"
```

---

### Task 2: Image router

Decides which Fal.ai model and params to use based on the `GenerationRequest`. Pure function — no I/O.

**Files:**
- Create: `src/lib/image-router.ts`
- Create: `src/lib/__tests__/image-router.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/lib/__tests__/image-router.test.ts
import { describe, it, expect } from "vitest";
import { routeRequest } from "../image-router";
import type { GenerationRequest } from "@/types";

const baseReq: GenerationRequest = {
  nodeId: "n1",
  nodeType: "Generate",
  textPayload: { mainPrompt: "test" },
};

describe("routeRequest — standard pipeline", () => {
  it("uses flux/schnell when no layoutPayload", () => {
    const result = routeRequest(baseReq);
    expect(result.pipeline).toBe("standard");
    expect(result.provider).toBe("fal");
    expect(result.model).toBe("fal-ai/flux/schnell");
  });

  it("sets square_hd image size by default", () => {
    const result = routeRequest(baseReq);
    expect(result.params.image_size).toBe("square_hd");
  });

  it("sets num_images to 1", () => {
    const result = routeRequest(baseReq);
    expect(result.params.num_images).toBe(1);
  });
});

describe("routeRequest — ControlNet pipelines", () => {
  it("uses controlnet-canny for canny controlType", () => {
    const req: GenerationRequest = {
      ...baseReq,
      layoutPayload: { image: "r2-key", fidelity: 80, techMode: "auto", controlType: "canny" },
    };
    const result = routeRequest(req);
    expect(result.pipeline).toBe("controlnet-canny");
    expect(result.model).toBe("fal-ai/controlnet-canny");
  });

  it("uses controlnet-depth for depth controlType", () => {
    const req: GenerationRequest = {
      ...baseReq,
      layoutPayload: { image: "r2-key", fidelity: 50, techMode: "auto", controlType: "depth" },
    };
    const result = routeRequest(req);
    expect(result.pipeline).toBe("controlnet-depth");
    expect(result.model).toBe("fal-ai/controlnet-depth");
  });

  it("maps fidelity 80 → guidance_scale 8", () => {
    const req: GenerationRequest = {
      ...baseReq,
      layoutPayload: { image: "r2-key", fidelity: 80, techMode: "auto", controlType: "canny" },
    };
    const result = routeRequest(req);
    expect(result.params.guidance_scale).toBe(8);
  });

  it("maps fidelity 0 → guidance_scale 0", () => {
    const req: GenerationRequest = {
      ...baseReq,
      layoutPayload: { image: "r2-key", fidelity: 0, techMode: "auto", controlType: "canny" },
    };
    const result = routeRequest(req);
    expect(result.params.guidance_scale).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --reporter=verbose src/lib/__tests__/image-router.test.ts
```

Expected: FAIL — "Cannot find module '../image-router'"

- [ ] **Step 3: Implement image-router.ts**

```typescript
// src/lib/image-router.ts
import type { GenerationRequest, RoutingDecision, Pipeline } from "@/types";
import { buildPipelineKey } from "./db";

export function routeRequest(request: GenerationRequest): RoutingDecision {
  const pipeline: Pipeline = request.layoutPayload
    ? buildPipelineKey(request.layoutPayload.controlType)
    : "standard";

  if (pipeline === "standard") {
    return {
      pipeline,
      provider: "fal",
      model: "fal-ai/flux/schnell",
      params: { image_size: "square_hd", num_images: 1 },
    };
  }

  const controlType = request.layoutPayload!.controlType;
  const guidanceScale = Math.round(request.layoutPayload!.fidelity / 10);
  return {
    pipeline,
    provider: "fal",
    model: `fal-ai/controlnet-${controlType}`,
    params: { image_size: "square_hd", num_images: 1, guidance_scale: guidanceScale },
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --reporter=verbose src/lib/__tests__/image-router.test.ts
```

Expected: 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/image-router.ts src/lib/__tests__/image-router.test.ts
git commit -m "feat: image-router maps GenerationRequest to RoutingDecision (Fal.ai model + params)"
```

---

### Task 3: Fal.ai client

Thin wrapper over the Fal.ai REST API. No business logic — just HTTP.

**Files:**
- Create: `src/lib/fal.ts`

(No unit tests for HTTP wrapper — integration tested via generate API. The function is designed to be mockable via dependency injection in future tests.)

- [ ] **Step 1: Create fal.ts**

```typescript
// src/lib/fal.ts

export interface FalInput {
  prompt: string;
  model: string;
  params: Record<string, unknown>;
  falKey: string;
}

export interface FalResult {
  imageUrl: string;
}

export async function callFal({ prompt, model, params, falKey }: FalInput): Promise<FalResult> {
  const response = await fetch(`https://fal.run/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${falKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, ...params }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Fal.ai error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as { images?: Array<{ url: string }> };
  const imageUrl = data.images?.[0]?.url;
  if (!imageUrl) throw new Error("Fal.ai returned no images");

  return { imageUrl };
}

export async function downloadImage(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image from Fal.ai: ${res.status}`);
  return res.arrayBuffer();
}
```

- [ ] **Step 2: Verify TypeScript is happy**

```bash
npm run typecheck 2>&1 | head -20
```

Expected: 0 errors related to fal.ts

- [ ] **Step 3: Commit**

```bash
git add src/lib/fal.ts
git commit -m "feat: Fal.ai REST client wrapper (callFal + downloadImage)"
```

---

### Task 4: Generate API route

Orchestrates the full pipeline: auth → validate → compose prompt → route → call Fal → download → R2 upload → D1 insert.

**Files:**
- Create: `src/app/api/generate/route.ts`

- [ ] **Step 1: Create route.ts**

```typescript
// src/app/api/generate/route.ts
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

const brandPayloadSchema = z.object({
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
}).optional();

const layoutPayloadSchema = z.object({
  image: z.string(),
  fidelity: z.number().min(0).max(100),
  techMode: z.enum(["auto", "force_inspiration", "force_strict"]),
  controlType: z.enum(["canny", "depth", "mlsd", "openpose"]),
}).optional();

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
```

- [ ] **Step 2: Verify TypeScript is happy**

```bash
npm run typecheck 2>&1 | head -30
```

Expected: 0 errors related to generate/route.ts

- [ ] **Step 3: Commit**

```bash
git add src/app/api/generate/route.ts
git commit -m "feat: POST /api/generate — compose prompt, route to Fal.ai, store in R2+D1"
```

---

### Task 5: Images list API + image serve API

Two routes: paginated list for gallery, and a proxy route that serves images from private R2.

**Files:**
- Create: `src/app/api/images/route.ts`
- Create: `src/app/api/images/[id]/serve/route.ts`

- [ ] **Step 1: Create images/route.ts**

```typescript
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
```

- [ ] **Step 2: Create images/[id]/serve/route.ts**

```typescript
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
```

- [ ] **Step 3: Verify TypeScript is happy**

```bash
npm run typecheck 2>&1 | head -30
```

Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/app/api/images/route.ts src/app/api/images/[id]/serve/route.ts
git commit -m "feat: GET /api/images (paginated) + /api/images/[id]/serve (R2 proxy)"
```

---

### Task 6: Gallery page

Client component that fetches images from `/api/images` and renders them in a masonry-style grid. Clicking an image opens a full-screen lightbox.

**Files:**
- Create: `src/app/(app)/gallery/GalleryClient.tsx`
- Modify: `src/app/(app)/gallery/page.tsx`

- [ ] **Step 1: Create GalleryClient.tsx**

```tsx
// src/app/(app)/gallery/GalleryClient.tsx
"use client";

import { useEffect, useState, useCallback } from "react";

interface ImageRow {
  id: string;
  workflow_id: string | null;
  r2_key: string;
  pipeline: string | null;
  text_payload_json: string | null;
  created_at: number;
}

interface ApiResponse {
  images: ImageRow[];
  nextCursor: string | null;
}

export function GalleryClient() {
  const [images, setImages] = useState<ImageRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null); // image id

  const fetchImages = useCallback(async (cursor?: string) => {
    const url = cursor ? `/api/images?cursor=${cursor}` : "/api/images";
    const res = await fetch(url);
    if (!res.ok) return;
    const data: ApiResponse = await res.json();
    return data;
  }, []);

  useEffect(() => {
    fetchImages().then((data) => {
      if (!data) return;
      setImages(data.images);
      setNextCursor(data.nextCursor);
      setLoading(false);
    });
  }, [fetchImages]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const data = await fetchImages(nextCursor);
    if (data) {
      setImages((prev) => [...prev, ...data.images]);
      setNextCursor(data.nextCursor);
    }
    setLoadingMore(false);
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square bg-[#E5E2DB] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed p-12 text-center">
        <p className="text-sm text-[#A1A1AA]">Nenhuma imagem gerada ainda.</p>
        <p className="mt-1 text-xs text-[#A1A1AA]">Use o canvas para gerar imagens.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((img) => {
          const prompt = img.text_payload_json
            ? (JSON.parse(img.text_payload_json) as { mainPrompt?: string }).mainPrompt ?? ""
            : "";
          return (
            <button
              key={img.id}
              onClick={() => setLightbox(img.id)}
              className="group relative aspect-square bg-[#E5E2DB] rounded-xl overflow-hidden hover:ring-2 hover:ring-[#0D9488] transition-all"
              title={prompt}
            >
              <img
                src={`/api/images/${img.id}/serve`}
                alt={prompt}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              {img.pipeline && img.pipeline !== "standard" && (
                <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                  {img.pipeline.replace("controlnet-", "")}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {nextCursor && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2.5 text-sm font-medium bg-[#18181B] text-white rounded-lg hover:bg-[#27272A] disabled:opacity-50 transition-colors"
          >
            {loadingMore ? "Carregando..." : "Carregar mais"}
          </button>
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={`/api/images/${lightbox}/serve`}
              alt="Imagem gerada"
              className="max-w-full max-h-[85vh] rounded-xl object-contain"
            />
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#18181B] hover:bg-[#F5F4F1] shadow-md"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Update gallery page.tsx**

```tsx
// src/app/(app)/gallery/page.tsx
import { GalleryClient } from "./GalleryClient";

export default function GalleryPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[#18181B] tracking-tight">Galeria</h1>
        <p className="mt-0.5 text-sm text-[#71717A]">Imagens geradas pelo canvas.</p>
      </div>
      <GalleryClient />
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript is happy**

```bash
npm run typecheck 2>&1 | head -30
```

Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/app/(app)/gallery/GalleryClient.tsx src/app/(app)/gallery/page.tsx
git commit -m "feat: gallery page with image grid, pagination, and lightbox"
```

---

### Task 7: Generate button on GenerateNode

Add a "Gerar" button to the `GenerateNode` canvas component (created in Plan 2 Task 4). When clicked, it posts to `/api/generate` with the node's data and stores the returned image ID in node state for display.

**Files:**
- Modify: `src/components/canvas/nodes/GenerateNode.tsx`

> Note: This task assumes Plan 2 Task 4 has been completed and `GenerateNode.tsx` already exists. If it does not exist yet, complete Plan 2 Tasks 1-4 first.

- [ ] **Step 1: Read the current GenerateNode.tsx**

Read `src/components/canvas/nodes/GenerateNode.tsx` to understand its current structure before editing.

- [ ] **Step 2: Add generate state and handler to GenerateNode.tsx**

Find the component's state and add `generating` (boolean) and `generatedImageId` (string | null) state. Then add a click handler that posts to `/api/generate`. Replace the current file content with:

```tsx
// src/components/canvas/nodes/GenerateNode.tsx
"use client";

import { useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { GenerationRequest, TextPayload, BrandPayload, LayoutPayload } from "@/types";

export interface GenerateNodeData extends Record<string, unknown> {
  label?: string;
  textPayload?: TextPayload;
  brandPayload?: BrandPayload;
  layoutPayload?: LayoutPayload;
  workflowId?: string;
}

export function GenerateNode({ id, data, selected }: NodeProps) {
  const nodeData = data as GenerateNodeData;
  const [generating, setGenerating] = useState(false);
  const [generatedImageId, setGeneratedImageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (generating) return;
    const textPayload = nodeData.textPayload ?? { mainPrompt: "professional product photo" };
    setGenerating(true);
    setError(null);
    try {
      const req: GenerationRequest = {
        nodeId: id,
        nodeType: "Generate",
        textPayload,
        brandPayload: nodeData.brandPayload,
        layoutPayload: nodeData.layoutPayload,
        workflowId: nodeData.workflowId,
      };
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const result = (await res.json()) as { id: string };
      setGeneratedImageId(result.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div
      className={`w-52 rounded-xl border bg-white shadow-sm transition-shadow ${
        selected ? "shadow-md ring-2 ring-[#9ca3af]" : ""
      }`}
    >
      {/* Inputs */}
      <Handle type="target" position={Position.Left} id="text-in"
        style={{ top: "30%", background: "#84cc16", width: 10, height: 10 }} />
      <Handle type="target" position={Position.Left} id="brand-in"
        style={{ top: "50%", background: "#a855f7", width: 10, height: 10 }} />
      <Handle type="target" position={Position.Left} id="layout-in"
        style={{ top: "70%", background: "#3b82f6", width: 10, height: 10 }} />

      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-mono text-[#9ca3af] bg-[#F5F4F1] px-1.5 py-0.5 rounded">generate</span>
          <span className="text-xs font-medium text-[#18181B] truncate">
            {nodeData.label ?? "Gerar Imagem"}
          </span>
        </div>

        {generatedImageId && (
          <div className="mb-2 rounded-lg overflow-hidden border border-[#E5E2DB]">
            <img
              src={`/api/images/${generatedImageId}/serve`}
              alt="Gerado"
              className="w-full aspect-square object-cover"
            />
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full py-1.5 text-xs font-medium rounded-lg bg-[#18181B] text-white hover:bg-[#27272A] disabled:opacity-60 transition-colors"
        >
          {generating ? "Gerando…" : generatedImageId ? "Gerar novamente" : "Gerar"}
        </button>

        {error && (
          <p className="mt-1.5 text-[10px] text-red-500 truncate" title={error}>{error}</p>
        )}
      </div>

      {/* Output */}
      <Handle type="source" position={Position.Right} id="image-out"
        style={{ background: "#9ca3af", width: 10, height: 10 }} />
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript is happy**

```bash
npm run typecheck 2>&1 | head -30
```

Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/components/canvas/nodes/GenerateNode.tsx
git commit -m "feat: GenerateNode — add Gerar button that calls /api/generate and shows result"
```

---

## Self-Review

**Spec coverage:**
- ✅ text-composer pure function (Task 1)
- ✅ image-router pure function (Task 2)
- ✅ Fal.ai REST client (Task 3)
- ✅ generate API route with auth, compose, route, call, store (Task 4)
- ✅ images list API with pagination (Task 5)
- ✅ image serve proxy from R2 (Task 5)
- ✅ gallery page with grid + lightbox + load more (Task 6)
- ✅ GenerateNode Gerar button (Task 7)

**Placeholder scan:** None — all steps have complete code.

**Type consistency:**
- `FalInput` and `FalResult` defined in `fal.ts` — used only in `generate/route.ts`
- `GenerationRequest` from `@/types` — used in both `image-router.ts` and `generate/route.ts`
- Table name is `images` (matches migration) — ✅
- Column names match migration: `id`, `org_id`, `workflow_id`, `node_id`, `r2_key`, `pipeline`, `text_payload_json`, `created_at`, `created_by` — ✅
- `GenerateNodeData` interface defined in `GenerateNode.tsx` itself — ✅
