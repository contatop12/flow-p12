# Flow P12 — Plan 1: Foundation (Infra + Auth + DB Schema)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the Next.js 15 + Cloudflare project scaffold with Clerk auth, full D1 schema, shared TypeScript types, and dark-themed app shell.

**Architecture:** Next.js 15 App Router deployed via OpenNext adapter to Cloudflare Pages; API routes run as Cloudflare Workers; D1 for relational data, R2 for image storage, KV for cache; Clerk Organizations for multi-tenant auth with roles (super_admin / admin / member).

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, @xyflow/react (React Flow v12), @clerk/nextjs, Cloudflare D1/R2/KV/Pages, @opennextjs/cloudflare, Vitest, Zod

---

## Project Sub-Plans Overview

| Plan | Scope | Depends On |
|---|---|---|
| **Plan 1 (this)** | Foundation: scaffold, types, D1, auth, shell | — |
| Plan 2 | Canvas + Node Architecture: React Flow, all node UIs, typed connections | Plan 1 |
| Plan 3 | AI Workers: image-router, brand-context-injector, structure-extractor, text-composer | Plan 1 |
| Plan 4 | Client Management: /clients, brand extraction, Claude Vision + WhatFontIs | Plan 1 + Plan 2 |

---

## File Map

### Config
- Create: `package.json`
- Create: `next.config.ts`
- Create: `wrangler.toml`
- Create: `open-next.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `.gitignore`
- Create: `.dev.vars` (gitignored — API keys)
- Create: `vitest.config.ts`

### Types + Core
- Create: `src/types/index.ts`
- Create: `src/env.ts`

### Database
- Create: `migrations/0001_initial_schema.sql`

### Infra Helpers
- Create: `src/lib/db.ts`
- Create: `src/lib/r2.ts`
- Create: `src/lib/kv.ts`
- Create: `src/lib/cloudflare.ts`

### Auth
- Create: `src/middleware.ts`
- Create: `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`
- Create: `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`

### App Shell
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Create: `src/app/(app)/layout.tsx`
- Create: `src/app/(app)/dashboard/page.tsx`
- Create: `src/app/(app)/canvas/page.tsx`
- Create: `src/app/(app)/clients/page.tsx`
- Create: `src/app/(app)/gallery/page.tsx`
- Create: `src/app/(app)/settings/page.tsx`
- Create: `src/components/nav/Navbar.tsx`

### API
- Create: `src/app/api/health/route.ts`

### Tests
- Create: `src/types/__tests__/payloads.test.ts`
- Create: `src/lib/__tests__/db.test.ts`

---

## Tasks

### Task 1: Initialize Next.js Project with Cloudflare Adapter

**Files:**
- Create: `package.json`, `next.config.ts`, `wrangler.toml`, `open-next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `.gitignore`, `.dev.vars`, `vitest.config.ts`

- [ ] **Step 1: Scaffold project with create-cloudflare**

```powershell
cd "C:\IA\P12\01. Automações Ativas\flow-p12"
npm create cloudflare@latest . -- --framework=next --no-deploy
```

When prompted: TypeScript=yes, App Router=yes, Git=skip (already initialized), deploy=no.

Expected: creates `package.json`, `next.config.ts`, `wrangler.toml`, `tsconfig.json`, `open-next.config.ts`.

- [ ] **Step 2: Install UI + flow + auth dependencies**

```powershell
npm install @clerk/nextjs @xyflow/react lucide-react clsx tailwind-merge zod
npm install @radix-ui/react-dropdown-menu @radix-ui/react-tooltip @radix-ui/react-dialog @radix-ui/react-separator
```

- [ ] **Step 3: Install dev dependencies**

```powershell
npm install -D vitest @vitejs/plugin-react @cloudflare/workers-types @cloudflare/vitest-pool-workers
```

- [ ] **Step 4: Configure `open-next.config.ts`**

Overwrite `open-next.config.ts`:
```typescript
import type { OpenNextConfig } from "@opennextjs/cloudflare";

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
    },
  },
};

export default config;
```

- [ ] **Step 5: Configure `wrangler.toml`**

Overwrite `wrangler.toml`:
```toml
name = "flow-p12"
main = ".open-next/worker.js"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

assets = { directory = ".open-next/assets", binding = "ASSETS" }

[[d1_databases]]
binding = "DB"
database_name = "flow-p12-db"
database_id = "placeholder-replace-after-wrangler-d1-create"

[[r2_buckets]]
binding = "R2"
bucket_name = "flow-p12-images"

[[kv_namespaces]]
binding = "KV"
id = "placeholder-replace-after-wrangler-kv-create"

[vars]
NODE_ENV = "production"

[dev]
port = 8788
```

- [ ] **Step 6: Configure `next.config.ts`**

Overwrite `next.config.ts`:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 7: Configure `tailwind.config.ts`**

Overwrite `tailwind.config.ts`:
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#a855f7",
        layout: "#3b82f6",
        "node-text": "#84cc16",
        "node-image": "#9ca3af",
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 8: Configure `vitest.config.ts`**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 9: Update `tsconfig.json` to include Workers types**

In `tsconfig.json`, add `"@cloudflare/workers-types"` to `compilerOptions.types`:
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] },
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 10: Update `.gitignore`**

Add at bottom of `.gitignore`:
```
.open-next/
.dev.vars
.wrangler/
*.local
```

- [ ] **Step 11: Create `.dev.vars`**

Create `.dev.vars` (this file is NOT committed — contains secrets):
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_replace_me
CLERK_SECRET_KEY=sk_test_replace_me
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
FAL_API_KEY=replace_me
LUMA_API_KEY=replace_me
OPENAI_API_KEY=replace_me
ANTHROPIC_API_KEY=replace_me
WHATFONTIS_API_KEY=replace_me
```

- [ ] **Step 12: Add scripts to `package.json`**

Merge into `scripts` in `package.json`:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "cf:build": "opennextjs-cloudflare build",
    "cf:preview": "opennextjs-cloudflare build && wrangler dev",
    "cf:deploy": "opennextjs-cloudflare build && wrangler deploy",
    "db:create": "wrangler d1 create flow-p12-db",
    "db:migrate": "wrangler d1 migrations apply flow-p12-db",
    "db:migrate:local": "wrangler d1 migrations apply flow-p12-db --local",
    "kv:create": "wrangler kv namespace create flow-p12-kv",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 13: Verify dev server starts**

```powershell
npm run dev
```

Expected: `✓ Ready on http://localhost:3000` with no TypeScript errors.

- [ ] **Step 14: Commit**

```powershell
git add .
git commit -m "feat: scaffold Next.js 15 + Cloudflare adapter, tailwind, vitest"
```

---

### Task 2: Shared TypeScript Types

**Files:**
- Create: `src/types/index.ts`
- Create: `src/types/__tests__/payloads.test.ts`

All canvas nodes, workers, and API routes share these types. Defining them first prevents drift between layers.

- [ ] **Step 1: Write failing test**

Create `src/types/__tests__/payloads.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import type {
  BrandPayload,
  LayoutPayload,
  TextPayload,
  ConnectionType,
  NodeType,
  Pipeline,
  ControlType,
  TechMode,
  InjectionRequest,
  RoutingDecision,
  GenerationRequest,
} from "../index";

describe("BrandPayload", () => {
  it("accepts full payload with all toggles and resolved data", () => {
    const payload: BrandPayload = {
      clientId: "client-123",
      clientName: "Padaria do Bairro",
      toggles: {
        applyPalette: true,
        applyTypography: true,
        applyBrandTone: true,
        applyArtRefs: false,
      },
      palette: ["#8B4513", "#F4D03F"],
      typography: { primary: "Bree Serif", secondary: "Inter" },
      brandTone: "rústico e artesanal",
    };
    expect(payload.clientId).toBe("client-123");
    expect(payload.toggles.applyPalette).toBe(true);
    expect(payload.toggles.applyArtRefs).toBe(false);
    expect(payload.palette).toHaveLength(2);
  });

  it("accepts minimal payload without resolved data (pre-execution state)", () => {
    const payload: BrandPayload = {
      clientId: "client-456",
      clientName: "Test Brand",
      toggles: {
        applyPalette: false,
        applyTypography: false,
        applyBrandTone: false,
        applyArtRefs: false,
      },
    };
    expect(payload.palette).toBeUndefined();
    expect(payload.artRefs).toBeUndefined();
  });
});

describe("LayoutPayload", () => {
  it("accepts all valid techMode values", () => {
    const modes: TechMode[] = ["auto", "force_inspiration", "force_strict"];
    const payloads: LayoutPayload[] = modes.map((techMode) => ({
      image: "https://example.com/layout.jpg",
      fidelity: 70,
      techMode,
      controlType: "depth",
    }));
    expect(payloads).toHaveLength(3);
    expect(payloads[0].techMode).toBe("auto");
  });

  it("accepts all valid controlType values", () => {
    const types: ControlType[] = ["canny", "depth", "mlsd", "openpose"];
    expect(types).toHaveLength(4);
  });
});

describe("TextPayload", () => {
  it("accepts full structured copy payload", () => {
    const payload: TextPayload = {
      mainPrompt: "Banner promocional de pizza",
      headline: "Promoção Insana",
      subhead: "Toda pizza pela metade do preço",
      cta: "Peça já no WhatsApp",
      disclaimer: "Válido até 15/05",
    };
    expect(payload.headline).toBe("Promoção Insana");
    expect(payload.composedPrompt).toBeUndefined();
  });

  it("accepts minimal payload with only mainPrompt", () => {
    const payload: TextPayload = { mainPrompt: "Simple banner" };
    expect(payload.cta).toBeUndefined();
    expect(payload.disclaimer).toBeUndefined();
  });
});

describe("ConnectionType", () => {
  it("covers all 5 edge color types", () => {
    const types: ConnectionType[] = ["text", "image", "brand", "layout", "output"];
    expect(types).toHaveLength(5);
  });
});

describe("NodeType", () => {
  it("covers all 11 node types for MVP", () => {
    const types: NodeType[] = [
      "Text", "ImageInput", "BrandID", "ImageLayout",
      "Generate", "Edit", "StyleTransfer", "ConsistencyPack",
      "Upscale", "PromptAgent", "Output",
    ];
    expect(types).toHaveLength(11);
  });
});

describe("Pipeline", () => {
  it("covers standard + all 4 ControlNet variants", () => {
    const pipelines: Pipeline[] = [
      "standard",
      "controlnet-canny",
      "controlnet-depth",
      "controlnet-mlsd",
      "controlnet-openpose",
    ];
    expect(pipelines).toHaveLength(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```powershell
npx vitest run src/types/__tests__/payloads.test.ts
```

Expected: FAIL — `Cannot find module '../index'`

- [ ] **Step 3: Create `src/types/index.ts`**

```typescript
export type ConnectionType = "text" | "image" | "brand" | "layout" | "output";

export type ControlType = "canny" | "depth" | "mlsd" | "openpose";

export type TechMode = "auto" | "force_inspiration" | "force_strict";

export type Pipeline =
  | "standard"
  | "controlnet-canny"
  | "controlnet-depth"
  | "controlnet-mlsd"
  | "controlnet-openpose";

export type NodeType =
  | "Text"
  | "ImageInput"
  | "BrandID"
  | "ImageLayout"
  | "Generate"
  | "Edit"
  | "StyleTransfer"
  | "ConsistencyPack"
  | "Upscale"
  | "PromptAgent"
  | "Output";

export type UserRole = "super_admin" | "admin" | "member";

export type PreferredProvider = "gpt-image-2" | "nano-banana-2" | "luma";

export interface BrandPayload {
  clientId: string;
  clientName: string;
  toggles: {
    applyPalette: boolean;
    applyTypography: boolean;
    applyBrandTone: boolean;
    applyArtRefs: boolean;
  };
  palette?: string[];
  typography?: { primary: string; secondary: string };
  brandTone?: string;
  artRefs?: string[];
}

export interface LayoutPayload {
  image: string;
  fidelity: number;
  techMode: TechMode;
  controlType: ControlType;
}

export interface TextPayload {
  mainPrompt: string;
  headline?: string;
  subhead?: string;
  cta?: string;
  disclaimer?: string;
  composedPrompt?: string;
}

export interface InjectionRequest {
  nodeId: string;
  originalPrompt: string;
  brandPayload?: BrandPayload;
  layoutPayload?: LayoutPayload;
  textPayload: TextPayload;
  nodeType: NodeType;
}

export interface RoutingDecision {
  provider: string;
  model: string;
  params: Record<string, unknown>;
  notes?: string;
}

export interface GenerationRequest {
  nodeId: string;
  nodeType: Extract<
    NodeType,
    "Generate" | "Edit" | "StyleTransfer" | "ConsistencyPack" | "Upscale"
  >;
  textPayload: TextPayload;
  brandPayload?: BrandPayload;
  layoutPayload?: LayoutPayload;
  preferredProvider?: PreferredProvider;
}

export interface Client {
  id: string;
  orgId: string;
  name: string;
  logoR2Key?: string;
  palette?: string[];
  typography?: { primary: string; secondary: string };
  brandTone?: string;
  artRefs?: string[];
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export interface Workflow {
  id: string;
  orgId: string;
  name: string;
  graphJson: string;
  migratedToV4: boolean;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export interface GeneratedImage {
  id: string;
  orgId: string;
  workflowId?: string;
  r2Key: string;
  pipeline?: Pipeline;
  textPayloadJson?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
  createdBy: string;
}

export interface StructureCacheEntry {
  id: string;
  imageHash: string;
  controlType: ControlType;
  r2Key: string;
  orgId?: string;
  createdAt: number;
  lastUsedAt: number;
}
```

- [ ] **Step 4: Run test to verify it passes**

```powershell
npx vitest run src/types/__tests__/payloads.test.ts
```

Expected: PASS — all tests green

- [ ] **Step 5: Commit**

```powershell
git add src/types/
git commit -m "feat: add shared TypeScript types for all canvas nodes, payloads, and routing"
```

---

### Task 3: D1 Database Schema Migration

**Files:**
- Create: `migrations/0001_initial_schema.sql`

- [ ] **Step 1: Create migration file**

Create `migrations/0001_initial_schema.sql`:
```sql
-- Organizations (synced from Clerk)
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Users (synced from Clerk)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  org_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id);

-- Clients (brand identities — cadastrado na tela /clients)
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_r2_key TEXT,
  palette_json TEXT,       -- JSON: string[] of hex colors
  typography_json TEXT,    -- JSON: { primary: string, secondary: string }
  brand_tone TEXT,
  art_refs_json TEXT,      -- JSON: string[] of R2 keys
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(org_id);

-- Client shares (sharing brand identities with other orgs)
CREATE TABLE IF NOT EXISTS client_shares (
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  shared_with_org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  shared_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  PRIMARY KEY (client_id, shared_with_org_id)
);

-- Workflows (React Flow canvas state — graph_json stores nodes + edges)
CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  graph_json TEXT NOT NULL DEFAULT '{}',
  migrated_to_v4 INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_workflows_org ON workflows(org_id);
CREATE INDEX IF NOT EXISTS idx_workflows_created_by ON workflows(created_by);

-- Generated images (outputs from AI nodes)
CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workflow_id TEXT REFERENCES workflows(id) ON DELETE SET NULL,
  r2_key TEXT NOT NULL,
  pipeline TEXT,           -- 'standard' | 'controlnet-canny' | 'controlnet-depth' | etc.
  text_payload_json TEXT,  -- TextPayload as JSON (for gallery search)
  metadata_json TEXT,      -- provider response metadata
  created_at INTEGER DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_images_org ON images(org_id);
CREATE INDEX IF NOT EXISTS idx_images_workflow ON images(workflow_id);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at);

-- ControlNet structure cache metadata (actual data in KV + R2)
-- Cache miss: ~$0.005, cache hit: $0. TTL: 30 days.
CREATE TABLE IF NOT EXISTS structure_cache (
  id TEXT PRIMARY KEY,
  image_hash TEXT NOT NULL,
  control_type TEXT NOT NULL,  -- 'canny' | 'depth' | 'mlsd' | 'openpose'
  r2_key TEXT NOT NULL,
  org_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  last_used_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(image_hash, control_type)
);
CREATE INDEX IF NOT EXISTS idx_structure_hash ON structure_cache(image_hash);

-- Audit log (compliance + debugging)
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata_json TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_log(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_log(created_at);
```

- [ ] **Step 2: Create D1 database on Cloudflare**

```powershell
npx wrangler d1 create flow-p12-db
```

Expected output contains:
```
✅ Created database 'flow-p12-db'
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Copy the `database_id` and update `wrangler.toml` — replace `placeholder-replace-after-wrangler-d1-create` with the actual ID.

- [ ] **Step 3: Create KV namespace**

```powershell
npx wrangler kv namespace create flow-p12-kv
```

Expected output contains:
```
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

Copy the `id` and update `wrangler.toml` — replace `placeholder-replace-after-wrangler-kv-create` with the actual ID.

- [ ] **Step 4: Create R2 bucket**

```powershell
npx wrangler r2 bucket create flow-p12-images
```

Expected: `Created bucket flow-p12-images`

- [ ] **Step 5: Apply migration locally**

```powershell
npx wrangler d1 migrations apply flow-p12-db --local
```

Expected: `✅ Applied 1 migration`

- [ ] **Step 6: Verify schema**

```powershell
npx wrangler d1 execute flow-p12-db --local --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
```

Expected output lists all 8 tables:
```
audit_log, client_shares, clients, images, organizations, structure_cache, users, workflows
```

- [ ] **Step 7: Commit**

```powershell
git add migrations/ wrangler.toml
git commit -m "feat: add D1 schema with all 8 tables + R2 bucket + KV namespace"
```

---

### Task 4: Environment Validation + Cloudflare Bindings

**Files:**
- Create: `src/env.ts`
- Create: `src/lib/cloudflare.ts`

- [ ] **Step 1: Create `src/env.ts`**

```typescript
import { z } from "zod";

const serverSchema = z.object({
  CLERK_SECRET_KEY: z.string().min(1),
  FAL_API_KEY: z.string().min(1).optional(),
  LUMA_API_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  WHATFONTIS_API_KEY: z.string().min(1).optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default("/sign-in"),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default("/sign-up"),
});

export const serverEnv = serverSchema.parse({
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  FAL_API_KEY: process.env.FAL_API_KEY,
  LUMA_API_KEY: process.env.LUMA_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  WHATFONTIS_API_KEY: process.env.WHATFONTIS_API_KEY,
});

export const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
});
```

- [ ] **Step 2: Create `src/lib/cloudflare.ts`**

```typescript
import type { D1Database, KVNamespace, R2Bucket } from "@cloudflare/workers-types";

export interface CloudflareEnv {
  DB: D1Database;
  R2: R2Bucket;
  KV: KVNamespace;
}

export function getCloudflareBindings(): CloudflareEnv {
  const ctx = (globalThis as unknown as { __ENV__?: CloudflareEnv }).__ENV__;
  if (!ctx) {
    throw new Error(
      "Cloudflare bindings not available — ensure running in Workers context"
    );
  }
  return ctx;
}
```

- [ ] **Step 3: Verify TypeScript**

```powershell
npm run typecheck
```

Expected: No errors. If `@cloudflare/workers-types` conflicts appear, ensure `tsconfig.json` has `"types": ["@cloudflare/workers-types"]`.

- [ ] **Step 4: Commit**

```powershell
git add src/env.ts src/lib/cloudflare.ts
git commit -m "feat: add env validation (Zod) and Cloudflare bindings accessor"
```

---

### Task 5: Infra Helper Utilities (D1 / R2 / KV)

**Files:**
- Create: `src/lib/db.ts`
- Create: `src/lib/r2.ts`
- Create: `src/lib/kv.ts`
- Create: `src/lib/__tests__/db.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/__tests__/db.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { generateId, buildPipelineKey } from "../db";

describe("generateId", () => {
  it("returns a non-empty string", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("returns unique values on each call", () => {
    const ids = Array.from({ length: 10 }, generateId);
    const unique = new Set(ids);
    expect(unique.size).toBe(10);
  });

  it("returns UUID v4 format", () => {
    const id = generateId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });
});

describe("buildPipelineKey", () => {
  it("returns standard for no controlType", () => {
    expect(buildPipelineKey()).toBe("standard");
  });

  it("returns controlnet-canny for canny controlType", () => {
    expect(buildPipelineKey("canny")).toBe("controlnet-canny");
  });

  it("returns controlnet-depth for depth controlType", () => {
    expect(buildPipelineKey("depth")).toBe("controlnet-depth");
  });

  it("covers all four ControlNet types", () => {
    const types = ["canny", "depth", "mlsd", "openpose"] as const;
    types.forEach((t) => {
      expect(buildPipelineKey(t)).toBe(`controlnet-${t}`);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```powershell
npx vitest run src/lib/__tests__/db.test.ts
```

Expected: FAIL — `Cannot find module '../db'`

- [ ] **Step 3: Create `src/lib/db.ts`**

```typescript
import type { ControlType, Pipeline } from "@/types";

export function generateId(): string {
  return crypto.randomUUID();
}

export function buildPipelineKey(controlType?: ControlType): Pipeline {
  if (!controlType) return "standard";
  return `controlnet-${controlType}`;
}

export async function findOrCreateOrg(
  db: import("@cloudflare/workers-types").D1Database,
  orgId: string,
  name: string
): Promise<void> {
  await db
    .prepare("INSERT OR IGNORE INTO organizations (id, name) VALUES (?, ?)")
    .bind(orgId, name)
    .run();
}

export async function findOrCreateUser(
  db: import("@cloudflare/workers-types").D1Database,
  userId: string,
  email: string,
  orgId: string,
  role: "super_admin" | "admin" | "member" = "member"
): Promise<void> {
  await db
    .prepare(
      "INSERT OR REPLACE INTO users (id, email, org_id, role, updated_at) VALUES (?, ?, ?, ?, unixepoch())"
    )
    .bind(userId, email, orgId, role)
    .run();
}
```

- [ ] **Step 4: Create `src/lib/r2.ts`**

```typescript
export function buildR2Key(
  orgId: string,
  type: "image" | "logo" | "art-ref" | "structure",
  filename: string
): string {
  return `${orgId}/${type}/${filename}`;
}

export async function uploadToR2(
  r2: import("@cloudflare/workers-types").R2Bucket,
  key: string,
  data: ArrayBuffer | Blob,
  contentType: string = "image/png"
): Promise<string> {
  await r2.put(key, data, { httpMetadata: { contentType } });
  return key;
}

export async function getFromR2(
  r2: import("@cloudflare/workers-types").R2Bucket,
  key: string
): Promise<ArrayBuffer | null> {
  const obj = await r2.get(key);
  if (!obj) return null;
  return obj.arrayBuffer();
}
```

- [ ] **Step 5: Create `src/lib/kv.ts`**

```typescript
export async function getFromKV<T>(
  kv: import("@cloudflare/workers-types").KVNamespace,
  key: string
): Promise<T | null> {
  const raw = await kv.get(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as unknown as T;
  }
}

export async function setInKV(
  kv: import("@cloudflare/workers-types").KVNamespace,
  key: string,
  value: unknown,
  ttlSeconds?: number
): Promise<void> {
  const serialized =
    typeof value === "string" ? value : JSON.stringify(value);
  await kv.put(
    key,
    serialized,
    ttlSeconds ? { expirationTtl: ttlSeconds } : undefined
  );
}

export async function getOrSet<T>(
  kv: import("@cloudflare/workers-types").KVNamespace,
  key: string,
  factory: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  const cached = await getFromKV<T>(kv, key);
  if (cached !== null) return cached;
  const value = await factory();
  await setInKV(kv, key, value, ttlSeconds);
  return value;
}

export function buildStructureCacheKey(
  imageHash: string,
  controlType: string
): string {
  return `structure:${controlType}:${imageHash}`;
}
```

- [ ] **Step 6: Run tests to verify they pass**

```powershell
npx vitest run src/lib/__tests__/db.test.ts
```

Expected: PASS — all 7 tests green

- [ ] **Step 7: Commit**

```powershell
git add src/lib/
git commit -m "feat: add D1/R2/KV typed helpers — generateId, buildPipelineKey, buildR2Key, getOrSet"
```

---

### Task 6: Clerk Auth + Middleware

**Files:**
- Create: `src/middleware.ts`
- Create: `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`
- Create: `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`

- [ ] **Step 1: Create `src/middleware.ts`**

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/health",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

- [ ] **Step 2: Create sign-in page**

Create `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`:
```typescript
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-gray-900 border border-gray-800 shadow-2xl",
            headerTitle: "text-white",
            headerSubtitle: "text-gray-400",
            socialButtonsBlockButton:
              "bg-gray-800 border-gray-700 text-white hover:bg-gray-700",
            formFieldLabel: "text-gray-300",
            formFieldInput: "bg-gray-800 border-gray-700 text-white",
            footerActionLink: "text-purple-400 hover:text-purple-300",
          },
        }}
      />
    </div>
  );
}
```

- [ ] **Step 3: Create sign-up page**

Create `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`:
```typescript
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-gray-900 border border-gray-800 shadow-2xl",
            headerTitle: "text-white",
            headerSubtitle: "text-gray-400",
            socialButtonsBlockButton:
              "bg-gray-800 border-gray-700 text-white hover:bg-gray-700",
            formFieldLabel: "text-gray-300",
            formFieldInput: "bg-gray-800 border-gray-700 text-white",
            footerActionLink: "text-purple-400 hover:text-purple-300",
          },
        }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Create `src/app/layout.tsx`**

```typescript
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flow P12 — AI Brand Studio",
  description:
    "Canvas de geração de imagens com IA e Brand ID plugável. Identidade visual como nó conectável.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="pt-BR" className="dark">
        <body className="bg-gray-950 text-white antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
```

- [ ] **Step 5: Create `src/app/page.tsx`**

```typescript
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/dashboard");
}
```

- [ ] **Step 6: Create `src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    border-color: theme("colors.gray.800");
  }
}

@layer utilities {
  .edge-text { --edge-color: #84cc16; }
  .edge-image { --edge-color: #9ca3af; }
  .edge-brand { --edge-color: #a855f7; }
  .edge-layout { --edge-color: #3b82f6; }
}
```

- [ ] **Step 7: Verify auth pages render**

```powershell
npm run dev
```

Open `http://localhost:3000/sign-in`. Expected: Clerk sign-in form with dark theme renders correctly.
Open `http://localhost:3000/dashboard` without signing in. Expected: redirect to sign-in.

- [ ] **Step 8: Commit**

```powershell
git add src/middleware.ts src/app/
git commit -m "feat: add Clerk auth middleware, sign-in/up pages, ClerkProvider in root layout"
```

---

### Task 7: App Shell — Navigation + Dashboard + Stub Routes

**Files:**
- Create: `src/components/nav/Navbar.tsx`
- Create: `src/app/(app)/layout.tsx`
- Create: `src/app/(app)/dashboard/page.tsx`
- Create: `src/app/(app)/canvas/page.tsx`
- Create: `src/app/(app)/clients/page.tsx`
- Create: `src/app/(app)/gallery/page.tsx`
- Create: `src/app/(app)/settings/page.tsx`

- [ ] **Step 1: Create `src/components/nav/Navbar.tsx`**

```typescript
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Workflow,
  Users,
  Image,
  Settings,
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/canvas", label: "Canvas", icon: Workflow },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/gallery", label: "Galeria", icon: Image },
  { href: "/settings", label: "Config", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="h-14 border-b border-gray-800 bg-gray-900 flex items-center px-4 gap-6 shrink-0">
      <Link href="/dashboard" className="flex items-center gap-2 mr-4">
        <span className="w-6 h-6 rounded bg-purple-500 flex items-center justify-center text-white text-xs font-bold">
          F
        </span>
        <span className="text-white font-bold text-sm tracking-tight">
          Flow P12
        </span>
      </Link>

      <div className="flex items-center gap-1 flex-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              pathname.startsWith(href)
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800/50"
            )}
          >
            <Icon size={15} />
            {label}
          </Link>
        ))}
      </div>

      <UserButton
        appearance={{ elements: { avatarBox: "w-8 h-8" } }}
      />
    </nav>
  );
}
```

- [ ] **Step 2: Create `src/app/(app)/layout.tsx`**

```typescript
import { Navbar } from "@/components/nav/Navbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-auto bg-gray-950">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/app/(app)/dashboard/page.tsx`**

```typescript
import { auth } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const { orgId } = await auth();

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
      <p className="text-gray-400 mb-8">
        Bem-vindo ao Flow P12. Crie seu primeiro workflow no Canvas.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Workflows" value="—" />
        <StatCard label="Clientes" value="—" />
        <StatCard label="Imagens geradas" value="—" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h2 className="text-white font-semibold mb-2">Começar</h2>
        <p className="text-gray-400 text-sm">
          1. Cadastre um cliente em{" "}
          <a href="/clients" className="text-purple-400 underline">
            Clientes
          </a>{" "}
          com paleta, fonte e tom visual.
          <br />
          2. Abra o{" "}
          <a href="/canvas" className="text-purple-400 underline">
            Canvas
          </a>{" "}
          e arraste os nós Text, Brand ID e Generate.
          <br />
          3. Conecte e execute para gerar sua primeira imagem.
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-white text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
```

- [ ] **Step 4: Create stub routes**

Create `src/app/(app)/canvas/page.tsx`:
```typescript
export default function CanvasPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-2">Canvas</h1>
      <p className="text-gray-400">Em desenvolvimento — Plan 2</p>
    </div>
  );
}
```

Create `src/app/(app)/clients/page.tsx`:
```typescript
export default function ClientsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-2">Clientes</h1>
      <p className="text-gray-400">Em desenvolvimento — Plan 4</p>
    </div>
  );
}
```

Create `src/app/(app)/gallery/page.tsx`:
```typescript
export default function GalleryPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-2">Galeria</h1>
      <p className="text-gray-400">Em desenvolvimento — Plan 3</p>
    </div>
  );
}
```

Create `src/app/(app)/settings/page.tsx`:
```typescript
export default function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-2">Configurações</h1>
      <p className="text-gray-400">Em desenvolvimento — Plan 3</p>
    </div>
  );
}
```

- [ ] **Step 5: Verify full navigation flow**

```powershell
npm run dev
```

Manually verify:
- Sign in at `http://localhost:3000/sign-in`
- Redirect to `/dashboard` — 3 stat cards + getting-started block visible
- All 5 nav links navigate correctly
- UserButton visible top-right
- Dark theme throughout (gray-950 bg, gray-900 cards, purple accent)

- [ ] **Step 6: Commit**

```powershell
git add src/components/ src/app/(app)/
git commit -m "feat: add dark-themed app shell — Navbar, dashboard, and stub routes"
```

---

### Task 8: Health Check API + TypeScript Verification

**Files:**
- Create: `src/app/api/health/route.ts`

- [ ] **Step 1: Create health endpoint**

Create `src/app/api/health/route.ts`:
```typescript
export const runtime = "edge";

export async function GET() {
  return Response.json({
    status: "ok",
    version: "4.0.0",
    timestamp: new Date().toISOString(),
  });
}
```

- [ ] **Step 2: Test health endpoint**

```powershell
npm run dev
```

In a second terminal:
```powershell
Invoke-RestMethod http://localhost:3000/api/health | ConvertTo-Json
```

Expected:
```json
{
  "status": "ok",
  "version": "4.0.0",
  "timestamp": "2026-05-10T..."
}
```

- [ ] **Step 3: Run full test suite**

```powershell
npm run test
```

Expected: All tests pass (types tests + db tests)

- [ ] **Step 4: TypeScript check**

```powershell
npm run typecheck
```

Expected: No errors

- [ ] **Step 5: Final commit**

```powershell
git add src/app/api/
git commit -m "feat: add /api/health edge endpoint — Plan 1 complete"
```

---

## Self-Review

### Spec Coverage Check

| PRD / Architecture Requirement | Task | Status |
|---|---|---|
| Next.js 15 App Router on Cloudflare Pages | Task 1 | ✅ |
| OpenNext adapter (`@opennextjs/cloudflare`) | Task 1 | ✅ |
| Clerk Organizations for multi-tenant auth | Task 6 | ✅ |
| Clerk roles: super_admin / admin / member | Task 2 (`UserRole` type), Task 3 (DB `role` column) | ✅ |
| D1 schema: organizations | Task 3 | ✅ |
| D1 schema: users | Task 3 | ✅ |
| D1 schema: clients (paleta, fonte, tom, refs) | Task 3 | ✅ |
| D1 schema: client_shares | Task 3 | ✅ |
| D1 schema: workflows (graph_json, migrated_to_v4) | Task 3 | ✅ |
| D1 schema: images (pipeline column — v4 addition) | Task 3 | ✅ |
| D1 schema: structure_cache (v4 ControlNet cache) | Task 3 | ✅ |
| D1 schema: audit_log | Task 3 | ✅ |
| R2 bucket for image storage | Task 3 | ✅ |
| KV namespace for cache | Task 3 | ✅ |
| TypeScript: BrandPayload with toggles | Task 2 | ✅ |
| TypeScript: LayoutPayload (fidelity, techMode, controlType) | Task 2 | ✅ |
| TypeScript: TextPayload (mainPrompt + structured fields) | Task 2 | ✅ |
| TypeScript: ConnectionType (text/image/brand/layout/output) | Task 2 | ✅ |
| TypeScript: NodeType (all 11 MVP nodes) | Task 2 | ✅ |
| TypeScript: Pipeline (standard + 4 ControlNet variants) | Task 2 | ✅ |
| TypeScript: InjectionRequest, RoutingDecision, GenerationRequest | Task 2 | ✅ |
| Tailwind color tokens for edge types (brand=purple, layout=blue, text=green, image=gray) | Task 1 | ✅ |
| Dark theme (gray-950 base, gray-900 cards, purple accent) | Task 7 | ✅ |
| D1/R2/KV typed helpers | Task 5 | ✅ |
| `generateId()` for primary keys | Task 5 | ✅ |
| `buildPipelineKey()` for image tracking | Task 5 | ✅ |
| `getOrSet()` for KV caching pattern | Task 5 | ✅ |
| Health check API (edge) | Task 8 | ✅ |
| App shell: all 5 nav sections | Task 7 | ✅ |

### Placeholder Scan
- No TBD/TODO/fill-in placeholders in any task steps
- All code blocks are complete and runnable
- All commands have expected output

### Type Consistency
- `ControlType` defined Task 2 → used in `buildPipelineKey(controlType?: ControlType)` Task 5 ✅
- `Pipeline` defined Task 2 → return type of `buildPipelineKey()` Task 5 ✅  
- `BrandPayload.toggles` shape in Task 2 matches `InjectionRequest.brandPayload?.toggles` in Task 2 ✅
- `NodeType` used in `InjectionRequest.nodeType` and `GenerationRequest.nodeType` — consistent ✅
- `TechMode` used in `LayoutPayload.techMode` and test file — consistent ✅
