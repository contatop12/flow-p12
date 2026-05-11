# Plan 4: Clients Management

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Clients CRUD feature — REST API, logo upload to R2, list/create/edit pages, and wire the BrandID canvas node to real client data from D1.

**Architecture:** Two API route groups handle data: `/api/clients` (GET list + POST create) and `/api/clients/[id]` (GET + PUT + DELETE). Logo upload is a separate POST to `/api/clients/[id]/logo` that writes to R2 and updates the `logo_r2_key` column. The clients list page is a client component that fetches from the API. The BrandID node loads clients on mount via `/api/clients` and stores the selection in node data. Palette and art refs are stored as JSON strings in D1 and parsed on read.

**Tech Stack:** Next.js 15 App Router, Cloudflare D1 + R2, React 19, TypeScript, Zod

---

## File Map

**New files:**
- `src/app/api/clients/route.ts` — GET list + POST create
- `src/app/api/clients/[id]/route.ts` — GET + PUT + DELETE
- `src/app/api/clients/[id]/logo/route.ts` — POST: upload logo to R2
- `src/app/(app)/clients/ClientsClient.tsx` — client component: list + create form inline
- `src/app/(app)/clients/[id]/page.tsx` — client detail + edit page (server wrapper)
- `src/app/(app)/clients/[id]/ClientDetailClient.tsx` — client component for detail/edit

**Modified files:**
- `src/app/(app)/clients/page.tsx` — replace placeholder with ClientsClient
- `src/components/canvas/nodes/BrandIDNode.tsx` — wire client dropdown to real data (this file is created in Plan 2 Task 4; Plan 4 Task 7 adds client loading)

---

### Task 1: Clients list + create API

**Files:**
- Create: `src/app/api/clients/route.ts`

- [ ] **Step 1: Create route.ts**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript is happy**

```bash
npm run typecheck 2>&1 | head -30
```

Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/clients/route.ts
git commit -m "feat: GET /api/clients (list) + POST /api/clients (create)"
```

---

### Task 2: Client detail API (GET + PUT + DELETE)

**Files:**
- Create: `src/app/api/clients/[id]/route.ts`

- [ ] **Step 1: Create route.ts**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript is happy**

```bash
npm run typecheck 2>&1 | head -30
```

Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/clients/[id]/route.ts
git commit -m "feat: GET/PUT/DELETE /api/clients/[id] — client detail CRUD"
```

---

### Task 3: Logo upload API

**Files:**
- Create: `src/app/api/clients/[id]/logo/route.ts`

- [ ] **Step 1: Create logo/route.ts**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript is happy**

```bash
npm run typecheck 2>&1 | head -30
```

Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/clients/[id]/logo/route.ts
git commit -m "feat: POST /api/clients/[id]/logo — upload client logo to R2"
```

---

### Task 4: Clients list page

Client component that shows all clients in a table with a create form.

**Files:**
- Create: `src/app/(app)/clients/ClientsClient.tsx`
- Modify: `src/app/(app)/clients/page.tsx`

- [ ] **Step 1: Create ClientsClient.tsx**

```tsx
// src/app/(app)/clients/ClientsClient.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ClientRow {
  id: string;
  name: string;
  logoR2Key?: string;
  palette?: string[];
  brandTone?: string;
  createdAt: number;
  updatedAt: number;
}

export function ClientsClient() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadClients() {
    const res = await fetch("/api/clients");
    if (!res.ok) return;
    const data = (await res.json()) as { clients: ClientRow[] };
    setClients(data.clients);
    setLoading(false);
  }

  useEffect(() => { loadClients(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || creating) return;
    setCreating(true);
    setError(null);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setError(body.error ?? "Erro ao criar cliente");
      setCreating(false);
      return;
    }
    setNewName("");
    setFormOpen(false);
    await loadClients();
    setCreating(false);
  }

  if (loading) {
    return <div className="text-sm text-[#A1A1AA]">Carregando...</div>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-[#71717A]">{clients.length} cliente{clients.length !== 1 ? "s" : ""}</span>
        <button
          onClick={() => setFormOpen((v) => !v)}
          className="px-4 py-2 text-sm font-medium bg-[#18181B] text-white rounded-lg hover:bg-[#27272A] transition-colors"
        >
          {formOpen ? "Cancelar" : "Novo cliente"}
        </button>
      </div>

      {formOpen && (
        <form onSubmit={handleCreate} className="mb-6 flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-[#71717A] mb-1">Nome do cliente</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: Acme Corp"
              autoFocus
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E2DB] bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488] text-[#18181B]"
            />
          </div>
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="px-4 py-2 text-sm font-medium bg-[#0D9488] text-white rounded-lg hover:bg-[#0f766e] disabled:opacity-50 transition-colors"
          >
            {creating ? "Criando…" : "Criar"}
          </button>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </form>
      )}

      {clients.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed p-12 text-center">
          <p className="text-sm text-[#A1A1AA]">Nenhum cliente cadastrado.</p>
          <p className="mt-1 text-xs text-[#A1A1AA]">Clique em "Novo cliente" para começar.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E5E2DB] divide-y divide-[#E5E2DB]">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-[#F5F4F1] transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-[#F5F4F1] border border-[#E5E2DB] flex items-center justify-center shrink-0 overflow-hidden">
                {client.logoR2Key ? (
                  <img src={`/api/clients/${client.id}/logo/serve`} alt={client.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-[#A1A1AA]">{client.name[0]?.toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#18181B] truncate">{client.name}</p>
                {client.brandTone && (
                  <p className="text-xs text-[#71717A] truncate">{client.brandTone}</p>
                )}
              </div>
              {client.palette && client.palette.length > 0 && (
                <div className="flex gap-1 shrink-0">
                  {client.palette.slice(0, 4).map((color) => (
                    <div
                      key={color}
                      className="w-4 h-4 rounded-full border border-[#E5E2DB]"
                      style={{ background: color }}
                    />
                  ))}
                </div>
              )}
              <span className="text-xs text-[#A1A1AA] shrink-0">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update clients/page.tsx**

```tsx
// src/app/(app)/clients/page.tsx
import { ClientsClient } from "./ClientsClient";

export default function ClientsPage() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[#18181B] tracking-tight">Clientes</h1>
        <p className="mt-0.5 text-sm text-[#71717A]">Gerencie seus Brand IDs.</p>
      </div>
      <ClientsClient />
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
git add src/app/(app)/clients/ClientsClient.tsx src/app/(app)/clients/page.tsx
git commit -m "feat: clients list page with inline create form"
```

---

### Task 5: Client logo serve route + detail page

The logo needs a serve proxy (same pattern as image serve). The detail page allows editing all brand fields and uploading a logo.

**Files:**
- Create: `src/app/api/clients/[id]/logo/serve/route.ts` — GET proxy for logo from R2
- Create: `src/app/(app)/clients/[id]/page.tsx` — server wrapper
- Create: `src/app/(app)/clients/[id]/ClientDetailClient.tsx` — edit form + logo upload

- [ ] **Step 1: Create logo serve route**

```typescript
// src/app/api/clients/[id]/logo/serve/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
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
    "SELECT logo_r2_key FROM clients WHERE id = ? AND org_id = ?"
  )
    .bind(id, orgId)
    .first<{ logo_r2_key: string | null }>();

  if (!row?.logo_r2_key) return NextResponse.json({ error: "Logo não encontrado" }, { status: 404 });

  const obj = await R2.get(row.logo_r2_key);
  if (!obj) return NextResponse.json({ error: "Arquivo não encontrado no R2" }, { status: 404 });

  const buffer = await obj.arrayBuffer();
  const contentType = obj.httpMetadata?.contentType ?? "image/png";
  return new Response(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=86400",
    },
  });
}
```

- [ ] **Step 2: Create clients/[id]/page.tsx**

```tsx
// src/app/(app)/clients/[id]/page.tsx
import { ClientDetailClient } from "./ClientDetailClient";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClientDetailClient clientId={id} />;
}
```

- [ ] **Step 3: Create ClientDetailClient.tsx**

```tsx
// src/app/(app)/clients/[id]/ClientDetailClient.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface ClientData {
  id: string;
  name: string;
  logoR2Key?: string;
  palette?: string[];
  typography?: { primary: string; secondary: string };
  brandTone?: string;
  artRefs?: string[];
  createdAt: number;
  updatedAt: number;
}

export function ClientDetailClient({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState("");
  const [brandTone, setBrandTone] = useState("");
  const [primaryFont, setPrimaryFont] = useState("");
  const [secondaryFont, setSecondaryFont] = useState("");
  const [paletteInput, setPaletteInput] = useState(""); // comma-separated hex values

  useEffect(() => {
    fetch(`/api/clients/${clientId}`)
      .then((r) => r.json())
      .then((data: ClientData) => {
        setClient(data);
        setName(data.name);
        setBrandTone(data.brandTone ?? "");
        setPrimaryFont(data.typography?.primary ?? "");
        setSecondaryFont(data.typography?.secondary ?? "");
        setPaletteInput(data.palette?.join(", ") ?? "");
        setLoading(false);
      });
  }, [clientId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    setSaveMsg(null);

    const palette = paletteInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const body: Record<string, unknown> = { name };
    if (brandTone) body.brandTone = brandTone;
    if (palette.length > 0) body.palette = palette;
    if (primaryFont || secondaryFont) {
      body.typography = { primary: primaryFont, secondary: secondaryFont };
    }

    const res = await fetch(`/api/clients/${clientId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Erro ao salvar");
    } else {
      setSaveMsg("Salvo!");
      setTimeout(() => setSaveMsg(null), 2000);
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm(`Excluir o cliente "${client?.name}"? Esta ação não pode ser desfeita.`)) return;
    setDeleting(true);
    await fetch(`/api/clients/${clientId}`, { method: "DELETE" });
    router.push("/clients");
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setError(null);
    const res = await fetch(`/api/clients/${clientId}/logo`, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Erro ao fazer upload do logo");
    } else {
      setClient((prev) => prev ? { ...prev, logoR2Key: `updated-${Date.now()}` } : prev);
    }
    setUploadingLogo(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (loading) return <div className="p-8 text-sm text-[#A1A1AA]">Carregando...</div>;
  if (!client) return <div className="p-8 text-sm text-red-500">Cliente não encontrado.</div>;

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.push("/clients")}
          className="text-sm text-[#71717A] hover:text-[#18181B] transition-colors"
        >
          ← Clientes
        </button>
        <span className="text-[#E5E2DB]">/</span>
        <h1 className="text-xl font-semibold text-[#18181B] tracking-tight">{client.name}</h1>
      </div>

      {/* Logo */}
      <div className="mb-6 bg-white rounded-xl border border-[#E5E2DB] p-4">
        <p className="text-sm font-medium text-[#18181B] mb-3">Logo</p>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl border border-[#E5E2DB] bg-[#F5F4F1] overflow-hidden flex items-center justify-center">
            {client.logoR2Key ? (
              <img
                src={`/api/clients/${clientId}/logo/serve?t=${client.logoR2Key}`}
                alt={client.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-2xl font-bold text-[#A1A1AA]">{client.name[0]?.toUpperCase()}</span>
            )}
          </div>
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingLogo}
              className="px-3 py-1.5 text-xs font-medium border border-[#E5E2DB] rounded-lg hover:bg-[#F5F4F1] disabled:opacity-50 transition-colors"
            >
              {uploadingLogo ? "Enviando…" : "Trocar logo"}
            </button>
            <p className="mt-1 text-[11px] text-[#A1A1AA]">PNG, JPG, WebP ou SVG. Máx 5 MB.</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleLogoUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-[#E5E2DB] p-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#71717A] mb-1">Nome *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E2DB] bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488] text-[#18181B]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#71717A] mb-1">Tom de marca</label>
          <textarea
            value={brandTone}
            onChange={(e) => setBrandTone(e.target.value)}
            rows={3}
            placeholder="Ex: Bold and modern, com personalidade vibrante..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E2DB] bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488] text-[#18181B] resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#71717A] mb-1">Fonte primária</label>
            <input
              type="text"
              value={primaryFont}
              onChange={(e) => setPrimaryFont(e.target.value)}
              placeholder="Ex: Helvetica Neue"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E2DB] bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488] text-[#18181B]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#71717A] mb-1">Fonte secundária</label>
            <input
              type="text"
              value={secondaryFont}
              onChange={(e) => setSecondaryFont(e.target.value)}
              placeholder="Ex: Georgia"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E2DB] bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488] text-[#18181B]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#71717A] mb-1">
            Paleta de cores
            <span className="font-normal ml-1 text-[#A1A1AA]">(hex separados por vírgula)</span>
          </label>
          <input
            type="text"
            value={paletteInput}
            onChange={(e) => setPaletteInput(e.target.value)}
            placeholder="#FF0000, #00FF00, #0000FF"
            className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E2DB] bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488] text-[#18181B] font-mono"
          />
          {paletteInput && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {paletteInput
                .split(",")
                .map((c) => c.trim())
                .filter((c) => c.match(/^#[0-9a-fA-F]{3,6}$/))
                .map((color) => (
                  <div
                    key={color}
                    className="w-6 h-6 rounded border border-[#E5E2DB]"
                    style={{ background: color }}
                    title={color}
                  />
                ))}
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
        {saveMsg && <p className="text-xs text-[#0D9488]">{saveMsg}</p>}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-3 py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {deleting ? "Excluindo…" : "Excluir cliente"}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-[#18181B] text-white rounded-lg hover:bg-[#27272A] disabled:opacity-50 transition-colors"
          >
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Verify TypeScript is happy**

```bash
npm run typecheck 2>&1 | head -30
```

Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add src/app/api/clients/[id]/logo/serve/route.ts src/app/(app)/clients/[id]/page.tsx src/app/(app)/clients/[id]/ClientDetailClient.tsx
git commit -m "feat: client detail page with brand editor and logo upload"
```

---

### Task 6: BrandID node wired to real clients

The `BrandIDNode` (created in Plan 2 Task 4) currently has a static client name field. This task replaces it with a dropdown that loads real clients from `/api/clients` and stores the selected client's full brand data in node data.

**Files:**
- Modify: `src/components/canvas/nodes/BrandIDNode.tsx`

> Note: This task assumes Plan 2 Task 4 has been completed and `BrandIDNode.tsx` already exists. If it does not exist yet, complete Plan 2 Tasks 1-4 first.

- [ ] **Step 1: Read the current BrandIDNode.tsx**

Read `src/components/canvas/nodes/BrandIDNode.tsx` to understand its current structure before editing.

- [ ] **Step 2: Replace BrandIDNode.tsx with client-aware version**

```tsx
// src/components/canvas/nodes/BrandIDNode.tsx
"use client";

import { useEffect, useState } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import type { BrandPayload } from "@/types";

interface ClientOption {
  id: string;
  name: string;
  palette?: string[];
  typography?: { primary: string; secondary: string };
  brandTone?: string;
}

export interface BrandIDNodeData extends Record<string, unknown> {
  label?: string;
  brandPayload?: BrandPayload;
}

export function BrandIDNode({ id, data, selected }: NodeProps) {
  const nodeData = data as BrandIDNodeData;
  const { updateNodeData } = useReactFlow();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<string>(
    nodeData.brandPayload?.clientId ?? ""
  );

  const [toggles, setToggles] = useState({
    applyPalette: nodeData.brandPayload?.toggles.applyPalette ?? true,
    applyTypography: nodeData.brandPayload?.toggles.applyTypography ?? true,
    applyBrandTone: nodeData.brandPayload?.toggles.applyBrandTone ?? true,
    applyArtRefs: nodeData.brandPayload?.toggles.applyArtRefs ?? false,
  });

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((res: { clients: ClientOption[] }) => {
        setClients(res.clients);
        setLoadingClients(false);
      });
  }, []);

  function updatePayload(clientId: string, newToggles: typeof toggles) {
    const client = clients.find((c) => c.id === clientId);
    if (!client) {
      updateNodeData(id, { brandPayload: undefined });
      return;
    }
    const payload: BrandPayload = {
      clientId: client.id,
      clientName: client.name,
      toggles: newToggles,
      palette: client.palette,
      typography: client.typography,
      brandTone: client.brandTone,
    };
    updateNodeData(id, { brandPayload: payload });
  }

  function handleClientChange(clientId: string) {
    setSelectedClientId(clientId);
    updatePayload(clientId, toggles);
  }

  function handleToggle(key: keyof typeof toggles) {
    const newToggles = { ...toggles, [key]: !toggles[key] };
    setToggles(newToggles);
    updatePayload(selectedClientId, newToggles);
  }

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  return (
    <div
      className={`w-52 rounded-xl border bg-white shadow-sm transition-shadow ${
        selected ? "shadow-md ring-2 ring-[#a855f7]" : ""
      }`}
    >
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-mono text-[#a855f7] bg-purple-50 px-1.5 py-0.5 rounded">brand</span>
          <span className="text-xs font-medium text-[#18181B] truncate">
            {nodeData.label ?? "Brand ID"}
          </span>
        </div>

        <select
          value={selectedClientId}
          onChange={(e) => handleClientChange(e.target.value)}
          disabled={loadingClients}
          className="w-full px-2 py-1.5 text-xs rounded-lg border border-[#E5E2DB] bg-white text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#a855f7] mb-2"
        >
          <option value="">{loadingClients ? "Carregando…" : "Selecione um cliente"}</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {selectedClient && (
          <div className="space-y-1">
            {(["applyBrandTone", "applyPalette", "applyTypography"] as const).map((key) => {
              const labels: Record<string, string> = {
                applyBrandTone: "Tom",
                applyPalette: "Paleta",
                applyTypography: "Tipografia",
              };
              return (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={toggles[key]}
                    onChange={() => handleToggle(key)}
                    className="rounded border-[#E5E2DB] accent-[#a855f7]"
                  />
                  <span className="text-[11px] text-[#71717A]">{labels[key]}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="brand-out"
        style={{ background: "#a855f7", width: 10, height: 10 }}
      />
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
git add src/components/canvas/nodes/BrandIDNode.tsx
git commit -m "feat: BrandIDNode loads real clients from /api/clients, stores full BrandPayload in node data"
```

---

## Self-Review

**Spec coverage:**
- ✅ GET /api/clients list (Task 1)
- ✅ POST /api/clients create (Task 1)
- ✅ GET /api/clients/[id] detail (Task 2)
- ✅ PUT /api/clients/[id] update (Task 2)
- ✅ DELETE /api/clients/[id] (Task 2)
- ✅ POST /api/clients/[id]/logo upload to R2 (Task 3)
- ✅ GET /api/clients/[id]/logo/serve R2 proxy (Task 5)
- ✅ Clients list page with inline create form (Task 4)
- ✅ Client detail/edit page with logo upload (Task 5)
- ✅ BrandID node wired to real client data (Task 6)

**Placeholder scan:** None — all steps have complete code.

**Type consistency:**
- `ClientData` interface in `ClientDetailClient.tsx` matches API response shape from `route.ts`
- `ClientOption` in `BrandIDNode.tsx` is a subset of `ClientData` (only fields needed for payload)
- `BrandPayload` from `@/types` used consistently across `BrandIDNode.tsx` and API routes
- Table column names match migration: `logo_r2_key`, `palette_json`, `typography_json`, `brand_tone`, `art_refs_json` — ✅
- Logo serve URL in `ClientsClient.tsx` uses `/api/clients/${id}/logo` — update to `/api/clients/${id}/logo/serve` since that's the actual route
