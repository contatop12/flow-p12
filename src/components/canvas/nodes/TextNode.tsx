"use client";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Type } from "lucide-react";
import { NodeShell, NodeCardHeader } from "./NodeShell";
import { HANDLE_COLORS, handleProps } from "./canvasHandleStyles";

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
    <NodeShell selected={selected} className="w-64">
      <NodeCardHeader title="Text" icon={Type} />
      <div className="px-3.5 pb-3.5 pt-0.5">
        <div className="rounded-xl bg-black/30 px-3.5 py-3 min-h-[5.5rem]">
          <p className="text-[13px] text-zinc-300 leading-[1.55] line-clamp-[10] whitespace-pre-wrap">
            {d.mainPrompt || <span className="text-zinc-500 italic">Prompt vazio…</span>}
          </p>
        </div>
        <div className="mt-2 flex gap-1 flex-wrap">
          {d.headline && (
            <span className="text-[10px] rounded-md bg-white/[0.06] px-1.5 py-0.5 font-medium text-zinc-400">
              H
            </span>
          )}
          {d.subhead && (
            <span className="text-[10px] rounded-md bg-white/[0.06] px-1.5 py-0.5 font-medium text-zinc-400">
              S
            </span>
          )}
          {d.cta && (
            <span className="text-[10px] rounded-md bg-white/[0.06] px-1.5 py-0.5 font-medium text-zinc-400">
              CTA
            </span>
          )}
          {d.disclaimer && (
            <span className="text-[10px] rounded-md bg-white/[0.06] px-1.5 py-0.5 font-medium text-zinc-400">
              D
            </span>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="text-out"
        style={handleProps(HANDLE_COLORS.text, "right")}
      />
    </NodeShell>
  );
}
