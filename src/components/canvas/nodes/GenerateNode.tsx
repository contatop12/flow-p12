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
