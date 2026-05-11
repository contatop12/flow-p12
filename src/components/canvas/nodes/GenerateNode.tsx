// src/components/canvas/nodes/GenerateNode.tsx
/** Nó legado: mantido para workflows antigos guardados. Não aparece na paleta. */
"use client";

import { useCallback, useRef, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Play, Sparkles } from "lucide-react";
import type { GenerationRequest, TextPayload, BrandPayload, LayoutPayload } from "@/types";
import { NodeShell } from "./NodeShell";

export interface GenerateNodeData extends Record<string, unknown> {
  label?: string;
  textPayload?: TextPayload;
  brandPayload?: BrandPayload;
  layoutPayload?: LayoutPayload;
  workflowId?: string;
  preferredProvider?: "gpt-image-2" | "nano-banana-2" | "luma";
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3";
  status?: "idle" | "running" | "done" | "error";
  outputImageUrl?: string;
  forcedPipeline?: string;
  estimatedCost?: number;
}

const PROVIDER_LABELS: Record<string, string> = {
  "gpt-image-2": "GPT-Image 2",
  "nano-banana-2": "Nano Banana",
  luma: "Luma UNI-1.1",
};

export function GenerateNode({ id, data, selected }: NodeProps) {
  const nodeData = data as GenerateNodeData;
  const [generating, setGenerating] = useState(false);
  const [generatedImageId, setGeneratedImageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);

  const handleGenerate = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
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
      busyRef.current = false;
      setGenerating(false);
    }
  }, [id, nodeData.brandPayload, nodeData.layoutPayload, nodeData.textPayload]);

  const provider = nodeData.preferredProvider ?? "gpt-image-2";
  const status = nodeData.status ?? "idle";

  return (
    <NodeShell selected={selected} className="w-56 relative pb-10">
      <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="size-3.5 text-zinc-500 shrink-0" aria-hidden />
          <span className="text-[11px] font-medium tracking-tight text-zinc-200 truncate">Generate</span>
        </div>
        {generating && (
          <span className="text-[10px] text-subtle animate-pulse shrink-0">…</span>
        )}
        {!generating && generatedImageId && (
          <span className="text-[10px] text-emerald-400 shrink-0">ok</span>
        )}
        {!generating && status === "error" && (
          <span className="text-[10px] text-red-400 shrink-0">erro</span>
        )}
      </div>

      <div className="px-3 py-2 space-y-2">
        {generatedImageId ? (
          <div className="rounded-lg overflow-hidden border border-white/10">
            <img
              src={`/api/images/${generatedImageId}/serve`}
              alt="Gerado"
              className="w-full aspect-square object-cover nodrag nopan"
              draggable={false}
            />
          </div>
        ) : nodeData.outputImageUrl ? (
          <img
            src={nodeData.outputImageUrl}
            alt="Generated"
            className="w-full h-28 object-cover rounded-lg border border-white/10 nodrag nopan"
            draggable={false}
          />
        ) : (
          <div className="w-full h-20 rounded-lg border border-dashed border-white/15 flex items-center justify-center">
            <p className="text-[10px] text-subtle">Sem saída ainda</p>
          </div>
        )}

        {nodeData.forcedPipeline && (
          <div className="rounded border border-amber-500/30 bg-amber-950/30 px-2 py-1">
            <p className="text-[10px] text-amber-200/90">{nodeData.forcedPipeline}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-subtle">{PROVIDER_LABELS[provider] ?? provider}</span>
          {nodeData.estimatedCost !== undefined && (
            <span className="text-[10px] text-muted">${nodeData.estimatedCost.toFixed(3)}</span>
          )}
        </div>

        {error && (
          <p className="text-[10px] text-red-400 truncate" title={error}>
            {error}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={generating}
        aria-label={generatedImageId ? "Gerar novamente" : "Gerar"}
        className="nodrag nopan absolute bottom-2 right-2 flex size-9 items-center justify-center rounded-full border border-white/15 bg-zinc-800 text-zinc-100 shadow-md hover:bg-zinc-700 hover:border-white/25 disabled:opacity-40 transition-colors"
      >
        <Play className="size-4 translate-x-0.5" fill="currentColor" aria-hidden />
      </button>

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
          top: "35%",
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
          top: "55%",
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
          top: "75%",
        }}
      />

      <Handle
        type="source"
        position={Position.Right}
        id="image-out"
        style={{
          background: "#9ca3af",
          border: "2px solid #18181b",
          width: 10,
          height: 10,
          right: -6,
        }}
      />
    </NodeShell>
  );
}
