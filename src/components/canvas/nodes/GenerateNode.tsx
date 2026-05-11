// src/components/canvas/nodes/GenerateNode.tsx
/** Nó legado: mantido para workflows antigos guardados. Não aparece na paleta. */
"use client";

import { useCallback, useRef, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Play, Sparkles } from "lucide-react";
import type { GenerationRequest, TextPayload, BrandPayload, LayoutPayload } from "@/types";
import { NodeShell, NodeCardHeader } from "./NodeShell";
import { HANDLE_COLORS, handleProps } from "./canvasHandleStyles";

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
    <NodeShell selected={selected} className="w-56 relative pb-7">
      <NodeCardHeader
        title={nodeData.label ?? "Generate"}
        icon={Sparkles}
        right={
          generating ? (
            <span className="text-[10px] text-zinc-500 animate-pulse shrink-0">…</span>
          ) : generatedImageId ? (
            <span className="text-[10px] text-emerald-400 shrink-0">ok</span>
          ) : status === "error" ? (
            <span className="text-[10px] text-red-400 shrink-0">erro</span>
          ) : undefined
        }
      />

      <div className="px-3.5 pb-3.5 pt-0.5 space-y-2">
        {generatedImageId ? (
          <div className="rounded-2xl bg-white p-1.5 overflow-hidden">
            <img
              src={`/api/images/${generatedImageId}/serve`}
              alt="Gerado"
              className="w-full aspect-square object-cover rounded-[14px] nodrag nopan"
              draggable={false}
            />
          </div>
        ) : nodeData.outputImageUrl ? (
          <div className="rounded-2xl bg-white p-1.5">
            <img
              src={nodeData.outputImageUrl}
              alt="Generated"
              className="w-full h-28 object-cover rounded-[14px] nodrag nopan"
              draggable={false}
            />
          </div>
        ) : (
          <div className="w-full h-24 rounded-2xl bg-black/25 flex items-center justify-center">
            <p className="text-[11px] text-zinc-500">Sem saída ainda</p>
          </div>
        )}

        {nodeData.forcedPipeline && (
          <div className="rounded-lg bg-amber-950/35 px-2 py-1.5 ring-1 ring-inset ring-amber-500/25">
            <p className="text-[10px] text-amber-200/90">{nodeData.forcedPipeline}</p>
          </div>
        )}

        <div className="flex items-center justify-between px-0.5">
          <span className="text-[10px] text-zinc-500">{PROVIDER_LABELS[provider] ?? provider}</span>
          {nodeData.estimatedCost !== undefined && (
            <span className="text-[10px] text-zinc-400">${nodeData.estimatedCost.toFixed(3)}</span>
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
        className="nodrag nopan absolute bottom-1.5 right-1.5 flex size-6 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.04] text-zinc-500 hover:text-zinc-200 hover:border-white/20 hover:bg-white/[0.08] disabled:opacity-35 transition-colors"
      >
        <Play className="size-2.5 ml-px" strokeWidth={2} aria-hidden />
      </button>

      <Handle
        type="target"
        position={Position.Left}
        id="text-in"
        style={handleProps(HANDLE_COLORS.text, "left", "35%")}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="brand-in"
        style={handleProps(HANDLE_COLORS.brand, "left", "55%")}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="layout-in"
        style={handleProps(HANDLE_COLORS.layout, "left", "75%")}
      />

      <Handle
        type="source"
        position={Position.Right}
        id="image-out"
        style={handleProps(HANDLE_COLORS.image, "right")}
      />
    </NodeShell>
  );
}
