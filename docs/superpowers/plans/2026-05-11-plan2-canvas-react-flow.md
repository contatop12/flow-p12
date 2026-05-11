# Plan 2: Canvas — React Flow with Pluggable Nodes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the React Flow canvas with 5 MVP node types (Text, BrandID, ImageLayout, Generate, Output), typed color-coded connection validation, node palette, properties panel, and workflow save/load to D1.

**Architecture:** `/canvas` renders a 3-column layout: 200px node palette (left), flex-1 React Flow (center), 280px properties panel (right, hidden unless node selected), plus a bottom action bar. Handle IDs encode connection type (`text-out`, `brand-out`, `layout-out`, `image-out`). `isValidConnection` enforces type rules. Edges are styled by type (text=green, brand=purple, layout=blue, image=gray). Workflow graph JSON is persisted to D1 `workflows` table via `/api/workflows` CRUD. User identity (userId, orgId) is derived from the session email by `getUserContext()`.

**Tech Stack:** @xyflow/react v12, React 19, Next.js 15 App Router, Cloudflare D1, Vitest, TypeScript

---

## File Map

**New files:**
- `src/lib/user-context.ts` — derive userId/orgId from auth email
- `src/lib/__tests__/user-context.test.ts`
- `src/components/canvas/lib/connection.ts` — typed handle utilities + isValidConnection + EDGE_COLORS
- `src/components/canvas/lib/__tests__/connection.test.ts`
- `src/components/canvas/nodes/TextNode.tsx`
- `src/components/canvas/nodes/BrandIDNode.tsx`
- `src/components/canvas/nodes/ImageLayoutNode.tsx`
- `src/components/canvas/nodes/GenerateNode.tsx`
- `src/components/canvas/nodes/OutputNode.tsx`
- `src/components/canvas/nodes/index.ts`
- `src/components/canvas/edges/TypedEdge.tsx`
- `src/components/canvas/edges/index.ts`
- `src/components/canvas/NodePalette.tsx`
- `src/components/canvas/PropertiesPanel.tsx`
- `src/components/canvas/ActionBar.tsx`
- `src/app/(app)/canvas/CanvasClient.tsx`
- `src/app/api/workflows/route.ts` — GET list + POST create
- `src/app/api/workflows/[id]/route.ts` — GET + PUT + DELETE

**Modified files:**
- `src/app/(app)/canvas/page.tsx` — server wrapper (imports CanvasClient)

---

### Task 1: User context helper

Every authenticated API route needs a `userId` and `orgId` derived from the session email. This task creates that helper.

**Files:**
- Create: `src/lib/user-context.ts`
- Create: `src/lib/__tests__/user-context.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/lib/__tests__/user-context.test.ts
import { describe, it, expect } from "vitest";
import { emailToUserId, emailToOrgId, emailToOrgName } from "../user-context";

describe("emailToUserId", () => {
  it("converts email to deterministic user ID", () => {
    expect(emailToUserId("alice@acme.com")).toBe("user_alice_acme_com");
  });
  it("lowercases the result", () => {
    expect(emailToUserId("ALICE@ACME.COM")).toBe("user_alice_acme_com");
  });
  it("replaces all non-alphanumeric chars with underscore", () => {
    expect(emailToUserId("a+b@c.d")).toBe("user_a_b_c_d");
  });
});

describe("emailToOrgId", () => {
  it("uses domain as org base", () => {
    expect(emailToOrgId("alice@acme.com")).toBe("org_acme_com");
  });
  it("handles missing domain gracefully", () => {
    expect(emailToOrgId("noatsign")).toBe("org_noatsign");
  });
});

describe("emailToOrgName", () => {
  it("returns domain as org name", () => {
    expect(emailToOrgName("alice@acme.com")).toBe("acme.com");
  });
  it("returns full email when no @ sign", () => {
    expect(emailToOrgName("noatsign")).toBe("noatsign");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --reporter=verbose src/lib/__tests__/user-context.test.ts
```

Expected: FAIL — "emailToUserId is not a function"

- [ ] **Step 3: Implement user-context.ts**

```typescript
// src/lib/user-context.ts
import type { D1Database } from "@cloudflare/workers-types";
import { findOrCreateOrg, findOrCreateUser } from "./db";

export function emailToUserId(email: string): string {
  return "user_" + email.toLowerCase().replace(/[^a-z0-9]/g, "_");
}

export function emailToOrgId(email: string): string {
  const domain = email.includes("@") ? email.split("@")[1] : email;
  return "org_" + domain.toLowerCase().replace(/[^a-z0-9]/g, "_");
}

export function emailToOrgName(email: string): string {
  return email.includes("@") ? email.split("@")[1] : email;
}

export async function getUserContext(
  email: string,
  db: D1Database
): Promise<{ userId: string; orgId: string }> {
  const userId = emailToUserId(email);
  const orgId = emailToOrgId(email);
  const orgName = emailToOrgName(email);

  await findOrCreateOrg(db, orgId, orgName);
  await findOrCreateUser(db, userId, email, orgId, "super_admin");

  return { userId, orgId };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --reporter=verbose src/lib/__tests__/user-context.test.ts
```

Expected: 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/user-context.ts src/lib/__tests__/user-context.test.ts
git commit -m "feat: add getUserContext helper to derive userId/orgId from session email"
```

---

### Task 2: Connection type utilities and validation

Connection types are encoded in handle IDs (`text-out`, `brand-in`, etc). This task creates `isValidConnection` (used by React Flow) and `EDGE_COLORS` (used by edges).

**Files:**
- Create: `src/components/canvas/lib/connection.ts`
- Create: `src/components/canvas/lib/__tests__/connection.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/components/canvas/lib/__tests__/connection.test.ts
import { describe, it, expect } from "vitest";
import { getHandleType, isValidConnection, EDGE_COLORS } from "../connection";

describe("getHandleType", () => {
  it("extracts text from text-out", () => {
    expect(getHandleType("text-out")).toBe("text");
  });
  it("extracts brand from brand-out", () => {
    expect(getHandleType("brand-out")).toBe("brand");
  });
  it("extracts layout from layout-out", () => {
    expect(getHandleType("layout-out")).toBe("layout");
  });
  it("extracts image from image-out", () => {
    expect(getHandleType("image-out")).toBe("image");
  });
  it("returns null for null input", () => {
    expect(getHandleType(null)).toBeNull();
  });
  it("returns null for unknown prefix", () => {
    expect(getHandleType("unknown-out")).toBeNull();
  });
});

describe("isValidConnection", () => {
  it("allows text-out → text-in", () => {
    expect(isValidConnection({ source: "a", sourceHandle: "text-out", target: "b", targetHandle: "text-in" })).toBe(true);
  });
  it("allows brand-out → brand-in", () => {
    expect(isValidConnection({ source: "a", sourceHandle: "brand-out", target: "b", targetHandle: "brand-in" })).toBe(true);
  });
  it("allows layout-out → layout-in", () => {
    expect(isValidConnection({ source: "a", sourceHandle: "layout-out", target: "b", targetHandle: "layout-in" })).toBe(true);
  });
  it("allows image-out → image-in", () => {
    expect(isValidConnection({ source: "a", sourceHandle: "image-out", target: "b", targetHandle: "image-in" })).toBe(true);
  });
  it("allows image-out → src-in (Edit source input accepts image or layout)", () => {
    expect(isValidConnection({ source: "a", sourceHandle: "image-out", target: "b", targetHandle: "src-in" })).toBe(true);
  });
  it("allows layout-out → src-in", () => {
    expect(isValidConnection({ source: "a", sourceHandle: "layout-out", target: "b", targetHandle: "src-in" })).toBe(true);
  });
  it("blocks brand-out → text-in", () => {
    expect(isValidConnection({ source: "a", sourceHandle: "brand-out", target: "b", targetHandle: "text-in" })).toBe(false);
  });
  it("blocks text-out → brand-in", () => {
    expect(isValidConnection({ source: "a", sourceHandle: "text-out", target: "b", targetHandle: "brand-in" })).toBe(false);
  });
  it("blocks text-out → src-in (src only accepts image/layout)", () => {
    expect(isValidConnection({ source: "a", sourceHandle: "text-out", target: "b", targetHandle: "src-in" })).toBe(false);
  });
  it("blocks when sourceHandle is null", () => {
    expect(isValidConnection({ source: "a", sourceHandle: null, target: "b", targetHandle: "text-in" })).toBe(false);
  });
});

describe("EDGE_COLORS", () => {
  it("has correct color for text", () => {
    expect(EDGE_COLORS.text).toBe("#84cc16");
  });
  it("has correct color for brand", () => {
    expect(EDGE_COLORS.brand).toBe("#a855f7");
  });
  it("has correct color for layout", () => {
    expect(EDGE_COLORS.layout).toBe("#3b82f6");
  });
  it("has correct color for image", () => {
    expect(EDGE_COLORS.image).toBe("#9ca3af");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --reporter=verbose src/components/canvas/lib/__tests__/connection.test.ts
```

Expected: FAIL — "Cannot find module '../connection'"

- [ ] **Step 3: Implement connection.ts**

```typescript
// src/components/canvas/lib/connection.ts
import type { Connection } from "@xyflow/react";
import type { ConnectionType } from "@/types";

const VALID_TYPES = new Set<string>(["text", "image", "brand", "layout", "output"]);

export function getHandleType(handleId: string | null): ConnectionType | null {
  if (!handleId) return null;
  const prefix = handleId.split("-")[0];
  if (VALID_TYPES.has(prefix)) return prefix as ConnectionType;
  return null;
}

// Target handle → which source types it accepts
const TARGET_ACCEPTS: Record<string, ConnectionType[]> = {
  "text-in":   ["text"],
  "brand-in":  ["brand"],
  "layout-in": ["layout"],
  "image-in":  ["image"],
  "src-in":    ["image", "layout"],
};

export function isValidConnection(connection: Connection): boolean {
  const sourceType = getHandleType(connection.sourceHandle ?? null);
  if (!sourceType) return false;
  const accepted = TARGET_ACCEPTS[connection.targetHandle ?? ""] ?? [];
  return accepted.includes(sourceType);
}

export const EDGE_COLORS: Record<ConnectionType, string> = {
  text:   "#84cc16",
  image:  "#9ca3af",
  brand:  "#a855f7",
  layout: "#3b82f6",
  output: "#18181B",
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --reporter=verbose src/components/canvas/lib/__tests__/connection.test.ts
```

Expected: 16 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/canvas/lib/connection.ts src/components/canvas/lib/__tests__/connection.test.ts
git commit -m "feat: typed connection validation and edge color map for canvas"
```

---

### Task 3: TypedEdge + node types index

**Files:**
- Create: `src/components/canvas/edges/TypedEdge.tsx`
- Create: `src/components/canvas/edges/index.ts`
- Create: `src/components/canvas/nodes/index.ts` (empty map, filled in Tasks 4-6)

- [ ] **Step 1: Create TypedEdge**

```tsx
// src/components/canvas/edges/TypedEdge.tsx
"use client";
import { BaseEdge, getSmoothStepPath, type EdgeProps } from "@xyflow/react";
import type { ConnectionType } from "@/types";
import { EDGE_COLORS } from "../lib/connection";

type TypedEdgeData = { connectionType?: ConnectionType };

export function TypedEdge({
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data, selected,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });
  const d = (data ?? {}) as TypedEdgeData;
  const color = EDGE_COLORS[d.connectionType ?? "image"];

  return (
    <BaseEdge
      path={edgePath}
      style={{
        stroke: color,
        strokeWidth: selected ? 2.5 : 1.5,
        opacity: selected ? 1 : 0.75,
      }}
    />
  );
}
```

- [ ] **Step 2: Create edges/index.ts**

```typescript
// src/components/canvas/edges/index.ts
import { TypedEdge } from "./TypedEdge";
export const edgeTypes = { typed: TypedEdge };
```

- [ ] **Step 3: Create nodes/index.ts (placeholder — filled by Tasks 4-6)**

```typescript
// src/components/canvas/nodes/index.ts
// Node types are added here as they are implemented in Tasks 4, 5, and 6.
export const nodeTypes: Record<string, React.ComponentType<any>> = {};
```

- [ ] **Step 4: Commit**

```bash
git add src/components/canvas/edges/ src/components/canvas/nodes/index.ts
git commit -m "feat: TypedEdge component with color-coded connection types"
```

---

### Task 4: TextNode component

**Files:**
- Create: `src/components/canvas/nodes/TextNode.tsx`
- Modify: `src/components/canvas/nodes/index.ts`

- [ ] **Step 1: Create TextNode**

```tsx
// src/components/canvas/nodes/TextNode.tsx
"use client";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { clsx } from "clsx";

export type TextNodeData = {
  mainPrompt: string;
  headline?: string;
  subhead?: string;
  cta?: string;
  disclaimer?: string;
};

export function TextNode({ data, selected }: NodeProps) {
  const d = data as TextNodeData;

  return (
    <div className={clsx(
      "w-48 rounded-lg border bg-white shadow-sm text-left",
      selected && "ring-2 ring-[#18181B] ring-offset-1"
    )}>
      <div className="px-3 py-2 border-b flex items-center gap-1.5">
        <span className="text-xs">💬</span>
        <span className="text-xs font-semibold text-[#18181B]">Text</span>
      </div>
      <div className="px-3 py-2">
        <p className="text-xs text-[#52525B] line-clamp-2 leading-relaxed">
          {d.mainPrompt || (
            <span className="text-[#A1A1AA] italic">Prompt vazio…</span>
          )}
        </p>
        <div className="mt-1.5 flex gap-1 flex-wrap">
          {d.headline && (
            <span className="text-[10px] bg-[#F0FDF4] text-[#16A34A] rounded px-1 font-medium">H</span>
          )}
          {d.subhead && (
            <span className="text-[10px] bg-[#F0FDF4] text-[#16A34A] rounded px-1 font-medium">S</span>
          )}
          {d.cta && (
            <span className="text-[10px] bg-[#F0FDF4] text-[#16A34A] rounded px-1 font-medium">CTA</span>
          )}
          {d.disclaimer && (
            <span className="text-[10px] bg-[#F0FDF4] text-[#16A34A] rounded px-1 font-medium">D</span>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="text-out"
        style={{
          background: "#84cc16",
          border: "2px solid white",
          width: 10,
          height: 10,
          right: -6,
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Register in nodes/index.ts**

```typescript
// src/components/canvas/nodes/index.ts
import { TextNode } from "./TextNode";
export const nodeTypes: Record<string, React.ComponentType<any>> = {
  TextNode,
};
```

- [ ] **Step 3: Verify the project still type-checks**

```bash
npm run typecheck
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/canvas/nodes/TextNode.tsx src/components/canvas/nodes/index.ts
git commit -m "feat: TextNode canvas component with green text-out handle"
```

---

### Task 5: BrandIDNode component

**Files:**
- Create: `src/components/canvas/nodes/BrandIDNode.tsx`
- Modify: `src/components/canvas/nodes/index.ts`

- [ ] **Step 1: Create BrandIDNode**

```tsx
// src/components/canvas/nodes/BrandIDNode.tsx
"use client";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { clsx } from "clsx";

export type BrandIDNodeData = {
  clientId?: string;
  clientName?: string;
  palette?: string[];
  applyPalette: boolean;
  applyTypography: boolean;
  applyBrandTone: boolean;
  applyArtRefs: boolean;
};

export function BrandIDNode({ data, selected }: NodeProps) {
  const d = data as BrandIDNodeData;

  return (
    <div className={clsx(
      "w-52 rounded-lg border bg-white shadow-sm text-left",
      selected && "ring-2 ring-[#a855f7] ring-offset-1"
    )}>
      <div className="px-3 py-2 border-b flex items-center gap-1.5">
        <span className="text-xs">🎨</span>
        <span className="text-xs font-semibold text-[#18181B]">Brand ID</span>
      </div>
      <div className="px-3 py-2 space-y-1.5">
        <p className="text-xs font-medium text-[#18181B]">
          {d.clientName || (
            <span className="text-[#A1A1AA] italic">Selecionar cliente…</span>
          )}
        </p>
        {d.palette && d.palette.length > 0 && (
          <div className="flex gap-0.5">
            {d.palette.slice(0, 6).map((color) => (
              <span
                key={color}
                className="w-3 h-3 rounded-sm border border-white shadow-sm inline-block"
                style={{ background: color }}
              />
            ))}
          </div>
        )}
        <div className="flex gap-1 flex-wrap pt-0.5">
          <Toggle active={d.applyPalette} label="P" />
          <Toggle active={d.applyTypography} label="T" />
          <Toggle active={d.applyBrandTone} label="V" />
          <Toggle active={d.applyArtRefs} label="R" />
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="brand-out"
        style={{
          background: "#a855f7",
          border: "2px solid white",
          width: 10,
          height: 10,
          right: -6,
        }}
      />
    </div>
  );
}

function Toggle({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={clsx(
      "text-[10px] rounded px-1 font-medium",
      active
        ? "bg-[#F5F3FF] text-[#7C3AED]"
        : "bg-[#F5F4F1] text-[#A1A1AA]"
    )}>
      {label}
    </span>
  );
}
```

- [ ] **Step 2: Register in nodes/index.ts**

```typescript
// src/components/canvas/nodes/index.ts
import { TextNode } from "./TextNode";
import { BrandIDNode } from "./BrandIDNode";

export const nodeTypes: Record<string, React.ComponentType<any>> = {
  TextNode,
  BrandIDNode,
};
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/canvas/nodes/BrandIDNode.tsx src/components/canvas/nodes/index.ts
git commit -m "feat: BrandIDNode canvas component with purple brand-out handle and toggle display"
```

---

### Task 6: ImageLayoutNode component

**Files:**
- Create: `src/components/canvas/nodes/ImageLayoutNode.tsx`
- Modify: `src/components/canvas/nodes/index.ts`

- [ ] **Step 1: Create ImageLayoutNode**

```tsx
// src/components/canvas/nodes/ImageLayoutNode.tsx
"use client";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { clsx } from "clsx";

export type ImageLayoutNodeData = {
  imageUrl?: string;
  fidelity: number;
  techMode: "auto" | "force_inspiration" | "force_strict";
  controlType: "canny" | "depth" | "mlsd" | "openpose";
};

export function ImageLayoutNode({ data, selected }: NodeProps) {
  const d = data as ImageLayoutNodeData;
  const isControlNet =
    d.techMode === "force_strict" ||
    (d.techMode === "auto" && d.fidelity > 50);

  return (
    <div className={clsx(
      "w-52 rounded-lg border bg-white shadow-sm text-left",
      selected && "ring-2 ring-[#3b82f6] ring-offset-1"
    )}>
      <div className="px-3 py-2 border-b flex items-center gap-1.5">
        <span className="text-xs">📐</span>
        <span className="text-xs font-semibold text-[#18181B]">Image-Layout</span>
      </div>
      <div className="px-3 py-2 space-y-2">
        {d.imageUrl ? (
          <img
            src={d.imageUrl}
            alt="Layout reference"
            className="w-full h-20 object-cover rounded border"
          />
        ) : (
          <div className="w-full h-16 rounded border border-dashed border-[#E5E2DB] flex items-center justify-center">
            <p className="text-[10px] text-[#A1A1AA]">Arraste imagem</p>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#71717A]">Fidelidade</span>
          <span className="text-[10px] font-semibold text-[#18181B]">{d.fidelity}%</span>
        </div>
        {isControlNet && (
          <div className="flex items-center gap-1 bg-[#EFF6FF] rounded px-2 py-1">
            <span className="text-[10px] text-[#3b82f6] font-medium">⚙ ControlNet · {d.controlType}</span>
          </div>
        )}
      </div>
      {/* Image input handle (accepts image-out from ImageInput node) */}
      <Handle
        type="target"
        position={Position.Left}
        id="image-in"
        style={{
          background: "#9ca3af",
          border: "2px solid white",
          width: 10,
          height: 10,
          left: -6,
        }}
      />
      {/* Layout output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="layout-out"
        style={{
          background: "#3b82f6",
          border: "2px solid white",
          width: 10,
          height: 10,
          right: -6,
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Register in nodes/index.ts**

```typescript
// src/components/canvas/nodes/index.ts
import { TextNode } from "./TextNode";
import { BrandIDNode } from "./BrandIDNode";
import { ImageLayoutNode } from "./ImageLayoutNode";

export const nodeTypes: Record<string, React.ComponentType<any>> = {
  TextNode,
  BrandIDNode,
  ImageLayoutNode,
};
```

- [ ] **Step 3: Commit**

```bash
git add src/components/canvas/nodes/ImageLayoutNode.tsx src/components/canvas/nodes/index.ts
git commit -m "feat: ImageLayoutNode with fidelity display and ControlNet indicator"
```

---

### Task 7: GenerateNode + OutputNode

**Files:**
- Create: `src/components/canvas/nodes/GenerateNode.tsx`
- Create: `src/components/canvas/nodes/OutputNode.tsx`
- Modify: `src/components/canvas/nodes/index.ts`

- [ ] **Step 1: Create GenerateNode**

```tsx
// src/components/canvas/nodes/GenerateNode.tsx
"use client";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { clsx } from "clsx";

export type GenerateNodeData = {
  preferredProvider: "gpt-image-2" | "nano-banana-2" | "luma";
  aspectRatio: "1:1" | "16:9" | "9:16" | "4:3";
  status: "idle" | "running" | "done" | "error";
  outputImageUrl?: string;
  forcedPipeline?: string;
  estimatedCost?: number;
  onExecute?: () => void;
};

const PROVIDER_LABELS: Record<string, string> = {
  "gpt-image-2": "GPT-Image 2",
  "nano-banana-2": "Nano Banana",
  luma: "Luma UNI-1.1",
};

export function GenerateNode({ data, selected }: NodeProps) {
  const d = data as GenerateNodeData;

  return (
    <div className={clsx(
      "w-56 rounded-lg border bg-white shadow-sm text-left",
      selected && "ring-2 ring-[#18181B] ring-offset-1"
    )}>
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">✨</span>
          <span className="text-xs font-semibold text-[#18181B]">Generate</span>
        </div>
        {d.status === "running" && (
          <span className="text-[10px] text-[#71717A] animate-pulse">gerando…</span>
        )}
        {d.status === "done" && (
          <span className="text-[10px] text-[#16A34A]">✓</span>
        )}
        {d.status === "error" && (
          <span className="text-[10px] text-red-500">erro</span>
        )}
      </div>

      <div className="px-3 py-2 space-y-2">
        {d.outputImageUrl ? (
          <img
            src={d.outputImageUrl}
            alt="Generated"
            className="w-full h-28 object-cover rounded border"
          />
        ) : (
          <div className="w-full h-20 rounded border border-dashed border-[#E5E2DB] flex items-center justify-center">
            <p className="text-[10px] text-[#A1A1AA]">Sem saída ainda</p>
          </div>
        )}

        {d.forcedPipeline && (
          <div className="bg-[#FFF7ED] rounded px-2 py-1">
            <p className="text-[10px] text-[#EA580C]">⚠ {d.forcedPipeline}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#A1A1AA]">
            {PROVIDER_LABELS[d.preferredProvider] ?? d.preferredProvider}
          </span>
          {d.estimatedCost !== undefined && (
            <span className="text-[10px] text-[#71717A]">${d.estimatedCost.toFixed(3)}</span>
          )}
        </div>

        <button
          type="button"
          onClick={d.onExecute}
          disabled={d.status === "running"}
          className="w-full rounded bg-[#18181B] py-1.5 text-xs font-medium text-white hover:bg-[#27272A] disabled:opacity-40 transition-colors"
        >
          {d.status === "running" ? "Gerando…" : "▶ Executar"}
        </button>
      </div>

      {/* Input handles */}
      <Handle type="target" position={Position.Left} id="text-in"
        style={{ background: "#84cc16", border: "2px solid white", width: 10, height: 10, left: -6, top: "35%" }} />
      <Handle type="target" position={Position.Left} id="brand-in"
        style={{ background: "#a855f7", border: "2px solid white", width: 10, height: 10, left: -6, top: "55%" }} />
      <Handle type="target" position={Position.Left} id="layout-in"
        style={{ background: "#3b82f6", border: "2px solid white", width: 10, height: 10, left: -6, top: "75%" }} />

      {/* Output handle */}
      <Handle type="source" position={Position.Right} id="image-out"
        style={{ background: "#9ca3af", border: "2px solid white", width: 10, height: 10, right: -6 }} />
    </div>
  );
}
```

- [ ] **Step 2: Create OutputNode**

```tsx
// src/components/canvas/nodes/OutputNode.tsx
"use client";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { clsx } from "clsx";

export type OutputNodeData = {
  imageUrl?: string;
  savedToGallery?: boolean;
};

export function OutputNode({ data, selected }: NodeProps) {
  const d = data as OutputNodeData;

  return (
    <div className={clsx(
      "w-52 rounded-lg border bg-white shadow-sm text-left",
      selected && "ring-2 ring-[#18181B] ring-offset-1"
    )}>
      <div className="px-3 py-2 border-b flex items-center gap-1.5">
        <span className="text-xs">📤</span>
        <span className="text-xs font-semibold text-[#18181B]">Output</span>
        {d.savedToGallery && (
          <span className="ml-auto text-[10px] text-[#16A34A]">✓ Galeria</span>
        )}
      </div>
      <div className="px-3 py-2">
        {d.imageUrl ? (
          <div className="space-y-2">
            <img
              src={d.imageUrl}
              alt="Output"
              className="w-full rounded border object-cover"
              style={{ maxHeight: 180 }}
            />
            <a
              href={d.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-[10px] text-[#71717A] hover:text-[#18181B] transition-colors"
            >
              Abrir ↗
            </a>
          </div>
        ) : (
          <div className="w-full h-24 rounded border border-dashed border-[#E5E2DB] flex items-center justify-center">
            <p className="text-[10px] text-[#A1A1AA]">Aguardando imagem…</p>
          </div>
        )}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        id="image-in"
        style={{
          background: "#9ca3af",
          border: "2px solid white",
          width: 10,
          height: 10,
          left: -6,
        }}
      />
    </div>
  );
}
```

- [ ] **Step 3: Register all nodes in index.ts**

```typescript
// src/components/canvas/nodes/index.ts
import { TextNode } from "./TextNode";
import { BrandIDNode } from "./BrandIDNode";
import { ImageLayoutNode } from "./ImageLayoutNode";
import { GenerateNode } from "./GenerateNode";
import { OutputNode } from "./OutputNode";

export const nodeTypes: Record<string, React.ComponentType<any>> = {
  TextNode,
  BrandIDNode,
  ImageLayoutNode,
  GenerateNode,
  OutputNode,
};
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/components/canvas/nodes/GenerateNode.tsx src/components/canvas/nodes/OutputNode.tsx src/components/canvas/nodes/index.ts
git commit -m "feat: GenerateNode and OutputNode canvas components"
```

---

### Task 8: NodePalette (left sidebar)

The palette lists draggable node entries by category. Dragging onto the canvas creates a new node at the drop position.

**Files:**
- Create: `src/components/canvas/NodePalette.tsx`

- [ ] **Step 1: Create NodePalette**

```tsx
// src/components/canvas/NodePalette.tsx
"use client";

const PALETTE_CATEGORIES = [
  {
    label: "Dados",
    items: [
      { type: "TextNode",        icon: "💬", label: "Text" },
      { type: "BrandIDNode",     icon: "🎨", label: "Brand ID" },
      { type: "ImageLayoutNode", icon: "📐", label: "Image-Layout" },
    ],
  },
  {
    label: "Geração",
    items: [
      { type: "GenerateNode", icon: "✨", label: "Generate" },
    ],
  },
  {
    label: "Output",
    items: [
      { type: "OutputNode", icon: "📤", label: "Output" },
    ],
  },
];

export function NodePalette() {
  function onDragStart(e: React.DragEvent, nodeType: string) {
    e.dataTransfer.setData("application/reactflow", nodeType);
    e.dataTransfer.effectAllowed = "move";
  }

  return (
    <aside className="w-[200px] shrink-0 border-r bg-white overflow-y-auto flex flex-col">
      <div className="px-3 py-2.5 border-b">
        <p className="text-[10px] font-semibold text-[#A1A1AA] uppercase tracking-widest">Nós</p>
      </div>
      <div className="flex flex-col gap-0 py-2">
        {PALETTE_CATEGORIES.map((cat) => (
          <div key={cat.label}>
            <p className="px-3 py-1.5 text-[10px] font-semibold text-[#A1A1AA] uppercase tracking-widest">
              {cat.label}
            </p>
            {cat.items.map((item) => (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => onDragStart(e, item.type)}
                className="mx-2 mb-0.5 flex items-center gap-2 px-2 py-1.5 rounded cursor-grab hover:bg-[#F5F4F1] active:cursor-grabbing select-none"
              >
                <span className="text-sm">{item.icon}</span>
                <span className="text-xs text-[#52525B]">{item.label}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/canvas/NodePalette.tsx
git commit -m "feat: NodePalette sidebar with draggable node items by category"
```

---

### Task 9: PropertiesPanel (right sidebar)

When a node is selected, the right panel shows editable fields for that node type.

**Files:**
- Create: `src/components/canvas/PropertiesPanel.tsx`

- [ ] **Step 1: Create PropertiesPanel**

```tsx
// src/components/canvas/PropertiesPanel.tsx
"use client";
import type { Node } from "@xyflow/react";
import type { TextNodeData } from "./nodes/TextNode";
import type { BrandIDNodeData } from "./nodes/BrandIDNode";
import type { ImageLayoutNodeData } from "./nodes/ImageLayoutNode";
import type { GenerateNodeData } from "./nodes/GenerateNode";

type PanelProps = {
  node: Node | null;
  onChange: (id: string, data: Record<string, unknown>) => void;
};

export function PropertiesPanel({ node, onChange }: PanelProps) {
  if (!node) {
    return (
      <aside className="w-[280px] shrink-0 border-l bg-white flex items-center justify-center">
        <p className="text-xs text-[#A1A1AA] text-center px-4">
          Selecione um nó para editar suas propriedades
        </p>
      </aside>
    );
  }

  function update(patch: Record<string, unknown>) {
    onChange(node!.id, { ...(node!.data as Record<string, unknown>), ...patch });
  }

  return (
    <aside className="w-[280px] shrink-0 border-l bg-white overflow-y-auto">
      <div className="px-4 py-3 border-b">
        <p className="text-xs font-semibold text-[#18181B]">{node.type?.replace("Node", "") ?? "Nó"}</p>
        <p className="text-[10px] text-[#A1A1AA] font-mono mt-0.5">{node.id}</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {node.type === "TextNode" && (
          <TextPanel data={node.data as TextNodeData} update={update} />
        )}
        {node.type === "BrandIDNode" && (
          <BrandPanel data={node.data as BrandIDNodeData} update={update} />
        )}
        {node.type === "ImageLayoutNode" && (
          <LayoutPanel data={node.data as ImageLayoutNodeData} update={update} />
        )}
        {node.type === "GenerateNode" && (
          <GeneratePanel data={node.data as GenerateNodeData} update={update} />
        )}
        {node.type === "OutputNode" && (
          <p className="text-xs text-[#71717A]">Nó de saída — sem configurações.</p>
        )}
      </div>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-[#52525B] uppercase tracking-wider mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function TextPanel({ data, update }: { data: TextNodeData; update: (p: Record<string, unknown>) => void }) {
  return (
    <>
      <Field label="Prompt principal">
        <textarea
          value={data.mainPrompt}
          onChange={(e) => update({ mainPrompt: e.target.value })}
          rows={4}
          className="w-full rounded-lg border px-3 py-2 text-xs text-[#18181B] outline-none focus:border-[#18181B] focus:ring-2 focus:ring-[#18181B]/8 transition-all resize-none"
          placeholder="Descreva a imagem…"
        />
      </Field>
      <Field label="Headline">
        <input type="text" value={data.headline ?? ""} onChange={(e) => update({ headline: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 text-xs text-[#18181B] outline-none focus:border-[#18181B] focus:ring-2 focus:ring-[#18181B]/8 transition-all"
          placeholder="Promoção Insana" />
      </Field>
      <Field label="Subhead">
        <input type="text" value={data.subhead ?? ""} onChange={(e) => update({ subhead: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 text-xs text-[#18181B] outline-none focus:border-[#18181B] focus:ring-2 focus:ring-[#18181B]/8 transition-all"
          placeholder="Toda pizza pela metade…" />
      </Field>
      <Field label="CTA">
        <input type="text" value={data.cta ?? ""} onChange={(e) => update({ cta: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 text-xs text-[#18181B] outline-none focus:border-[#18181B] focus:ring-2 focus:ring-[#18181B]/8 transition-all"
          placeholder="Peça já" />
      </Field>
      <Field label="Disclaimer">
        <input type="text" value={data.disclaimer ?? ""} onChange={(e) => update({ disclaimer: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 text-xs text-[#18181B] outline-none focus:border-[#18181B] focus:ring-2 focus:ring-[#18181B]/8 transition-all"
          placeholder="Válido até 15/05" />
      </Field>
    </>
  );
}

function BrandPanel({ data, update }: { data: BrandIDNodeData; update: (p: Record<string, unknown>) => void }) {
  return (
    <>
      <Field label="Cliente">
        <p className="text-xs text-[#71717A]">
          {data.clientName ?? "Nenhum cliente selecionado"}
          {" "}
          <span className="text-[10px] text-[#A1A1AA]">(selecione no dropdown do nó)</span>
        </p>
      </Field>
      <Field label="Injetar na geração">
        <div className="space-y-2">
          {(["applyPalette", "applyTypography", "applyBrandTone", "applyArtRefs"] as const).map((key) => {
            const labels: Record<string, string> = {
              applyPalette: "Paleta de cores",
              applyTypography: "Tipografia",
              applyBrandTone: "Tom visual",
              applyArtRefs: "Referências de estilo",
            };
            return (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data[key]}
                  onChange={(e) => update({ [key]: e.target.checked })}
                  className="rounded border-[#E5E2DB]"
                />
                <span className="text-xs text-[#52525B]">{labels[key]}</span>
              </label>
            );
          })}
        </div>
      </Field>
    </>
  );
}

function LayoutPanel({ data, update }: { data: ImageLayoutNodeData; update: (p: Record<string, unknown>) => void }) {
  return (
    <>
      <Field label={`Fidelidade: ${data.fidelity}%`}>
        <input
          type="range"
          min={0}
          max={100}
          step={10}
          value={data.fidelity}
          onChange={(e) => update({ fidelity: Number(e.target.value) })}
          className="w-full accent-[#18181B]"
        />
        <p className="text-[10px] text-[#71717A] mt-1">
          {data.fidelity <= 20 && "Influência mínima — inspiração distante."}
          {data.fidelity > 20 && data.fidelity <= 50 && "Influência moderada — pipeline inspiração."}
          {data.fidelity > 50 && data.fidelity <= 80 && "Influência significativa — ControlNet ativo."}
          {data.fidelity > 80 && "Cópia estrutural quase exata — ControlNet máximo."}
        </p>
      </Field>
      <Field label="Modo técnico">
        <select
          value={data.techMode}
          onChange={(e) => update({ techMode: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 text-xs text-[#18181B] outline-none bg-white"
        >
          <option value="auto">Automático (recomendado)</option>
          <option value="force_inspiration">Forçar inspiração</option>
          <option value="force_strict">Forçar rígido (ControlNet)</option>
        </select>
      </Field>
      <Field label="Tipo de estrutura (se rígido)">
        <select
          value={data.controlType}
          onChange={(e) => update({ controlType: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 text-xs text-[#18181B] outline-none bg-white"
        >
          <option value="depth">Profundidade (Depth)</option>
          <option value="canny">Bordas (Canny)</option>
          <option value="mlsd">Linhas (MLSD)</option>
          <option value="openpose">Pose (OpenPose)</option>
        </select>
      </Field>
    </>
  );
}

function GeneratePanel({ data, update }: { data: GenerateNodeData; update: (p: Record<string, unknown>) => void }) {
  return (
    <>
      <Field label="Provider">
        <select
          value={data.preferredProvider}
          onChange={(e) => update({ preferredProvider: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 text-xs text-[#18181B] outline-none bg-white"
        >
          <option value="gpt-image-2">GPT-Image 2</option>
          <option value="nano-banana-2">Nano Banana 2</option>
          <option value="luma">Luma UNI-1.1</option>
        </select>
      </Field>
      <Field label="Aspect ratio">
        <select
          value={data.aspectRatio}
          onChange={(e) => update({ aspectRatio: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 text-xs text-[#18181B] outline-none bg-white"
        >
          <option value="1:1">1:1 (Quadrado)</option>
          <option value="16:9">16:9 (Paisagem)</option>
          <option value="9:16">9:16 (Retrato)</option>
          <option value="4:3">4:3</option>
        </select>
      </Field>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/canvas/PropertiesPanel.tsx
git commit -m "feat: PropertiesPanel with per-node config editors (Text, BrandID, ImageLayout, Generate)"
```

---

### Task 10: ActionBar + CanvasClient + canvas page

Wires everything together: the canvas client component with 3-column layout, drag-to-add nodes, edge creation, and the action bar.

**Files:**
- Create: `src/components/canvas/ActionBar.tsx`
- Create: `src/app/(app)/canvas/CanvasClient.tsx`
- Modify: `src/app/(app)/canvas/page.tsx`

- [ ] **Step 1: Create ActionBar**

```tsx
// src/components/canvas/ActionBar.tsx
"use client";

type ActionBarProps = {
  onSave: () => void;
  onLoad: () => void;
  isSaving: boolean;
};

export function ActionBar({ onSave, onLoad, isSaving }: ActionBarProps) {
  return (
    <div className="h-11 border-t bg-white flex items-center px-4 gap-2 shrink-0">
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className="px-3 py-1.5 rounded text-xs font-medium bg-[#18181B] text-white hover:bg-[#27272A] disabled:opacity-50 transition-colors"
      >
        {isSaving ? "Salvando…" : "💾 Salvar"}
      </button>
      <button
        type="button"
        onClick={onLoad}
        className="px-3 py-1.5 rounded text-xs font-medium border border-[#E5E2DB] text-[#52525B] hover:bg-[#F5F4F1] transition-colors"
      >
        📂 Carregar
      </button>
      <div className="flex-1" />
      <p className="text-[10px] text-[#A1A1AA]">Arraste nós da paleta para o canvas</p>
    </div>
  );
}
```

- [ ] **Step 2: Create CanvasClient**

```tsx
// src/app/(app)/canvas/CanvasClient.tsx
"use client";
import { useCallback, useRef, useState } from "react";
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { nodeTypes } from "@/components/canvas/nodes";
import { edgeTypes } from "@/components/canvas/edges";
import { isValidConnection, getHandleType } from "@/components/canvas/lib/connection";
import { NodePalette } from "@/components/canvas/NodePalette";
import { PropertiesPanel } from "@/components/canvas/PropertiesPanel";
import { ActionBar } from "@/components/canvas/ActionBar";

const DEFAULT_NODES: Node[] = [];
const DEFAULT_EDGES: Edge[] = [];

function makeDefaultData(type: string): Record<string, unknown> {
  switch (type) {
    case "TextNode":
      return { mainPrompt: "" };
    case "BrandIDNode":
      return { applyPalette: true, applyTypography: true, applyBrandTone: true, applyArtRefs: false };
    case "ImageLayoutNode":
      return { fidelity: 70, techMode: "auto", controlType: "depth" };
    case "GenerateNode":
      return { preferredProvider: "gpt-image-2", aspectRatio: "1:1", status: "idle" };
    case "OutputNode":
      return {};
    default:
      return {};
  }
}

export function CanvasClient() {
  const [nodes, setNodes, onNodesChange] = useNodesState(DEFAULT_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(DEFAULT_EDGES);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      const sourceType = getHandleType(params.sourceHandle ?? null);
      const edge: Edge = {
        ...params,
        type: "typed",
        data: { connectionType: sourceType ?? "image" },
        id: `${params.source}-${params.sourceHandle}-${params.target}-${params.targetHandle}`,
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData("application/reactflow");
      if (!type || !rfInstance || !reactFlowWrapper.current) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = rfInstance.screenToFlowPosition({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      });

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: makeDefaultData(type),
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [rfInstance, setNodes]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const onNodeDataChange = useCallback(
    (id: string, data: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data } : n))
      );
      setSelectedNode((sel) => (sel?.id === id ? { ...sel, data } : sel));
    },
    [setNodes]
  );

  const handleSave = useCallback(async () => {
    if (!rfInstance) return;
    setIsSaving(true);
    try {
      const graph = rfInstance.toObject();
      const body = { name: "Workflow", graphJson: JSON.stringify(graph) };

      if (workflowId) {
        await fetch(`/api/workflows/${workflowId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        const res = await fetch("/api/workflows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const data = await res.json() as { id: string };
          setWorkflowId(data.id);
        }
      }
    } finally {
      setIsSaving(false);
    }
  }, [rfInstance, workflowId]);

  const handleLoad = useCallback(async () => {
    const res = await fetch("/api/workflows");
    if (!res.ok) return;
    const data = await res.json() as { workflows: Array<{ id: string; name: string; graphJson: string }> };
    if (data.workflows.length === 0) return;

    const first = data.workflows[0];
    const graph = JSON.parse(first.graphJson) as { nodes: Node[]; edges: Edge[] };
    setNodes(graph.nodes ?? []);
    setEdges(graph.edges ?? []);
    setWorkflowId(first.id);
  }, [setNodes, setEdges]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 min-h-0">
        <NodePalette />
        <div ref={reactFlowWrapper} className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onInit={setRfInstance}
            fitView
            className="bg-[#F5F4F1]"
          >
            <Background color="#E5E2DB" gap={20} />
            <Controls className="!border !border-[#E5E2DB] !shadow-none" />
            <MiniMap className="!border !border-[#E5E2DB] !shadow-none" nodeColor="#E5E2DB" />
          </ReactFlow>
        </div>
        <PropertiesPanel node={selectedNode} onChange={onNodeDataChange} />
      </div>
      <ActionBar onSave={handleSave} onLoad={handleLoad} isSaving={isSaving} />
    </div>
  );
}
```

- [ ] **Step 3: Update canvas page.tsx to use CanvasClient**

```tsx
// src/app/(app)/canvas/page.tsx
import { CanvasClient } from "./CanvasClient";

export default function CanvasPage() {
  return <CanvasClient />;
}
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: no errors (fix any that appear)

- [ ] **Step 5: Commit**

```bash
git add src/components/canvas/ActionBar.tsx src/app/(app)/canvas/CanvasClient.tsx src/app/(app)/canvas/page.tsx
git commit -m "feat: CanvasClient with React Flow, drag-to-add nodes, typed connections, save/load skeleton"
```

---

### Task 11: Workflow API routes

**Files:**
- Create: `src/app/api/workflows/route.ts`
- Create: `src/app/api/workflows/[id]/route.ts`

- [ ] **Step 1: Create GET/POST /api/workflows**

```typescript
// src/app/api/workflows/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCloudflareBindings } from "@/lib/cloudflare";
import { getUserContext } from "@/lib/user-context";
import { generateId } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth-session";

async function getAuthEmail(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const { env } = await import("@opennextjs/cloudflare").then((m) => m.getCloudflareContext({ async: true }));
  const secret = (env as Record<string, string | undefined>).AUTH_SECRET ?? "";
  if (!secret) return null;
  const session = await verifySessionToken(token, secret);
  return session?.email ?? null;
}

export async function GET() {
  const email = await getAuthEmail();
  if (!email) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { DB } = getCloudflareBindings();
  const { orgId } = await getUserContext(email, DB);

  const rows = await DB
    .prepare("SELECT id, name, graph_json, created_at, updated_at FROM workflows WHERE org_id = ? ORDER BY updated_at DESC LIMIT 20")
    .bind(orgId)
    .all<{ id: string; name: string; graph_json: string; created_at: number; updated_at: number }>();

  const workflows = (rows.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    graphJson: r.graph_json,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  return NextResponse.json({ workflows });
}

export async function POST(request: Request) {
  const email = await getAuthEmail();
  if (!email) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { name?: string; graphJson?: string };
  const name = body.name?.trim() || "Workflow sem nome";
  const graphJson = body.graphJson ?? "{}";

  const { DB } = getCloudflareBindings();
  const { userId, orgId } = await getUserContext(email, DB);
  const id = generateId();

  await DB
    .prepare("INSERT INTO workflows (id, org_id, name, graph_json, created_by) VALUES (?, ?, ?, ?, ?)")
    .bind(id, orgId, name, graphJson, userId)
    .run();

  return NextResponse.json({ id }, { status: 201 });
}
```

- [ ] **Step 2: Create GET/PUT/DELETE /api/workflows/[id]**

```typescript
// src/app/api/workflows/[id]/route.ts
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
  const { env } = await getCloudflareContext({ async: true });
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
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

Expected: no errors

- [ ] **Step 4: Run all tests**

```bash
npm test
```

Expected: all previous tests still PASS (user-context + connection tests)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/workflows/
git commit -m "feat: workflow CRUD API routes (GET list, POST create, GET/PUT/DELETE by id)"
```

---

### End of Plan 2

**Verify everything works:**

```bash
npm run typecheck && npm test
```

Push to trigger Cloudflare deploy:

```bash
git push origin main
```

After deploy, test manually:
1. Navigate to `/canvas`
2. Drag a TextNode from the palette onto the canvas
3. Click the node — properties panel opens on the right
4. Edit the prompt — the node updates in real time
5. Drag a GenerateNode and connect TextNode's green handle to GenerateNode's text-in (green) handle
6. Click Save — workflow persists to D1
