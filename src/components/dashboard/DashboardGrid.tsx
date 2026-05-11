"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GripVertical } from "lucide-react";
import GridLayout, { WidthProvider } from "react-grid-layout";
import { clsx } from "clsx";

const STORAGE_KEY = "flow-p12-dashboard-layout";

type ItemLayout = GridLayout.Layout;

const DEFAULT_LAYOUT: ItemLayout[] = [
  { i: "kpi-workflows", x: 0, y: 0, w: 3, h: 2 },
  { i: "kpi-clients", x: 3, y: 0, w: 3, h: 2 },
  { i: "kpi-images", x: 6, y: 0, w: 3, h: 2 },
  { i: "getting-started", x: 0, y: 2, w: 6, h: 4 },
  { i: "chart", x: 6, y: 2, w: 6, h: 4 },
];

const GridLayoutWithWidth = WidthProvider(GridLayout);

function isValidLayout(data: unknown): data is ItemLayout[] {
  if (!Array.isArray(data)) return false;
  for (const item of data) {
    if (!item || typeof item !== "object") return false;
    const o = item as Record<string, unknown>;
    if (typeof o.i !== "string") return false;
    for (const k of ["x", "y", "w", "h"] as const) {
      const n = o[k];
      if (typeof n !== "number" || !Number.isFinite(n)) return false;
    }
  }
  const ids = new Set((data as ItemLayout[]).map((x) => x.i));
  return DEFAULT_LAYOUT.every((d) => ids.has(d.i));
}

export function DashboardGrid() {
  const [layout, setLayout] = useState<ItemLayout[]>(DEFAULT_LAYOUT);
  const [hydrated, setHydrated] = useState(false);
  const [editLayout, setEditLayout] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setHydrated(true);
        return;
      }
      const parsed = JSON.parse(raw) as unknown;
      if (isValidLayout(parsed)) {
        setLayout(parsed);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const scheduleSave = useCallback((next: ItemLayout[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* quota / private mode */
      }
    }, 300);
  }, []);

  const onLayoutChange = useCallback(
    (next: ItemLayout[]) => {
      setLayout(next);
      scheduleSave(next);
    },
    [scheduleSave]
  );

  const dotPatternStyle = useMemo(
    () =>
      ({
        backgroundColor: "#18181B",
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)",
        backgroundSize: "22px 22px",
      }) as const,
    []
  );

  return (
    <div className="w-full max-w-6xl">
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => setEditLayout((v) => !v)}
          className={clsx(
            "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
            editLayout
              ? "border-[#0D9488] bg-[#CCFBF1] text-[#0F766E]"
              : "border-[#E5E2DB] bg-white text-[#52525B] hover:bg-[#FAFAF9]"
          )}
        >
          {editLayout ? "Concluir" : "Editar layout"}
        </button>
      </div>

      <div
        className="rounded-xl border border-[#27272A] p-1 shadow-inner"
        style={dotPatternStyle}
      >
        {hydrated ? (
          <GridLayoutWithWidth
            className="dashboard-rgl layout"
            layout={layout}
            cols={12}
            rowHeight={60}
            margin={[16, 16]}
            containerPadding={[16, 16]}
            onLayoutChange={onLayoutChange}
            isDraggable={editLayout}
            isResizable={editLayout}
            draggableHandle=".widget-drag-handle"
            compactType={null}
            preventCollision={false}
          >
            <div key="kpi-workflows" className="h-full">
              <WidgetShell editLayout={editLayout}>
                <StatCard label="Workflows" value="0" />
              </WidgetShell>
            </div>
            <div key="kpi-clients" className="h-full">
              <WidgetShell editLayout={editLayout}>
                <StatCard label="Clientes" value="0" />
              </WidgetShell>
            </div>
            <div key="kpi-images" className="h-full">
              <WidgetShell editLayout={editLayout}>
                <StatCard label="Imagens geradas" value="0" />
              </WidgetShell>
            </div>
            <div key="getting-started" className="h-full">
              <WidgetShell editLayout={editLayout}>
                <GettingStarted />
              </WidgetShell>
            </div>
            <div key="chart" className="h-full">
              <WidgetShell editLayout={editLayout}>
                <div className="flex h-full flex-col justify-center rounded-xl border border-dashed border-[#E5E2DB] bg-white/95 p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#A1A1AA]">
                    Gráfico
                  </p>
                  <p className="mt-2 text-sm text-[#71717A]">
                    Área reservada para métricas ou gráficos.
                  </p>
                </div>
              </WidgetShell>
            </div>
          </GridLayoutWithWidth>
        ) : (
          <div className="min-h-[400px] rounded-lg bg-[#18181B]/50" aria-hidden />
        )}
      </div>
    </div>
  );
}

function WidgetShell({
  editLayout,
  children,
}: {
  editLayout: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-full min-h-0">
      {editLayout ? (
        <button
          type="button"
          className="widget-drag-handle absolute right-2 top-2 z-10 flex h-8 w-8 cursor-grab items-center justify-center rounded-md border border-[#E5E2DB] bg-white text-[#71717A] shadow-sm active:cursor-grabbing"
          aria-label="Arrastar widget"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      ) : null}
      <div className="h-full min-h-0 overflow-auto pr-1 pt-1">{children}</div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-[#E5E2DB] bg-white p-5 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#A1A1AA]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-[#18181B]">
        {value}
      </p>
    </div>
  );
}

function GettingStarted() {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-[#E5E2DB] bg-white p-6 shadow-sm">
      <p className="mb-5 text-xs font-medium uppercase tracking-widest text-[#A1A1AA]">
        Como começar
      </p>
      <ol className="space-y-4">
        <Step n="01">
          Cadastre um cliente em{" "}
          <a
            href="/clients"
            className="font-medium text-[#18181B] underline decoration-[#E5E2DB] underline-offset-2 transition-colors hover:decoration-[#18181B]"
          >
            Clientes
          </a>{" "}
          com paleta, fonte e tom visual.
        </Step>
        <Step n="02">
          Abra o{" "}
          <a
            href="/canvas"
            className="font-medium text-[#18181B] underline decoration-[#E5E2DB] underline-offset-2 transition-colors hover:decoration-[#18181B]"
          >
            Canvas
          </a>{" "}
          e arraste os nós Text, Brand ID e Generate.
        </Step>
        <Step n="03">Conecte e execute para gerar sua primeira imagem.</Step>
      </ol>
    </div>
  );
}

function Step({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-4">
      <span className="mt-0.5 w-6 shrink-0 text-xs font-medium tabular-nums text-[#A1A1AA]">
        {n}
      </span>
      <p className="text-sm leading-relaxed text-[#52525B]">{children}</p>
    </li>
  );
}
