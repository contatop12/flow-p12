"use client";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { clsx } from "clsx";

export type BrandIDNodeData = {
  clientId?: string;
  clientName?: string;
  palette?: string[];
  applyPalette: boolean;
  applyTypography: boolean;
  applyBrandTone: boolean;
  applyArtRefs: boolean;
};

export function BrandIDNode({ data, selected }: NodeProps) {
  const d = data as BrandIDNodeData;

  return (
    <div className={clsx(
      "w-52 rounded-lg border bg-white shadow-sm text-left",
      selected && "ring-2 ring-[#a855f7] ring-offset-1"
    )}>
      <div className="px-3 py-2 border-b flex items-center gap-1.5">
        <span className="text-xs">🎨</span>
        <span className="text-xs font-semibold text-[#18181B]">Brand ID</span>
      </div>
      <div className="px-3 py-2 space-y-1.5">
        <p className="text-xs font-medium text-[#18181B]">
          {d.clientName || (
            <span className="text-[#A1A1AA] italic">Selecionar cliente…</span>
          )}
        </p>
        {d.palette && d.palette.length > 0 && (
          <div className="flex gap-0.5">
            {d.palette.slice(0, 6).map((color) => (
              <span
                key={color}
                className="w-3 h-3 rounded-sm border border-white shadow-sm inline-block"
                style={{ background: color }}
              />
            ))}
          </div>
        )}
        <div className="flex gap-1 flex-wrap pt-0.5">
          <Toggle active={d.applyPalette} label="P" />
          <Toggle active={d.applyTypography} label="T" />
          <Toggle active={d.applyBrandTone} label="V" />
          <Toggle active={d.applyArtRefs} label="R" />
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="brand-out"
        style={{
          background: "#a855f7",
          border: "2px solid white",
          width: 10,
          height: 10,
          right: -6,
        }}
      />
    </div>
  );
}

function Toggle({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={clsx(
      "text-[10px] rounded px-1 font-medium",
      active
        ? "bg-[#F5F3FF] text-[#7C3AED]"
        : "bg-[#F5F4F1] text-[#A1A1AA]"
    )}>
      {label}
    </span>
  );
}
