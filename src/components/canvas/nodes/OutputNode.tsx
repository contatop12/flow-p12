"use client";

import { useCallback, useRef, useState } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import { Play } from "lucide-react";
import type { GenerationRequest, PreferredProvider } from "@/types";
import { resolveGenerationInputs } from "@/components/canvas/lib/resolveGenerationInputs";
import { NodeShell } from "./NodeShell";

export type OutputNodeData = {
  imageUrl?: string;
  savedToGallery?: boolean;
  preferredProvider?: PreferredProvider;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3";
  status?: "idle" | "running" | "done" | "error";
  workflowId?: string;
};

export function OutputNode({ id, data, selected }: NodeProps) {
  const d = data as OutputNodeData;
  const { getNodes, getEdges, setNodes } = useReactFlow();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);

  const runGenerate = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    const nodes = getNodes();
    const edges = getEdges();
    const resolved = resolveGenerationInputs(id, nodes, edges);
    if (resolved.resolutionError || !resolved.textPayload) {
      setError(resolved.resolutionError ?? "Sem dados de texto.");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const req: GenerationRequest = {
        nodeId: id,
        nodeType: "Output",
        textPayload: resolved.textPayload,
        brandPayload: resolved.brandPayload,
        layoutPayload: resolved.layoutPayload,
        preferredProvider: d.preferredProvider ?? "gpt-image-2",
        workflowId: d.workflowId,
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
      const serveUrl = `/api/images/${result.id}/serve`;
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id
            ? {
                ...n,
                data: {
                  ...n.data,
                  imageUrl: serveUrl,
                  status: "done" as const,
                },
              }
            : n
        )
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, status: "error" as const } } : n
        )
      );
    } finally {
      busyRef.current = false;
      setGenerating(false);
    }
  }, [d.preferredProvider, d.workflowId, getEdges, getNodes, id, setNodes]);

  return (
    <NodeShell selected={selected} className="w-56 relative pb-10">
      <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium tracking-tight text-zinc-200">Output</span>
        {d.savedToGallery && (
          <span className="text-[10px] text-emerald-400 shrink-0">Galeria</span>
        )}
      </div>

      <div className="px-3 py-2 space-y-2">
        {d.imageUrl ? (
          <div className="space-y-2">
            <img
              src={d.imageUrl}
              alt="Resultado"
              className="w-full rounded-lg border border-white/10 object-cover max-h-[180px] nodrag nopan"
              draggable={false}
            />
            <a
              href={d.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-[10px] text-muted hover:text-zinc-200 transition-colors nodrag nopan"
            >
              Abrir
            </a>
          </div>
        ) : (
          <div className="w-full min-h-[5.5rem] rounded-lg border border-dashed border-white/15 flex items-center justify-center px-2">
            <p className="text-[10px] text-center text-subtle leading-snug">
              {generating ? "A gerar…" : "Ligue Text, Brand e Image-Layout. Depois use o play."}
            </p>
          </div>
        )}

        {error && (
          <p className="text-[10px] text-red-400 leading-snug" role="alert">
            {error}
          </p>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        id="text-in"
        style={{
          background: "#84cc16",
          border: "2px solid #18181b",
          width: 10,
          height: 10,
          left: -6,
          top: "32%",
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="brand-in"
        style={{
          background: "#a855f7",
          border: "2px solid #18181b",
          width: 10,
          height: 10,
          left: -6,
          top: "50%",
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="layout-in"
        style={{
          background: "#3b82f6",
          border: "2px solid #18181b",
          width: 10,
          height: 10,
          left: -6,
          top: "68%",
        }}
      />

      <button
        type="button"
        onClick={runGenerate}
        disabled={generating}
        aria-label={d.imageUrl ? "Gerar novamente" : "Gerar"}
        className="nodrag nopan absolute bottom-2 right-2 flex size-9 items-center justify-center rounded-full border border-white/15 bg-zinc-800 text-zinc-100 shadow-md hover:bg-zinc-700 hover:border-white/25 disabled:opacity-40 transition-colors"
      >
        <Play className="size-4 translate-x-0.5" fill="currentColor" aria-hidden />
      </button>
    </NodeShell>
  );
}
