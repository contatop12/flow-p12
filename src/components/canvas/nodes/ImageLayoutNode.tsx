"use client";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { clsx } from "clsx";

export type ImageLayoutNodeData = {
  imageUrl?: string;
  fidelity: number;
  techMode: "auto" | "force_inspiration" | "force_strict";
  controlType: "canny" | "depth" | "mlsd" | "openpose";
};

export function ImageLayoutNode({ data, selected }: NodeProps) {
  const d = data as ImageLayoutNodeData;
  const isControlNet =
    d.techMode === "force_strict" ||
    (d.techMode === "auto" && d.fidelity > 50);

  return (
    <div className={clsx(
      "w-52 rounded-lg border bg-white shadow-sm text-left",
      selected && "ring-2 ring-[#3b82f6] ring-offset-1"
    )}>
      <div className="px-3 py-2 border-b flex items-center gap-1.5">
        <span className="text-xs">📐</span>
        <span className="text-xs font-semibold text-[#18181B]">Image-Layout</span>
      </div>
      <div className="px-3 py-2 space-y-2">
        {d.imageUrl ? (
          <img
            src={d.imageUrl}
            alt="Layout reference"
            className="w-full h-20 object-cover rounded border"
          />
        ) : (
          <div className="w-full h-16 rounded border border-dashed border-[#E5E2DB] flex items-center justify-center">
            <p className="text-[10px] text-[#A1A1AA]">Arraste imagem</p>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#71717A]">Fidelidade</span>
          <span className="text-[10px] font-semibold text-[#18181B]">{d.fidelity}%</span>
        </div>
        {isControlNet && (
          <div className="flex items-center gap-1 bg-[#EFF6FF] rounded px-2 py-1">
            <span className="text-[10px] text-[#3b82f6] font-medium">⚙ ControlNet · {d.controlType}</span>
          </div>
        )}
      </div>
      {/* Image input handle (accepts image-out from ImageInput node) */}
      <Handle
        type="target"
        position={Position.Left}
        id="image-in"
        style={{
          background: "#9ca3af",
          border: "2px solid white",
          width: 10,
          height: 10,
          left: -6,
        }}
      />
      {/* Layout output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="layout-out"
        style={{
          background: "#3b82f6",
          border: "2px solid white",
          width: 10,
          height: 10,
          right: -6,
        }}
      />
    </div>
  );
}
