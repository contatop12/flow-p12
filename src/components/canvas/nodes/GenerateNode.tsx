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

  const provider = nodeData.preferredProvider ?? "gpt-image-2";
  const status = nodeData.status ?? "idle";

  return (
    <div
      className={`w-56 rounded-lg border bg-white shadow-sm transition-shadow text-left ${
        selected ? "shadow-md ring-2 ring-[#18181B] ring-offset-1" : ""
      }`}
    >
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">✨</span>
          <span className="text-xs font-semibold text-[#18181B]">Generate</span>
        </div>
        {generating && (
          <span className="text-[10px] text-[#71717A] animate-pulse">gerando…</span>
        )}
        {!generating && generatedImageId && (
          <span className="text-[10px] text-[#16A34A]">✓</span>
        )}
        {!generating && status === "error" && (
          <span className="text-[10px] text-red-500">erro</span>
        )}
      </div>

      <div className="px-3 py-2 space-y-2">
        {generatedImageId ? (
          <div className="rounded-lg overflow-hidden border border-[#E5E2DB]">
            <img
              src={`/api/images/${generatedImageId}/serve`}
              alt="Gerado"
              className="w-full aspect-square object-cover"
            />
          </div>
        ) : nodeData.outputImageUrl ? (
          <img
            src={nodeData.outputImageUrl}
            alt="Generated"
            className="w-full h-28 object-cover rounded border"
          />
        ) : (
          <div className="w-full h-20 rounded border border-dashed border-[#E5E2DB] flex items-center justify-center">
            <p className="text-[10px] text-[#A1A1AA]">Sem saída ainda</p>
          </div>
        )}

        {nodeData.forcedPipeline && (
          <div className="bg-[#FFF7ED] rounded px-2 py-1">
            <p className="text-[10px] text-[#EA580C]">⚠ {nodeData.forcedPipeline}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#A1A1AA]">
            {PROVIDER_LABELS[provider] ?? provider}
          </span>
          {nodeData.estimatedCost !== undefined && (
            <span className="text-[10px] text-[#71717A]">${nodeData.estimatedCost.toFixed(3)}</span>
          )}
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="w-full rounded bg-[#18181B] py-1.5 text-xs font-medium text-white hover:bg-[#27272A] disabled:opacity-40 transition-colors"
        >
          {generating ? "Gerando…" : generatedImageId ? "Gerar novamente" : "▶ Gerar"}
        </button>

        {error && (
          <p className="text-[10px] text-red-500 truncate" title={error}>{error}</p>
        )}
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
