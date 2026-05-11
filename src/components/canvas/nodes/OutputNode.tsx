"use client";

import { useCallback, useRef, useState } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import { Image as ImageIcon, Play } from "lucide-react";
import type { GenerationRequest, PreferredProvider } from "@/types";
import { resolveGenerationInputs } from "@/components/canvas/lib/resolveGenerationInputs";
import { NodeShell, NodeCardHeader } from "./NodeShell";
import { HANDLE_COLORS, handleProps } from "./canvasHandleStyles";

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
    <NodeShell selected={selected} className="w-56 relative pb-7">
      <NodeCardHeader
        title="Output"
        icon={ImageIcon}
        right={
          d.savedToGallery ? (
            <span className="text-[10px] text-emerald-400/95 shrink-0">Galeria</span>
          ) : undefined
        }
      />

      <div className="px-3.5 pb-3.5 pt-0.5 space-y-2">
        {d.imageUrl ? (
          <div className="space-y-2">
            <div className="rounded-2xl bg-white p-1.5">
              <img
                src={d.imageUrl}
                alt="Resultado"
                className="w-full rounded-[14px] object-cover max-h-[200px] nodrag nopan"
                draggable={false}
              />
            </div>
            <a
              href={d.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors nodrag nopan"
            >
              Abrir
            </a>
          </div>
        ) : (
          <div className="w-full min-h-[5.75rem] rounded-2xl bg-black/25 flex items-center justify-center px-3 py-2">
            <p className="text-[11px] text-center text-zinc-500 leading-snug">
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
        style={handleProps(HANDLE_COLORS.text, "left", "32%")}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="brand-in"
        style={handleProps(HANDLE_COLORS.brand, "left", "50%")}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="layout-in"
        style={handleProps(HANDLE_COLORS.layout, "left", "68%")}
      />

      <button
        type="button"
        onClick={runGenerate}
        disabled={generating}
        aria-label={d.imageUrl ? "Gerar novamente" : "Gerar"}
        className="nodrag nopan absolute bottom-1.5 right-1.5 flex size-6 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.04] text-zinc-500 hover:text-zinc-200 hover:border-white/20 hover:bg-white/[0.08] disabled:opacity-35 transition-colors"
      >
        <Play className="size-2.5 ml-px" strokeWidth={2} aria-hidden />
      </button>
    </NodeShell>
  );
}
