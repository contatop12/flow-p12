"use client";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Type } from "lucide-react";
import { NodeShell } from "./NodeShell";

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
    <NodeShell selected={selected} className="w-48">
      <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2">
        <Type className="size-3.5 text-zinc-500 shrink-0" aria-hidden />
        <span className="text-[11px] font-medium tracking-tight text-zinc-200">Text</span>
      </div>
      <div className="px-3 py-2">
        <p className="text-xs text-muted line-clamp-2 leading-relaxed">
          {d.mainPrompt || <span className="text-subtle italic">Prompt vazio…</span>}
        </p>
        <div className="mt-1.5 flex gap-1 flex-wrap">
          {d.headline && (
            <span className="text-[10px] bg-emerald-950/60 text-emerald-400/90 rounded px-1 font-medium border border-emerald-800/40">
              H
            </span>
          )}
          {d.subhead && (
            <span className="text-[10px] bg-emerald-950/60 text-emerald-400/90 rounded px-1 font-medium border border-emerald-800/40">
              S
            </span>
          )}
          {d.cta && (
            <span className="text-[10px] bg-emerald-950/60 text-emerald-400/90 rounded px-1 font-medium border border-emerald-800/40">
              CTA
            </span>
          )}
          {d.disclaimer && (
            <span className="text-[10px] bg-emerald-950/60 text-emerald-400/90 rounded px-1 font-medium border border-emerald-800/40">
              D
            </span>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="text-out"
        style={{
          background: "#84cc16",
          border: "2px solid #18181b",
          width: 10,
          height: 10,
          right: -6,
        }}
      />
    </NodeShell>
  );
}
