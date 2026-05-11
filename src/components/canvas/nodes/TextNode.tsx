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
